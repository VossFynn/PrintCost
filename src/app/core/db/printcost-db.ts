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

const ensureSettingsStore = (db: IDBPDatabase<PrintCostDbSchema>) => {
  const upgradeDb = db as unknown as IDBDatabase;

  if (!upgradeDb.objectStoreNames.contains('settings')) {
    upgradeDb.createObjectStore('settings', { keyPath: 'key' });
  }
};

const seedDefaultSettings = async (db: IDBPDatabase<PrintCostDbSchema>) => {
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

export const writeSetting = async (
  db: IDBPDatabase<PrintCostDbSchema>,
  key: string,
  value: unknown
) => {
  await db.put('settings', { key, value });
};

export const readSetting = async (db: IDBPDatabase<PrintCostDbSchema>, key: string) =>
  db.get('settings', key);

export const deletePrintCostDatabase = async () => {
  if (databasePromise) {
    const db = await databasePromise;
    db.close();
    databasePromise = undefined;
  }

  await deleteDB(DB_NAME);
};
