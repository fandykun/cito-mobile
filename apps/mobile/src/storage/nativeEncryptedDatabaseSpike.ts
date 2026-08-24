import {
  assertRollbackIsolation,
  assertWrongKeyRejected,
  migrateEncryptedSpikeDatabase,
  openEncryptedDatabase,
  readCipherVersion,
  readSpikeMarker,
  writeSpikeMarker,
  type DatabaseConnection,
} from '@/src/storage/encryptedDatabaseSpike';
import {
  deleteEncryptedSpikeDatabase,
  ENCRYPTED_SPIKE_DATABASE_NAME,
  openExpoDatabase,
} from '@/src/storage/expoSqliteAdapter';

export interface NativeSpikeResult {
  cipherVersion: string;
  marker: string;
}

const ROLLBACK_OPERATION_ID = 'native-rollback-probe';

async function closeVerifiedConnection(
  connection: DatabaseConnection,
  operation: () => Promise<NativeSpikeResult>,
): Promise<NativeSpikeResult> {
  let result: NativeSpikeResult;
  try {
    result = await operation();
  } catch (operationError) {
    try {
      await connection.closeAsync();
    } catch (closeError) {
      throw new AggregateError(
        [operationError, closeError],
        'Native SQLCipher verification failed and its connection could not be closed.',
      );
    }
    throw operationError;
  }

  await connection.closeAsync();
  return result;
}

function createRestartMarker(): string {
  return `restart-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function deriveWrongKey(key: string): string {
  const replacement = key.startsWith('x') ? 'y' : 'x';
  return `${replacement}${key.slice(1)}`;
}

export async function initializeNativeEncryptedDatabaseSpike(
  key: string,
): Promise<NativeSpikeResult> {
  await deleteEncryptedSpikeDatabase();
  const connection = await openEncryptedDatabase(openExpoDatabase, ENCRYPTED_SPIKE_DATABASE_NAME, key);

  return closeVerifiedConnection(connection, async () => {
    await migrateEncryptedSpikeDatabase(connection);
    const marker = createRestartMarker();
    await writeSpikeMarker(connection, marker);
    await assertRollbackIsolation(connection, ROLLBACK_OPERATION_ID);

    return {
      cipherVersion: await readCipherVersion(connection),
      marker,
    };
  });
}

export async function verifyNativeEncryptedDatabaseReopen(
  key: string,
): Promise<NativeSpikeResult> {
  const connection = await openEncryptedDatabase(openExpoDatabase, ENCRYPTED_SPIKE_DATABASE_NAME, key);

  return closeVerifiedConnection(connection, async () => {
    const marker = await readSpikeMarker(connection);
    await assertRollbackIsolation(connection, ROLLBACK_OPERATION_ID);

    return {
      cipherVersion: await readCipherVersion(connection),
      marker,
    };
  });
}

export async function verifyNativeWrongKeyRejection(key: string): Promise<void> {
  await assertWrongKeyRejected(
    openExpoDatabase,
    ENCRYPTED_SPIKE_DATABASE_NAME,
    deriveWrongKey(key),
  );
}
