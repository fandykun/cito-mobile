import { deleteDatabaseAsync, openDatabaseAsync } from 'expo-sqlite';

import type { DatabaseOpener } from '@/src/storage/encryptedDatabaseSpike';

export const ENCRYPTED_SPIKE_DATABASE_NAME = 'cito-encrypted-storage-spike.db';

export const openExpoDatabase: DatabaseOpener = async (databaseName) => {
  return openDatabaseAsync(databaseName);
};

export async function deleteEncryptedSpikeDatabase(): Promise<void> {
  await deleteDatabaseAsync(ENCRYPTED_SPIKE_DATABASE_NAME);
}
