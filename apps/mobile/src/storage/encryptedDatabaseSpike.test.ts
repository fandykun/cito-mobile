import {
  assertRollbackIsolation,
  assertWrongKeyRejected,
  migrateEncryptedSpikeDatabase,
  openEncryptedDatabase,
  type DatabaseConnection,
  type DatabaseOpener,
} from '@/src/storage/encryptedDatabaseSpike';

function createConnection(
  overrides: Partial<DatabaseConnection> = {},
): DatabaseConnection & { calls: string[] } {
  const calls: string[] = [];

  const getFirstAsync: DatabaseConnection['getFirstAsync'] = async <T>(
    sql: string,
  ): Promise<T | null> => {
    calls.push(`get:${sql}`);
    if (sql === 'PRAGMA cipher_version') {
      return { cipher_version: '4.7.0' } as T;
    }
    if (sql.includes('sqlite_master')) {
      return { count: 2 } as T;
    }
    if (sql.includes('spike_domain')) {
      return { count: 0 } as T;
    }
    if (sql.includes('spike_outbox')) {
      return { count: 0 } as T;
    }
    return null;
  };

  return {
    calls,
    closeAsync: jest.fn(async () => {
      calls.push('close');
    }),
    execAsync: jest.fn(async (sql: string) => {
      calls.push(`exec:${sql}`);
    }),
    getFirstAsync,
    runAsync: jest.fn(async (sql: string) => {
      calls.push(`run:${sql}`);
    }),
    withExclusiveTransactionAsync: jest.fn(async (task) => {
      calls.push('transaction:start');
      await task({
        execAsync: async (sql: string) => {
          calls.push(`transaction:exec:${sql}`);
        },
        getFirstAsync: async <T>(): Promise<T | null> => null,
        runAsync: async (sql: string) => {
          calls.push(`transaction:run:${sql}`);
        },
      });
      calls.push('transaction:commit');
    }),
    ...overrides,
  };
}

describe('encrypted database spike', () => {
  it('applies the key before probing SQLCipher or schema', async () => {
    const connection = createConnection();
    const opener: DatabaseOpener = jest.fn(async () => connection);

    await openEncryptedDatabase(opener, 'cito-spike.db', "test'key-value");

    expect(connection.calls.slice(0, 3)).toEqual([
      "exec:PRAGMA key = 'test''key-value'",
      'get:PRAGMA cipher_version',
      'get:SELECT COUNT(*) AS count FROM sqlite_master',
    ]);
  });

  it('rejects unsafe or empty keys before opening a database', async () => {
    const opener: DatabaseOpener = jest.fn(async () => createConnection());

    await expect(openEncryptedDatabase(opener, 'cito-spike.db', '')).rejects.toThrow(
      'Encryption key must contain between 12 and 256 characters.',
    );
    await expect(openEncryptedDatabase(opener, 'cito-spike.db', 'valid-length\nkey')).rejects.toThrow(
      'Encryption key must not contain control characters.',
    );
    expect(opener).not.toHaveBeenCalled();
  });

  it('runs schema migration inside an exclusive transaction', async () => {
    const connection = createConnection();

    await migrateEncryptedSpikeDatabase(connection);

    expect(connection.calls[0]).toBe('transaction:start');
    expect(connection.calls.some((call) => call.includes('CREATE TABLE IF NOT EXISTS spike_domain'))).toBe(
      true,
    );
    expect(connection.calls.some((call) => call.includes('CREATE TABLE IF NOT EXISTS spike_outbox'))).toBe(
      true,
    );
    expect(connection.calls.at(-1)).toBe('transaction:commit');
  });

  it('proves a failed domain/outbox transaction leaves no rows', async () => {
    const connection = createConnection({
      withExclusiveTransactionAsync: jest.fn(async (task) => {
        await task({
          execAsync: async () => undefined,
          getFirstAsync: async <T>(): Promise<T | null> => null,
          runAsync: async () => undefined,
        });
      }),
    });

    await expect(assertRollbackIsolation(connection, 'rollback-operation')).resolves.toBeUndefined();
  });

  it('fails rollback validation when either table retains a row', async () => {
    const leakyGetFirstAsync: DatabaseConnection['getFirstAsync'] = async <T>(
      sql: string,
    ): Promise<T | null> => {
      return { count: sql.includes('spike_domain') ? 1 : 0 } as T;
    };
    const connection = createConnection({
      getFirstAsync: leakyGetFirstAsync,
      withExclusiveTransactionAsync: jest.fn(async (task) => {
        await task({
          execAsync: async () => undefined,
          getFirstAsync: async <T>(): Promise<T | null> => null,
          runAsync: async () => undefined,
        });
      }),
    });

    await expect(assertRollbackIsolation(connection, 'leaked-operation')).rejects.toThrow(
      'Rollback isolation failed: domain=1, outbox=0.',
    );
  });

  it('requires the wrong key to be rejected', async () => {
    const rejectingOpener: DatabaseOpener = jest.fn(async () => {
      throw new Error('file is not a database');
    });

    await expect(
      assertWrongKeyRejected(rejectingOpener, 'cito-spike.db', 'wrong-key-value'),
    ).resolves.toBeUndefined();

    const acceptingConnection = createConnection();
    await expect(
      assertWrongKeyRejected(async () => acceptingConnection, 'cito-spike.db', 'wrong-key-value'),
    ).rejects.toThrow('Wrong-key validation failed: the database opened successfully.');
    expect(acceptingConnection.closeAsync).toHaveBeenCalledTimes(1);
  });
});
