import * as SecureStore from 'expo-secure-store';

import type { SessionTokens } from '@/src/auth/api';

const SESSION_STORAGE_KEY = 'cito.authentication.session.v1';

export interface SecretStorage {
  deleteItemAsync(key: string): Promise<void>;
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
}

const nativeSecretStorage: SecretStorage = {
  deleteItemAsync: (key) => SecureStore.deleteItemAsync(key),
  getItemAsync: (key) => SecureStore.getItemAsync(key),
  setItemAsync: (key, value) =>
    SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    }),
};

export class SessionRepository {
  private readonly storage: SecretStorage;
  private readonly now: () => number;

  constructor(storage: SecretStorage = nativeSecretStorage, now: () => number = Date.now) {
    this.storage = storage;
    this.now = now;
  }

  async load(): Promise<SessionTokens | null> {
    const encoded = await this.storage.getItemAsync(SESSION_STORAGE_KEY);
    if (!encoded) {
      return null;
    }
    const session = parseStoredSession(encoded);
    if (!session || Date.parse(session.sessionExpiresAt) <= this.now()) {
      await this.clear();
      return null;
    }
    return session;
  }

  async save(session: SessionTokens): Promise<void> {
    if (!validStoredSession(session) || Date.parse(session.sessionExpiresAt) <= this.now()) {
      throw new Error('Cannot persist an invalid or expired session.');
    }
    await this.storage.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  clear(): Promise<void> {
    return this.storage.deleteItemAsync(SESSION_STORAGE_KEY);
  }
}

export function accessTokenNeedsRefresh(
  session: SessionTokens,
  now: number = Date.now(),
  refreshBeforeMilliseconds = 30_000,
): boolean {
  return Date.parse(session.accessExpiresAt) <= now + refreshBeforeMilliseconds;
}

function parseStoredSession(encoded: string): SessionTokens | null {
  try {
    const value: unknown = JSON.parse(encoded);
    return validStoredSession(value) ? value : null;
  } catch {
    return null;
  }
}

function validStoredSession(value: unknown): value is SessionTokens {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const accessExpiresAt = timestamp(candidate.accessExpiresAt);
  const sessionExpiresAt = timestamp(candidate.sessionExpiresAt);
  return (
    token(candidate.accessToken) &&
    token(candidate.refreshToken) &&
    accessExpiresAt !== null &&
    sessionExpiresAt !== null &&
    accessExpiresAt < sessionExpiresAt
  );
}

function token(value: unknown): boolean {
  return typeof value === 'string' && value.length >= 32 && value.length <= 4096;
}

function timestamp(value: unknown): number | null {
  if (typeof value !== 'string') {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}
