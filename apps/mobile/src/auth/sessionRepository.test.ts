import type { SessionTokens } from '@/src/auth/api';
import {
  accessTokenNeedsRefresh,
  type SecretStorage,
  SessionRepository,
} from '@/src/auth/sessionRepository';

const now = Date.parse('2026-08-26T12:00:00Z');
const session: SessionTokens = {
  accessToken: 'a'.repeat(64),
  refreshToken: 'r'.repeat(43),
  accessExpiresAt: '2026-08-26T12:15:00Z',
  sessionExpiresAt: '2026-08-28T12:00:00Z',
};

class MemorySecretStorage implements SecretStorage {
  value: string | null = null;
  readonly deletedKeys: string[] = [];
  readonly writtenValues: string[] = [];

  async deleteItemAsync(key: string): Promise<void> {
    this.deletedKeys.push(key);
    this.value = null;
  }

  async getItemAsync(): Promise<string | null> {
    return this.value;
  }

  async setItemAsync(_key: string, value: string): Promise<void> {
    this.writtenValues.push(value);
    this.value = value;
  }
}

describe('SessionRepository', () => {
  it('persists and restores a valid session without plaintext credentials', async () => {
    const storage = new MemorySecretStorage();
    const repository = new SessionRepository(storage, () => now);

    await repository.save(session);
    await expect(repository.load()).resolves.toEqual(session);
    expect(storage.writtenValues).toHaveLength(1);
    expect(storage.writtenValues[0]).not.toContain('password');
    expect(storage.writtenValues[0]).not.toContain('username');
  });

  it('clears expired sessions before returning them', async () => {
    const storage = new MemorySecretStorage();
    storage.value = JSON.stringify({
      ...session,
      accessExpiresAt: '2026-08-25T11:00:00Z',
      sessionExpiresAt: '2026-08-25T12:00:00Z',
    });
    const repository = new SessionRepository(storage, () => now);

    await expect(repository.load()).resolves.toBeNull();
    expect(storage.deletedKeys).toHaveLength(1);
  });

  it.each(['not-json', '{}', JSON.stringify({ ...session, refreshToken: 'short' })])(
    'clears malformed stored data %#',
    async (value) => {
      const storage = new MemorySecretStorage();
      storage.value = value;
      const repository = new SessionRepository(storage, () => now);

      await expect(repository.load()).resolves.toBeNull();
      expect(storage.deletedKeys).toHaveLength(1);
    },
  );

  it('refuses to persist an expired session', async () => {
    const storage = new MemorySecretStorage();
    const repository = new SessionRepository(storage, () => now);

    await expect(
      repository.save({
        ...session,
        accessExpiresAt: '2026-08-25T11:00:00Z',
        sessionExpiresAt: '2026-08-25T12:00:00Z',
      }),
    ).rejects.toThrow('invalid or expired session');
    expect(storage.writtenValues).toHaveLength(0);
  });
});

describe('accessTokenNeedsRefresh', () => {
  it('refreshes shortly before access expiry but not earlier', () => {
    expect(accessTokenNeedsRefresh(session, Date.parse('2026-08-26T12:14:29Z'))).toBe(false);
    expect(accessTokenNeedsRefresh(session, Date.parse('2026-08-26T12:14:30Z'))).toBe(true);
  });
});
