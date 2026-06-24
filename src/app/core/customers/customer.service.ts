import { Inject, Injectable, InjectionToken, WritableSignal, computed, signal } from '@angular/core';
import { IDBPDatabase } from 'idb';

import { PrintCostDbSchema, initializePrintCostDatabase } from '../db/printcost-db';
import { CustomerPaymentMethod, CustomerRecord, CustomerType } from '../../domain/models/storage.models';

type DatabaseProvider = () => Promise<IDBPDatabase<PrintCostDbSchema>>;

/**
 * Input contract for customer create/edit writes.
 *
 * Validation is service-owned so UI forms stay lightweight and still enforce
 * one domain contract at persistence boundaries.
 */
export interface CustomerPayload {
  name: string;
  contact?: string;
  note?: string;
  paymentMethod?: CustomerPaymentMethod;
  customerType?: CustomerType;
  discountPercent?: number;
}

/**
 * Injection token for customer database access used in unit/integration tests.
 */
export const PRINTCOST_CUSTOMER_DB_PROVIDER = new InjectionToken<DatabaseProvider>('printcost-customer-db-provider', {
  providedIn: 'root',
  factory: () => initializePrintCostDatabase
});

/**
 * Owns customer CRUD, soft-delete semantics, and active selector projections.
 *
 * All writes flow through this service to preserve referential integrity:
 * calculations/sales can keep customer IDs while deleted customers are hidden
 * from active selectors.
 */
@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  readonly #customers: WritableSignal<CustomerRecord[]> = signal<CustomerRecord[]>([]);

  constructor(
    @Inject(PRINTCOST_CUSTOMER_DB_PROVIDER)
    private readonly getDatabase: DatabaseProvider = initializePrintCostDatabase
  ) {}

  customers = this.#customers.asReadonly();
  activeCustomers = computed(() => this.#customers().filter((record) => !record.deleted));

  async refresh(): Promise<void> {
    const db = await this.getDatabase();
    const customers = await db.getAll('customers');
    this.#customers.set(customers.sort((left, right) => left.name.localeCompare(right.name, 'de')));
  }

  async createCustomer(payload: CustomerPayload): Promise<CustomerRecord> {
    const sanitized = this.validateAndSanitize(payload);
    const timestamp = new Date().toISOString();
    const record: CustomerRecord = {
      id: crypto.randomUUID(),
      ...sanitized,
      deleted: false,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const db = await this.getDatabase();
    await db.put('customers', record);
    await this.refresh();
    return record;
  }

  async updateCustomer(id: string, payload: CustomerPayload): Promise<CustomerRecord> {
    const db = await this.getDatabase();
    const existing = await db.get('customers', id);
    if (!existing) {
      throw new Error('Customer not found');
    }

    const sanitized = this.validateAndSanitize(payload);
    const nextUpdatedAt = new Date().toISOString();
    const record: CustomerRecord = {
      ...existing,
      ...sanitized,
      updatedAt: nextUpdatedAt === existing.updatedAt ? new Date(Date.now() + 1).toISOString() : nextUpdatedAt
    };

    await db.put('customers', record);
    await this.refresh();
    return record;
  }

  async softDeleteCustomer(id: string): Promise<CustomerRecord> {
    const db = await this.getDatabase();
    const existing = await db.get('customers', id);
    if (!existing) {
      throw new Error('Customer not found');
    }

    const nextUpdatedAt = new Date().toISOString();
    const record: CustomerRecord = {
      ...existing,
      deleted: true,
      updatedAt: nextUpdatedAt === existing.updatedAt ? new Date(Date.now() + 1).toISOString() : nextUpdatedAt
    };

    await db.put('customers', record);
    await this.refresh();
    return record;
  }

  /**
   * Resolves a stable display label from the full cache (active + deleted).
   *
   * Selector UIs should use `activeCustomers`; history UIs can call this helper
   * so deleted records remain readable.
   */
  resolveDisplayName(customerId: string | undefined): string | null {
    if (!customerId) {
      return null;
    }

    return this.#customers().find((record) => record.id === customerId)?.name ?? 'Unbekannter Kunde';
  }

  validateAndSanitize(payload: CustomerPayload): CustomerPayload {
    const name = payload.name.trim();
    if (!name) {
      throw new Error('Customer name is required');
    }
    if (name.length > 120) {
      throw new Error('Customer name is too long');
    }

    const contact = payload.contact?.trim();
    if (contact && contact.length > 160) {
      throw new Error('Customer contact is too long');
    }

    const note = payload.note?.trim();
    if (note && note.length > 500) {
      throw new Error('Customer note is too long');
    }

    const paymentMethod =
      payload.paymentMethod && ['cash', 'transfer', 'invoice'].includes(payload.paymentMethod)
        ? payload.paymentMethod
        : undefined;

    const customerType =
      payload.customerType && ['private', 'business'].includes(payload.customerType) ? payload.customerType : undefined;

    let discountPercent: number | undefined;
    if (payload.discountPercent !== undefined && payload.discountPercent !== null) {
      const value = Number(payload.discountPercent);
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        throw new Error('Customer discount must be between 0 and 100');
      }
      discountPercent = value > 0 ? value : undefined;
    }

    return {
      name,
      contact,
      note,
      paymentMethod,
      customerType,
      discountPercent
    };
  }
}
