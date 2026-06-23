import { Inject, Injectable, InjectionToken, WritableSignal, signal } from '@angular/core';
import { IDBPDatabase } from 'idb';

import { PrintCostDbSchema, initializePrintCostDatabase, writeSetting } from '../db/printcost-db';

type DatabaseProvider = () => Promise<IDBPDatabase<PrintCostDbSchema>>;

/**
 * Injection token for the settings service database provider.
 */
export const SETTINGS_DB_PROVIDER = new InjectionToken<DatabaseProvider>('settings-db-provider', {
  providedIn: 'root',
  factory: () => initializePrintCostDatabase
});

/**
 * In-memory settings cache backed by IndexedDB.
 *
 * The service keeps a signal so feature code can react to updates without
 * querying the database on every read.
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  readonly #settings: WritableSignal<Record<string, unknown>> = signal<Record<string, unknown>>({});

  constructor(
    @Inject(SETTINGS_DB_PROVIDER)
    private readonly getDatabase: DatabaseProvider = initializePrintCostDatabase
  ) {}

  /**
   * Current settings snapshot exposed to consumers.
   */
  settings = this.#settings.asReadonly();

  /**
   * Reloads all settings entries from IndexedDB into the signal cache.
   */
  async refresh(): Promise<void> {
    const db = await this.getDatabase();
    const settingsEntries = await db.getAll('settings');

    this.#settings.set(
      settingsEntries.reduce<Record<string, unknown>>((accumulator, entry) => {
        accumulator[entry.key] = entry.value;
        return accumulator;
      }, {})
    );
  }

  /**
   * Persists a single setting and keeps the signal cache in sync.
   */
  async setSetting(key: string, value: unknown): Promise<void> {
    const db = await this.getDatabase();
    await writeSetting(db, key, value);

    this.#settings.update((current) => ({ ...current, [key]: value }));
  }
}
