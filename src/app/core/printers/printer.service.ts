import { Inject, Injectable, InjectionToken, WritableSignal, computed, signal } from '@angular/core';
import { IDBPDatabase } from 'idb';

import { PrintCostDbSchema, initializePrintCostDatabase } from '../db/printcost-db';
import { PrinterRecord } from '../../domain/models/storage.models';

type DatabaseProvider = () => Promise<IDBPDatabase<PrintCostDbSchema>>;

/**
 * Injection token for the printer service's database provider.
 *
 * Tests can replace the provider without touching application-wide database
 * wiring.
 */
export const PRINTCOST_DB_PROVIDER = new InjectionToken<DatabaseProvider>('printcost-db-provider', {
  providedIn: 'root',
  factory: () => initializePrintCostDatabase
});

/**
 * Input contract for printer creation and updates.
 *
 * Validation happens in the service so callers can pass raw form values and
 * rely on the service to enforce storage-safe constraints.
 */
export interface PrinterPayload {
  name: string;
  powerWatts: number;
  purchasePriceEur: number;
  lifetimeHours: number;
  note?: string;
}

/**
 * Service-owned printer state and persistence helpers.
 *
 * The service validates form payloads, writes through the shared database
 * adapter, and keeps an in-memory signal cache in sync.
 */
@Injectable({
  providedIn: 'root'
})
export class PrinterService {
  readonly #printers: WritableSignal<PrinterRecord[]> = signal<PrinterRecord[]>([]);

  constructor(
    @Inject(PRINTCOST_DB_PROVIDER)
    private readonly getDatabase: DatabaseProvider = initializePrintCostDatabase
  ) {}

  /**
   * Full printer cache, including soft-deleted records for historical lookups.
   */
  printers = this.#printers.asReadonly();

  /**
   * View model for active lists that should hide soft-deleted entries.
   */
  activePrinters = computed(() => this.#printers().filter((printer) => !printer.deleted));

  /**
   * Reloads the printer cache from IndexedDB.
   */
  async refresh(): Promise<void> {
    const db = await this.getDatabase();
    const printers = await db.getAll('printers');
    this.#printers.set(printers);
  }

  /**
   * Validates, trims, persists, and returns a new printer record.
   */
  async createPrinter(payload: PrinterPayload): Promise<PrinterRecord> {
    const sanitized = this.validateAndSanitize(payload);
    const timestamp = new Date().toISOString();
    const printer: PrinterRecord = {
      id: crypto.randomUUID(),
      ...sanitized,
      deleted: false,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const db = await this.getDatabase();
    await db.put('printers', printer);
    await this.refresh();
    return printer;
  }

  /**
   * Replaces an existing printer record while preserving its creation data.
   *
   * The updated timestamp is always advanced so history views can detect the
   * edit even when the write happens within the same millisecond.
   */
  async updatePrinter(id: string, payload: PrinterPayload): Promise<PrinterRecord> {
    const db = await this.getDatabase();
    const existing = await db.get('printers', id);
    if (!existing) {
      throw new Error('Printer not found');
    }

    const sanitized = this.validateAndSanitize(payload);
    const nextUpdatedAt = new Date().toISOString();
    const updated: PrinterRecord = {
      ...existing,
      ...sanitized,
      updatedAt: nextUpdatedAt === existing.updatedAt ? new Date(Date.now() + 1).toISOString() : nextUpdatedAt
    };

    await db.put('printers', updated);
    await this.refresh();
    return updated;
  }

  /**
   * Marks a printer as deleted without removing historical references.
   */
  async softDeletePrinter(id: string): Promise<PrinterRecord> {
    const db = await this.getDatabase();
    const existing = await db.get('printers', id);
    if (!existing) {
      throw new Error('Printer not found');
    }

    const nextUpdatedAt = new Date().toISOString();
    const deleted: PrinterRecord = {
      ...existing,
      deleted: true,
      updatedAt: nextUpdatedAt === existing.updatedAt ? new Date(Date.now() + 1).toISOString() : nextUpdatedAt
    };

    await db.put('printers', deleted);
    await this.refresh();
    return deleted;
  }

  /**
   * Normalizes and validates form payload before storage.
   */
  validateAndSanitize(payload: PrinterPayload): PrinterPayload {
    const name = payload.name.trim();
    if (!name) {
      throw new Error('Printer name is required');
    }

    if (name.length > 120) {
      throw new Error('Printer name is too long');
    }

    if (payload.powerWatts <= 0) {
      throw new Error('Power must be greater than 0');
    }

    if (payload.purchasePriceEur <= 0) {
      throw new Error('Purchase price must be greater than 0');
    }

    if (payload.lifetimeHours <= 0) {
      throw new Error('Lifetime hours must be greater than 0');
    }

    const note = payload.note?.trim();
    if (note && note.length > 500) {
      throw new Error('Note is too long');
    }

    return {
      ...payload,
      name,
      note
    };
  }
}
