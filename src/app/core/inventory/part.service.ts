import { Inject, Injectable, InjectionToken, WritableSignal, signal } from '@angular/core';
import { IDBPDatabase } from 'idb';

import { PrintCostDbSchema, initializePrintCostDatabase } from '../db/printcost-db';
import { PartRecord } from '../../domain/models/storage.models';

type DatabaseProvider = () => Promise<IDBPDatabase<PrintCostDbSchema>>;

export interface CreatePartPayload {
  name: string;
  quantity: number;
  calculationId?: string;
  note?: string;
}

export const PRINTCOST_PART_DB_PROVIDER = new InjectionToken<DatabaseProvider>('printcost-part-db-provider', {
  providedIn: 'root',
  factory: () => initializePrintCostDatabase
});

@Injectable({
  providedIn: 'root'
})
export class PartService {
  readonly #parts: WritableSignal<PartRecord[]> = signal<PartRecord[]>([]);

  constructor(
    @Inject(PRINTCOST_PART_DB_PROVIDER)
    private readonly getDatabase: DatabaseProvider = initializePrintCostDatabase
  ) {}

  parts = this.#parts.asReadonly();

  async refresh(): Promise<void> {
    const db = await this.getDatabase();
    const parts = await db.getAll('parts');
    this.#parts.set(parts.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)));
  }

  async createPart(payload: CreatePartPayload): Promise<PartRecord> {
    const sanitized = this.validateAndSanitize(payload);
    const timestamp = new Date().toISOString();
    const record: PartRecord = {
      id: crypto.randomUUID(),
      ...sanitized,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const db = await this.getDatabase();
    await db.put('parts', record);
    await this.refresh();
    return record;
  }

  async updatePartQuantity(partId: string, quantity: number): Promise<PartRecord> {
    const db = await this.getDatabase();
    const existing = await db.get('parts', partId);
    if (!existing) {
      throw new Error('Part not found');
    }

    const clampedQuantity = Math.max(0, Number(quantity));
    const nextUpdatedAt = new Date().toISOString();
    const updated: PartRecord = {
      ...existing,
      quantity: clampedQuantity,
      updatedAt: nextUpdatedAt === existing.updatedAt ? new Date(Date.now() + 1).toISOString() : nextUpdatedAt
    };

    await db.put('parts', updated);
    await this.refresh();
    return updated;
  }

  validateAndSanitize(payload: CreatePartPayload): CreatePartPayload {
    const name = payload.name.trim();
    if (!name) {
      throw new Error('Part name is required');
    }

    if (name.length > 120) {
      throw new Error('Part name is too long');
    }

    if (payload.quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    const calculationId = payload.calculationId?.trim();
    const note = payload.note?.trim();
    if (note && note.length > 500) {
      throw new Error('Note is too long');
    }

    return {
      name,
      quantity: Number(payload.quantity),
      calculationId: calculationId ? calculationId : undefined,
      note: note ? note : undefined
    };
  }
}
