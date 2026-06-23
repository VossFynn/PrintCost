import { Inject, Injectable, InjectionToken, WritableSignal, computed, signal } from '@angular/core';
import { IDBPDatabase } from 'idb';

import { PrintCostDbSchema, initializePrintCostDatabase } from '../db/printcost-db';
import { FilamentPurchaseRecord, FilamentRecord } from '../../domain/models/storage.models';

type DatabaseProvider = () => Promise<IDBPDatabase<PrintCostDbSchema>>;

/**
 * Injection token for the filament service's database provider.
 */
export const PRINTCOST_FILAMENT_DB_PROVIDER = new InjectionToken<DatabaseProvider>('printcost-filament-db-provider', {
  providedIn: 'root',
  factory: () => initializePrintCostDatabase
});

/**
 * Input contract for filament creation and edits.
 *
 * Purchases and pricing fields stay in the service layer so callers can work
 * with raw form values and let the service enforce persistence rules.
 */
export interface FilamentPayload {
  name: string;
  type: string;
  colorHex: string;
  manufacturer?: string;
  rollWeightG: number;
  remainingG: number;
  purchases: FilamentPurchaseRecord[];
  multiColorSurchargeEurKg: number;
  fixedPriceEurG?: number;
}

export type FilamentPriceMode = 'WEIGHTED_AVERAGE' | 'PAID' | 'FIXED';

/**
 * Service-owned filament state, validation, and price-basis helpers.
 *
 * The service keeps both the raw cache and an active-only projection so
 * feature code can choose whether soft-deleted records should be visible.
 */
@Injectable({
  providedIn: 'root'
})
export class FilamentService {
  readonly #filaments: WritableSignal<FilamentRecord[]> = signal<FilamentRecord[]>([]);

  constructor(
    @Inject(PRINTCOST_FILAMENT_DB_PROVIDER)
    private readonly getDatabase: DatabaseProvider = initializePrintCostDatabase
  ) {}

  /**
   * Full filament cache, including soft-deleted records for historical reads.
   */
  filaments = this.#filaments.asReadonly();

  /**
   * Active-only view used by list screens that should hide deleted filaments.
   */
  activeFilaments = computed(() => this.#filaments().filter((filament) => !filament.deleted));

  /**
   * Reloads the cached filaments from IndexedDB and normalizes missing fields.
   */
  async refresh(): Promise<void> {
    const db = await this.getDatabase();
    const filaments = await db.getAll('filaments');
    this.#filaments.set(filaments.map((filament) => this.normalizeRecord(filament)));
  }

  /**
   * Validates, trims, persists, and returns a new filament record.
   */
  async createFilament(payload: FilamentPayload): Promise<FilamentRecord> {
    const sanitized = this.validateAndSanitize(payload);
    const timestamp = new Date().toISOString();
    const filament: FilamentRecord = {
      id: crypto.randomUUID(),
      ...sanitized,
      deleted: false,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const db = await this.getDatabase();
    await db.put('filaments', filament);
    await this.refresh();
    return filament;
  }

  /**
   * Replaces an existing filament record while preserving its creation data.
   *
   * The updated timestamp is bumped on same-millisecond writes so change
   * detection stays deterministic.
   */
  async updateFilament(id: string, payload: FilamentPayload): Promise<FilamentRecord> {
    const db = await this.getDatabase();
    const existing = await db.get('filaments', id);
    if (!existing) {
      throw new Error('Filament not found');
    }

    const sanitized = this.validateAndSanitize(payload);
    const nextUpdatedAt = new Date().toISOString();
    const updated: FilamentRecord = {
      ...this.normalizeRecord(existing),
      ...sanitized,
      updatedAt: nextUpdatedAt === existing.updatedAt ? new Date(Date.now() + 1).toISOString() : nextUpdatedAt
    };

    await db.put('filaments', updated);
    await this.refresh();
    return updated;
  }

  /**
   * Returns a cached filament by id when present.
   */
  getFilamentById(id: string): FilamentRecord | undefined {
    return this.filaments().find((filament) => filament.id === id);
  }

  /**
   * Resolves a filament by id and throws a German error if it is missing.
   */
  requireFilamentById(id: string): FilamentRecord {
    const filament = this.getFilamentById(id);
    if (!filament) {
      throw new Error('Filament nicht gefunden');
    }

    return filament;
  }

  /**
   * Marks a filament as deleted without destroying historical references.
   */
  async softDeleteFilament(id: string): Promise<FilamentRecord> {
    const db = await this.getDatabase();
    const existing = this.requireFilamentById(id);
    const deleted: FilamentRecord = {
      ...this.normalizeRecord(existing),
      deleted: true,
      updatedAt: new Date().toISOString()
    };

    await db.put('filaments', deleted);
    await this.refresh();
    return deleted;
  }

  /**
   * Calculates the average purchase price per gram across the full purchase history.
   */
  weightedAveragePricePerGram(filament: FilamentRecord): number {
    const purchases = this.getPurchases(filament);
    const totalQuantityKg = purchases.reduce((sum, purchase) => sum + purchase.quantityKg, 0);
    if (totalQuantityKg <= 0) {
      throw new Error('Mindestens ein Einkauf ist erforderlich');
    }

    const totalPrice = purchases.reduce((sum, purchase) => sum + purchase.priceEur * purchase.quantityKg, 0);
    return totalPrice / totalQuantityKg / 1000;
  }

  /**
   * Uses the most recent purchase as the price basis.
   */
  lastPaidPricePerGram(filament: FilamentRecord): number {
    const latestPurchase = this.getLatestPurchase(filament);
    return latestPurchase.priceEur / 1000;
  }

  /**
   * Dispatches to the selected pricing mode helper.
   */
  pricePerGramForMode(filament: FilamentRecord, mode: FilamentPriceMode): number {
    switch (mode) {
      case 'WEIGHTED_AVERAGE':
        return this.weightedAveragePricePerGram(filament);
      case 'PAID':
        return this.lastPaidPricePerGram(filament);
      case 'FIXED':
        return this.fixedPricePerGram(filament);
      default:
        throw new Error('Unbekannte Preisbasis');
    }
  }

  /**
   * Trims and validates a payload before it is persisted to IndexedDB.
   */
  validateAndSanitize(payload: FilamentPayload): FilamentPayload {
    const name = payload.name.trim();
    if (!name) {
      throw new Error('Filament name is required');
    }

    const type = payload.type.trim();
    if (!type) {
      throw new Error('Filament type is required');
    }

    const colorHex = payload.colorHex.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(colorHex)) {
      throw new Error('Color must be a valid hex value');
    }

    const manufacturer = payload.manufacturer?.trim();
    if (manufacturer && manufacturer.length > 120) {
      throw new Error('Manufacturer is too long');
    }

    if (payload.rollWeightG <= 0) {
      throw new Error('Roll weight must be greater than 0');
    }

    if (payload.remainingG < 0) {
      throw new Error('Remaining grams cannot be negative');
    }

    if (payload.remainingG > payload.rollWeightG) {
      throw new Error('Remaining grams cannot exceed roll weight');
    }

    if (payload.multiColorSurchargeEurKg < 0) {
      throw new Error('Surcharge cannot be negative');
    }

    if (payload.fixedPriceEurG !== undefined && payload.fixedPriceEurG <= 0) {
      throw new Error('Fixed price must be greater than 0');
    }

    if (!payload.purchases || payload.purchases.length === 0) {
      throw new Error('At least one valid purchase is required');
    }

    const purchases = payload.purchases.map((purchase) => this.validatePurchase(purchase));

    return {
      ...payload,
      name,
      type,
      colorHex,
      manufacturer,
      purchases,
      fixedPriceEurG: payload.fixedPriceEurG === undefined ? undefined : Number(payload.fixedPriceEurG)
    };
  }

  /**
   * Validates a single purchase entry and normalizes numeric fields.
   */
  private validatePurchase(purchase: FilamentPurchaseRecord): FilamentPurchaseRecord {
    if (purchase.priceEur <= 0) {
      throw new Error('Purchase price must be greater than 0');
    }

    if (purchase.quantityKg <= 0) {
      throw new Error('Purchase quantity must be greater than 0');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(purchase.purchasedAt)) {
      throw new Error('Purchase date must be a valid ISO date (YYYY-MM-DD)');
    }

    const timestamp = Date.parse(`${purchase.purchasedAt}T00:00:00.000Z`);
    if (Number.isNaN(timestamp)) {
      throw new Error('Purchase date must be a valid ISO date (YYYY-MM-DD)');
    }

    return {
      priceEur: Number(purchase.priceEur),
      quantityKg: Number(purchase.quantityKg),
      purchasedAt: purchase.purchasedAt
    };
  }

  /**
   * Fills optional fields so calculations and list projections can rely on
   * stable defaults without mutating the original record.
   */
  private normalizeRecord(record: FilamentRecord): FilamentRecord {
    return {
      ...record,
      colorHex: record.colorHex ?? '#000000',
      manufacturer: record.manufacturer ?? '',
      rollWeightG: record.rollWeightG ?? 0,
      remainingG: record.remainingG ?? 0,
      purchases: record.purchases ?? [],
      multiColorSurchargeEurKg: record.multiColorSurchargeEurKg ?? 0,
      fixedPriceEurG: record.fixedPriceEurG,
      createdAt: record.createdAt ?? record.updatedAt
    };
  }

  /**
   * Resolves the fixed price mode and requires a positive configured value.
   */
  private fixedPricePerGram(filament: FilamentRecord): number {
    const fixedPriceEurG = this.normalizeRecord(filament).fixedPriceEurG;
    if (fixedPriceEurG === undefined || fixedPriceEurG <= 0) {
      throw new Error('Bitte Fixpreis eingeben');
    }

    return fixedPriceEurG;
  }

  /**
   * Returns a defensive copy of the purchase history.
   */
  private getPurchases(filament: FilamentRecord): FilamentPurchaseRecord[] {
    return [...(this.normalizeRecord(filament).purchases ?? [])];
  }

  /**
   * Picks the most recent purchase, using array order as the tie-breaker for
   * purchases with the same date so reads stay deterministic.
   */
  private getLatestPurchase(filament: FilamentRecord): FilamentPurchaseRecord {
    const purchases = this.getPurchases(filament);
    if (purchases.length === 0) {
      throw new Error('Mindestens ein Einkauf ist erforderlich');
    }

    return purchases.reduce((latest, purchase) => {
      if (purchase.purchasedAt > latest.purchasedAt) {
        return purchase;
      }

      if (purchase.purchasedAt === latest.purchasedAt) {
        // Later records win when the purchase date matches exactly.
        return purchase;
      }

      return latest;
    });
  }
}
