import { DBSchema, IDBPDatabase, openDB, deleteDB } from 'idb';

import {
  CalculationRecord,
  CustomerRecord,
  DEFAULT_SETTINGS,
  FilamentRecord,
  PartRecord,
  PrinterRecord,
  SaleRecord,
  SettingRecord,
  TemplateRecord
} from '../../domain/models/storage.models';

export const DB_NAME = 'printcost';
export const DB_VERSION = 1;

/**
 * IndexedDB schema for PrintCost v1.
 *
 * Store shapes mirror the domain/storage records so services can read and
 * write without translating between persistence-specific DTOs.
 */
export interface PrintCostDbSchema extends DBSchema {
  printers: {
    key: string;
    value: PrinterRecord;
  };
  filaments: {
    key: string;
    value: FilamentRecord;
    indexes: { type: string; deleted: number };
  };
  calculations: {
    key: string;
    value: CalculationRecord;
    indexes: { customerId: string; deleted: number; updatedAt: string };
  };
  sales: {
    key: string;
    value: SaleRecord;
    indexes: { calculationId: string; customerId: string; date: string };
  };
  customers: {
    key: string;
    value: CustomerRecord;
    indexes: { deleted: number };
  };
  templates: {
    key: string;
    value: TemplateRecord;
    indexes: { updatedAt: string };
  };
  parts: {
    key: string;
    value: PartRecord;
    indexes: { calculationId: string };
  };
  settings: {
    key: string;
    value: SettingRecord;
  };
}

let databasePromise: Promise<IDBPDatabase<PrintCostDbSchema>> | undefined;

/**
 * Creates a store if the upgrade database does not already contain it.
 *
 * The upgrade callback is idempotent so schema bootstrapping can run safely
 * on fresh installs and future upgrades.
 */
const ensureStore = (
  db: IDBPDatabase<PrintCostDbSchema>,
  storeName: 'printers' | 'filaments' | 'calculations' | 'sales' | 'customers' | 'templates' | 'parts',
  indexes: Array<[string, string]> = []
) => {
  const upgradeDb = db as unknown as IDBDatabase;

  if (!upgradeDb.objectStoreNames.contains(storeName)) {
    const store = upgradeDb.createObjectStore(storeName, { keyPath: 'id' });
    for (const [indexName, keyPath] of indexes) {
      store.createIndex(indexName, keyPath);
    }
  }
};

/**
 * Ensures the settings store exists because it uses a string key instead of
 * the shared `id` key path used by the other stores.
 */
const ensureSettingsStore = (db: IDBPDatabase<PrintCostDbSchema>) => {
  const upgradeDb = db as unknown as IDBDatabase;

  if (!upgradeDb.objectStoreNames.contains('settings')) {
    upgradeDb.createObjectStore('settings', { keyPath: 'key' });
  }
};

/**
 * Seeds missing settings keys only. Existing user values are preserved so the
 * database can be reopened repeatedly without clobbering local preferences.
 */
export const seedDefaultSettings = async (db: IDBPDatabase<PrintCostDbSchema>) => {
  const tx = db.transaction('settings', 'readwrite');
  const store = tx.objectStore('settings');

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = await store.get(key);
    if (!existing) {
      await store.put({ key, value });
    }
  }

  await tx.done;
};

/**
 * Opens the PrintCost database, creates missing stores, and seeds defaults.
 *
 * The returned database is cached for the session; callers should reuse the
 * shared instance instead of opening IndexedDB directly in feature code.
 */
export const initializePrintCostDatabase = async (): Promise<IDBPDatabase<PrintCostDbSchema>> => {
  if (!databasePromise) {
    databasePromise = openDB<PrintCostDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        ensureStore(db, 'printers');
        ensureStore(db, 'filaments', [
          ['type', 'type'],
          ['deleted', 'deleted']
        ]);
        ensureStore(db, 'calculations', [
          ['customerId', 'customerId'],
          ['deleted', 'deleted'],
          ['updatedAt', 'updatedAt']
        ]);
        ensureStore(db, 'sales', [
          ['calculationId', 'calculationId'],
          ['customerId', 'customerId'],
          ['date', 'date']
        ]);
        ensureStore(db, 'customers', [['deleted', 'deleted']]);
        ensureStore(db, 'templates', [['updatedAt', 'updatedAt']]);
        ensureStore(db, 'parts', [['calculationId', 'calculationId']]);
        ensureSettingsStore(db);
      }
    });
  }

  const db = await databasePromise;
  await seedDefaultSettings(db);
  return db;
};

/**
 * Writes a single settings entry by key.
 *
 * Settings are mutated through this helper so service code keeps the schema
 * contract and storage side effects in one place.
 */
export const writeSetting = async (
  db: IDBPDatabase<PrintCostDbSchema>,
  key: string,
  value: unknown
) => {
  await db.put('settings', { key, value });
};

/**
 * Reads a single settings entry by key.
 */
export const readSetting = async (db: IDBPDatabase<PrintCostDbSchema>, key: string) =>
  db.get('settings', key);

/**
 * Closes the cached database instance and removes the local IndexedDB store.
 */
export const deletePrintCostDatabase = async () => {
  if (databasePromise) {
    const db = await databasePromise;
    db.close();
    databasePromise = undefined;
  }

  await deleteDB(DB_NAME);
};
