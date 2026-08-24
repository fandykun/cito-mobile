export type DatabaseValue = boolean | number | string | null | Uint8Array;

export interface TransactionConnection {
  execAsync(source: string): Promise<void>;
  getFirstAsync<T>(source: string, ...params: DatabaseValue[]): Promise<T | null>;
  runAsync(source: string, ...params: DatabaseValue[]): Promise<unknown>;
}

export interface DatabaseConnection extends TransactionConnection {
  closeAsync(): Promise<void>;
  withExclusiveTransactionAsync(task: (transaction: TransactionConnection) => Promise<void>): Promise<void>;
}

export type DatabaseOpener = (databaseName: string) => Promise<DatabaseConnection>;

interface CountRow {
  count: number;
}

interface CipherVersionRow {
  cipher_version: string;
}

const MINIMUM_KEY_LENGTH = 12;
const MAXIMUM_KEY_LENGTH = 256;

class RollbackProbeError extends Error {
  constructor() {
    super('Intentional rollback probe');
    this.name = 'RollbackProbeError';
  }
}

function validateEncryptionKey(key: string): void {
  if (key.length < MINIMUM_KEY_LENGTH || key.length > MAXIMUM_KEY_LENGTH) {
    throw new Error(
      `Encryption key must contain between ${MINIMUM_KEY_LENGTH} and ${MAXIMUM_KEY_LENGTH} characters.`,
    );
  }

  if(/[\u0000-\u001F\u007F]/u.test(key)) {
    throw new Error('Encryption key must not contain control characters.');
  }
}

function quoteSqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

async function closeAfterOpenFailure(connection: DatabaseConnection, openError: unknown): Promise<never> {
  try {
    await connection.closeAsync();
  } catch (closeError) {
    throw new AggregateError(
      [openError, closeError],
      'Encrypted database initialization failed and its connection could not be closed.',
    );
  }

  throw openError;
}

export async function openEncryptedDatabase(
  opener: DatabaseOpener,
  databaseName: string,
  key: string,
): Promise<DatabaseConnection> {
  validateEncryptionKey(key);
  const connection = await opener(databaseName);

  try {
    await connection.execAsync(`PRAGMA key = ${quoteSqlString(key)}`);

    const cipher = await connection.getFirstAsync<CipherVersionRow>('PRAGMA cipher_version');
    if (!cipher?.cipher_version) {
      throw new Error('SQLCipher is unavailable in this native build.');
    }

    await connection.getFirstAsync<CountRow>('SELECT COUNT(*) AS count FROM sqlite_master');
    return connection;
  } catch (error) {
    return closeAfterOpenFailure(connection, error);
  }
}

export async function migrateEncryptedSpikeDatabase(connection: DatabaseConnection): Promise<void> {
  await connection.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.execAsync(`
      CREATE TABLE IF NOT EXISTS spike_domain (
        operation_id TEXT PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS spike_outbox (
        operation_id TEXT PRIMARY KEY NOT NULL,
        event_type TEXT NOT NULL,
        FOREIGN KEY (operation_id) REFERENCES spike_domain(operation_id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS spike_state (
        id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
        marker TEXT NOT NULL
      );
      PRAGMA user_version = 1;
    `);
  });
}

export async function assertRollbackIsolation(
  connection: DatabaseConnection,
  operationId: string,
): Promise<void> {
  try {
    await connection.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        'INSERT INTO spike_domain (operation_id, payload) VALUES (?, ?)',
        operationId,
        'synthetic rollback payload',
      );
      await transaction.runAsync(
        'INSERT INTO spike_outbox (operation_id, event_type) VALUES (?, ?)',
        operationId,
        'synthetic.rollback',
      );
      throw new RollbackProbeError();
    });
    throw new Error('Rollback isolation failed: the probe transaction committed unexpectedly.');
  } catch (error) {
    if (!(error instanceof RollbackProbeError)) {
      throw error;
    }
  }

  const domain = await connection.getFirstAsync<CountRow>(
    'SELECT COUNT(*) AS count FROM spike_domain WHERE operation_id = ?',
    operationId,
  );
  const outbox = await connection.getFirstAsync<CountRow>(
    'SELECT COUNT(*) AS count FROM spike_outbox WHERE operation_id = ?',
    operationId,
  );
  const domainCount = domain?.count ?? 0;
  const outboxCount = outbox?.count ?? 0;

  if (domainCount !== 0 || outboxCount !== 0) {
    throw new Error(`Rollback isolation failed: domain=${domainCount}, outbox=${outboxCount}.`);
  }
}

export async function assertWrongKeyRejected(
  opener: DatabaseOpener,
  databaseName: string,
  wrongKey: string,
): Promise<void> {
  let unexpectedConnection: DatabaseConnection | null = null;

  try {
    unexpectedConnection = await openEncryptedDatabase(opener, databaseName, wrongKey);
  } catch {
    return;
  }

  try {
    await unexpectedConnection.closeAsync();
  } catch (closeError) {
    throw new Error('Wrong-key validation failed and the unexpected connection could not be closed.', {
      cause: closeError,
    });
  }

  throw new Error('Wrong-key validation failed: the database opened successfully.');
}
