import { WritableSignal, signal } from '@angular/core';
import { IDBPDatabase } from 'idb';

import { PrintCostDbSchema, initializePrintCostDatabase } from '../db/printcost-db';
import { PrinterRecord } from '../../domain/models/storage.models';

type DatabaseProvider = () => Promise<IDBPDatabase<PrintCostDbSchema>>;

export class PrinterService {
  readonly #printers: WritableSignal<PrinterRecord[]> = signal<PrinterRecord[]>([]);

  constructor(private readonly getDatabase: DatabaseProvider = initializePrintCostDatabase) {}

  printers = this.#printers.asReadonly();

  async refresh(): Promise<void> {
    const db = await this.getDatabase();
    const printers = await db.getAll('printers');
    this.#printers.set(printers);
  }

  async savePrinter(printer: PrinterRecord): Promise<void> {
    const db = await this.getDatabase();
    await db.put('printers', printer);
    await this.refresh();
  }
}

