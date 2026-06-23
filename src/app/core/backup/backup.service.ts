import { Inject, Injectable, InjectionToken } from '@angular/core';
import { IDBPDatabase } from 'idb';

import { PrintCostDbSchema, DB_VERSION, initializePrintCostDatabase, seedDefaultSettings } from '../db/printcost-db';
import { BackupFormat } from '../../domain/models/storage.models';

type DatabaseProvider = () => Promise<IDBPDatabase<PrintCostDbSchema>>;

export const BACKUP_DB_PROVIDER = new InjectionToken<DatabaseProvider>('backup-db-provider', {
  providedIn: 'root',
  factory: () => initializePrintCostDatabase
});

const BACKUP_STORES = ['printers', 'filaments', 'calculations', 'sales', 'customers', 'templates', 'parts', 'settings'] as const;

@Injectable({ providedIn: 'root' })
export class BackupService {
  readonly #getDatabase: DatabaseProvider;

  constructor(
    @Inject(BACKUP_DB_PROVIDER)
    getDatabase: DatabaseProvider = initializePrintCostDatabase
  ) {
    this.#getDatabase = getDatabase;
  }

  async exportBackup(): Promise<void> {
    const db = await this.#getDatabase();

    const [printers, filaments, calculations, sales, customers, templates, parts, settings] = await Promise.all([
      db.getAll('printers'),
      db.getAll('filaments'),
      db.getAll('calculations'),
      db.getAll('sales'),
      db.getAll('customers'),
      db.getAll('templates'),
      db.getAll('parts'),
      db.getAll('settings')
    ]);

    const payload: BackupFormat = {
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      printers,
      filaments,
      calculations,
      sales,
      customers,
      templates,
      parts,
      settings
    };

    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const dateStr = new Date().toLocaleDateString('sv');
    const filename = `printcost-backup-${dateStr}.json`;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  validateBackup(payload: unknown): BackupFormat {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Backup is not a valid object');
    }

    const candidate = payload as Record<string, unknown>;

    if (candidate['version'] !== DB_VERSION) {
      throw new Error(`Version mismatch: expected ${DB_VERSION}, got ${candidate['version']}`);
    }

    if (typeof candidate['exportedAt'] !== 'string') {
      throw new Error('Missing or invalid exportedAt field');
    }

    const storeKeys: Array<keyof Omit<BackupFormat, 'version' | 'exportedAt'>> = [
      'printers', 'filaments', 'calculations', 'sales', 'customers', 'templates', 'parts', 'settings'
    ];

    for (const key of storeKeys) {
      if (!Array.isArray(candidate[key])) {
        throw new Error(`Missing or invalid store: "${key}"`);
      }
    }

    return payload as BackupFormat;
  }

  async importBackup(backup: BackupFormat): Promise<void> {
    const db = await this.#getDatabase();

    for (const storeName of ['printers', 'filaments', 'calculations', 'sales', 'customers', 'templates', 'parts'] as const) {
      const tx = db.transaction(storeName, 'readwrite');
      await tx.store.clear();
      for (const record of backup[storeName] as Parameters<typeof tx.store.put>[0][]) {
        tx.store.put(record);
      }
      await tx.done;
    }

    const settingsTx = db.transaction('settings', 'readwrite');
    await settingsTx.store.clear();
    for (const record of backup.settings) {
      settingsTx.store.put(record);
    }
    await settingsTx.done;

    await seedDefaultSettings(db);
  }

  async clearAllData(): Promise<void> {
    const db = await this.#getDatabase();

    await Promise.all(
      BACKUP_STORES.map(async (storeName) => {
        const tx = db.transaction(storeName, 'readwrite');
        await tx.store.clear();
        await tx.done;
      })
    );

    await seedDefaultSettings(db);
  }
}
