import { WritableSignal, signal } from '@angular/core';
import { IDBPDatabase } from 'idb';

import { PrintCostDbSchema, initializePrintCostDatabase, writeSetting } from '../db/printcost-db';

type DatabaseProvider = () => Promise<IDBPDatabase<PrintCostDbSchema>>;

export class SettingsService {
  readonly #settings: WritableSignal<Record<string, unknown>> = signal<Record<string, unknown>>({});

  constructor(private readonly getDatabase: DatabaseProvider = initializePrintCostDatabase) {}

  settings = this.#settings.asReadonly();

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

  async setSetting(key: string, value: unknown): Promise<void> {
    const db = await this.getDatabase();
    await writeSetting(db, key, value);

    this.#settings.update((current) => ({ ...current, [key]: value }));
  }
}

