import { Inject, Injectable, InjectionToken, WritableSignal, computed, signal } from '@angular/core';
import { IDBPDatabase } from 'idb';

import { PrintCostDbSchema, initializePrintCostDatabase } from '../db/printcost-db';
import {
  CalculationFilamentLineSnapshot,
  CalculationRecord,
  FilamentRecord,
  CalculationPrinterSnapshot,
  CustomerRecord,
  SaleRecord,
  TemplateCalculationInputRecord,
  TemplateRecord
} from '../../domain/models/storage.models';
import { CalculationInput, CalculationResult } from '../../domain/calculation/calculate';

type DatabaseProvider = () => Promise<IDBPDatabase<PrintCostDbSchema>>;

export interface SavePlannedCalculationPayload {
  projectName: string;
  customerId?: string;
  printerSnapshot: CalculationPrinterSnapshot;
  filamentSnapshots: CalculationFilamentLineSnapshot[];
  calculationInput: CalculationInput;
  calculationResult: CalculationResult;
}

export type CalculationTemplateInput = TemplateCalculationInputRecord;

export interface SaveCalculationTemplatePayload {
  templateName: string;
  templateInput: CalculationTemplateInput;
}

export interface RecordPrintOccurrenceResult {
  warning?: string;
}

export interface RecordSalePayload {
  calculationId: string;
  customerId?: string;
  date: string;
  priceEur?: number;
  gifted?: boolean;
  note?: string;
}

export interface CalculationDetailHistoryEntry {
  id: string;
  dateLabel: string;
  entryType: 'sale' | 'gift';
  quantity: number;
  priceLabel: string;
  customerLabel: string | null;
  note: string | null;
}

export interface CalculationDetailHistorySummary {
  printedCount: number;
  soldCount: number;
  giftedCount: number;
  remainingCount: number;
  entries: CalculationDetailHistoryEntry[];
}

export interface CalculationDetailView {
  record: CalculationRecord;
  history: CalculationDetailHistorySummary;
}

/**
 * Injection token for calculation persistence database access.
 */
export const PRINTCOST_CALCULATION_DB_PROVIDER = new InjectionToken<DatabaseProvider>('printcost-calculation-db-provider', {
  providedIn: 'root',
  factory: () => initializePrintCostDatabase
});

/**
 * Persists saved calculation snapshots for planned prints and inventory listing.
 */
@Injectable({
  providedIn: 'root'
})
export class CalculationService {
  readonly #savedCalculations: WritableSignal<CalculationRecord[]> = signal<CalculationRecord[]>([]);
  readonly #templates: WritableSignal<TemplateRecord[]> = signal<TemplateRecord[]>([]);

  constructor(
    @Inject(PRINTCOST_CALCULATION_DB_PROVIDER)
    private readonly getDatabase: DatabaseProvider = initializePrintCostDatabase
  ) {}

  /**
   * Full saved calculation cache for Bestand > Drucke and detail follow-ups.
   */
  savedCalculations = this.#savedCalculations.asReadonly();
  templates = this.#templates.asReadonly();

  /**
   * Active saved calculations excluding soft-deleted entries.
   */
  activeSavedCalculations = computed(() => this.#savedCalculations().filter((record) => !record.deleted));

  /**
   * Reloads saved calculations from IndexedDB sorted by newest update first.
   */
  async refresh(): Promise<void> {
    const db = await this.getDatabase();
    const calculations = await db.getAll('calculations');
    this.#savedCalculations.set(calculations.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)));
  }

  /**
   * Reloads calculation templates from IndexedDB sorted by newest update first.
   */
  async refreshTemplates(): Promise<void> {
    const db = await this.getDatabase();
    const templates = await db.getAll('templates');
    this.#templates.set(templates.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)));
  }

  /**
   * Saves a planned calculation snapshot without mutating filament inventory.
   */
  async savePlannedCalculation(payload: SavePlannedCalculationPayload): Promise<CalculationRecord> {
    const projectName = payload.projectName.trim();
    if (!projectName) {
      throw new Error('Projektname fehlt');
    }

    if (payload.filamentSnapshots.length === 0) {
      throw new Error('Mindestens ein Filament ist erforderlich');
    }

    const timestamp = new Date().toISOString();
    const record: CalculationRecord = {
      id: crypto.randomUUID(),
      projectName,
      customerId: payload.customerId,
      printerSnapshot: cloneSnapshot(payload.printerSnapshot),
      filamentSnapshots: cloneSnapshot(payload.filamentSnapshots),
      calculationInput: cloneSnapshot(payload.calculationInput),
      calculationResult: cloneSnapshot(payload.calculationResult),
      timesPrinted: 0,
      timesSold: 0,
      timesGifted: 0,
      deleted: false,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const db = await this.getDatabase();
    await db.put('calculations', record);
    await this.refresh();
    return record;
  }

  /**
   * Saves a reusable calculation template in the dedicated templates store.
   */
  async saveTemplate(payload: SaveCalculationTemplatePayload): Promise<TemplateRecord> {
    const templateName = payload.templateName.trim();
    if (!templateName) {
      throw new Error('Vorlagenname fehlt');
    }

    if (payload.templateInput.filamentLines.length === 0) {
      throw new Error('Mindestens ein Filament ist erforderlich');
    }

    const timestamp = new Date().toISOString();
    const record: TemplateRecord = {
      id: crypto.randomUUID(),
      templateName,
      templateInput: cloneSnapshot(payload.templateInput),
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const db = await this.getDatabase();
    await db.put('templates', record);
    await this.refreshTemplates();
    return cloneSnapshot(record);
  }

  /**
   * Loads one template by id as a detached copy safe for in-form edits.
   */
  async loadTemplate(templateId: string): Promise<TemplateRecord | undefined> {
    const db = await this.getDatabase();
    const template = await db.get('templates', templateId);
    return template ? cloneSnapshot(template) : undefined;
  }

  /**
   * Loads one saved calculation together with derived sales/gift history data
   * for the Bestand detail surface.
   */
  async loadCalculationDetail(calculationId: string): Promise<CalculationDetailView | null> {
    const db = await this.getDatabase();
    const record = await db.get('calculations', calculationId);
    if (!record || record.deleted) {
      return null;
    }

    const sales = await db.getAllFromIndex('sales', 'calculationId', calculationId);
    const customers = await db.getAll('customers');
    return {
      record: cloneSnapshot(record),
      history: mapHistorySummary(record, sales, customers)
    };
  }

  /**
   * Records one explicit print occurrence and applies filament stock deduction
   * from saved filament line snapshots.
   */
  async recordPrintOccurrence(calculationId: string): Promise<RecordPrintOccurrenceResult> {
    const db = await this.getDatabase();
    const transaction = db.transaction(['calculations', 'filaments'], 'readwrite');
    const calculationsStore = transaction.objectStore('calculations');
    const filamentsStore = transaction.objectStore('filaments');
    const calculation = await calculationsStore.get(calculationId);

    if (!calculation || calculation.deleted) {
      throw new Error('Kalkulation nicht gefunden');
    }

    const filamentUpdates: FilamentRecord[] = [];
    let hasLowStockClamp = false;

    for (const line of calculation.filamentSnapshots) {
      const filament = await filamentsStore.get(line.filamentId);
      if (!filament) {
        throw new Error('Datenfehler: Filamentbestand konnte nicht abgezogen werden.');
      }

      const currentRemaining = typeof filament.remainingG === 'number' ? filament.remainingG : 0;
      const remainingAfterDeduction = currentRemaining - line.gramsUsed;
      if (remainingAfterDeduction < 0) {
        hasLowStockClamp = true;
      }

      filamentUpdates.push({
        ...filament,
        remainingG: Math.max(0, remainingAfterDeduction),
        updatedAt: new Date().toISOString()
      });
    }

    for (const filament of filamentUpdates) {
      await filamentsStore.put(filament);
    }

    await calculationsStore.put({
      ...calculation,
      timesPrinted: calculation.timesPrinted + 1,
      updatedAt: new Date().toISOString()
    });

    await transaction.done;
    await this.refresh();

    return hasLowStockClamp ? { warning: 'Warnung: Bestand war zu niedrig, Restmenge wurde auf 0 g gesetzt.' } : {};
  }

  /**
   * Persists one sale/gift transaction and updates derived sold/gifted counters
   * on the owning calculation. Filament stock is never mutated in this flow.
   */
  async recordSale(payload: RecordSalePayload): Promise<SaleRecord> {
    const date = payload.date.trim();
    if (!date || Number.isNaN(new Date(date).valueOf())) {
      throw new Error('Bitte Datum eingeben');
    }

    const isGift = payload.gifted === true;
    if (typeof payload.priceEur === 'number' && (!Number.isFinite(payload.priceEur) || payload.priceEur < 0)) {
      throw new Error('Preis darf nicht negativ sein');
    }

    const now = new Date().toISOString();
    const saleRecord: SaleRecord = {
      id: crypto.randomUUID(),
      calculationId: payload.calculationId,
      customerId: payload.customerId,
      date,
      priceEur: isGift ? 0 : payload.priceEur,
      gifted: isGift,
      isGift,
      note: payload.note?.trim() || undefined,
      createdAt: now,
      updatedAt: now
    };

    const db = await this.getDatabase();
    const transaction = db.transaction(['sales', 'calculations'], 'readwrite');
    const calculationsStore = transaction.objectStore('calculations');
    const calculation = await calculationsStore.get(payload.calculationId);
    if (!calculation || calculation.deleted) {
      throw new Error('Kalkulation nicht gefunden');
    }

    await transaction.objectStore('sales').put(saleRecord);
    await calculationsStore.put({
      ...calculation,
      timesSold: Math.max(0, calculation.timesSold ?? 0) + (isGift ? 0 : 1),
      timesGifted: Math.max(0, calculation.timesGifted ?? 0) + (isGift ? 1 : 0),
      updatedAt: new Date().toISOString()
    });

    await transaction.done;
    await this.refresh();
    return saleRecord;
  }
}

/**
 * Creates a deep, detached copy so saved snapshots cannot drift when source
 * records mutate later in-memory or in storage.
 */
function cloneSnapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Derives immutable sale/gift history counters and list rows from persisted
 * records so historical detail view remains stable after later source edits.
 */
function mapHistorySummary(
  record: CalculationRecord,
  sales: SaleRecord[],
  customers: CustomerRecord[]
): CalculationDetailHistorySummary {
  const customerNames = new Map(customers.map((customer) => [customer.id, customer.name]));
  const entries = [...sales]
    .sort((left, right) => right.date.localeCompare(left.date))
    .map((sale) => mapHistoryEntry(sale, customerNames));
  const soldCount = entries
    .filter((entry) => entry.entryType === 'sale')
    .reduce((sum, entry) => sum + entry.quantity, 0);
  const giftedCount = entries
    .filter((entry) => entry.entryType === 'gift')
    .reduce((sum, entry) => sum + entry.quantity, 0);
  const printedCount = Number.isFinite(record.timesPrinted) ? Math.max(0, record.timesPrinted) : 0;

  return {
    printedCount,
    soldCount,
    giftedCount,
    remainingCount: Math.max(printedCount - soldCount - giftedCount, 0),
    entries
  };
}

function mapHistoryEntry(sale: SaleRecord, customerNames: Map<string, string>): CalculationDetailHistoryEntry {
  const isGift = sale.gifted === true || sale.isGift === true;
  return {
    id: sale.id,
    dateLabel: formatHistoryDate(sale.date),
    entryType: isGift ? 'gift' : 'sale',
    quantity: normalizeQuantity(sale.quantity),
    priceLabel: isGift ? 'Geschenk' : formatPriceLabel(sale.priceEur),
    customerLabel: sale.customerId ? customerNames.get(sale.customerId) ?? 'Unbekannter Kunde' : null,
    note: sale.note?.trim() || null
  };
}

function normalizeQuantity(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return 1;
  }

  return Math.floor(value);
}

function formatPriceLabel(priceEur: number | undefined): string {
  if (typeof priceEur !== 'number' || !Number.isFinite(priceEur) || priceEur < 0) {
    return 'Preis offen';
  }

  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(priceEur);
}

function formatHistoryDate(value: string): string {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.valueOf())) {
    return '-';
  }

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(parsedDate);
}
