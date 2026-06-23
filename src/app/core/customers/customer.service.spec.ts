import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it } from 'vitest';

import { deletePrintCostDatabase, initializePrintCostDatabase } from '../db/printcost-db';
import { CustomerService } from './customer.service';

describe('CustomerService', () => {
  afterEach(async () => {
    await deletePrintCostDatabase();
  });

  it('creates customer records and exposes only active customers in selector list', async () => {
    const db = await initializePrintCostDatabase();
    const service = new CustomerService(() => Promise.resolve(db));

    await service.refresh();
    expect(service.activeCustomers().length).toBe(0);

    await service.createCustomer({
      name: '  Anna Käuferin  ',
      contact: '  anna@example.com  ',
      note: '  Stammkundin  '
    });

    expect(service.activeCustomers()).toHaveLength(1);
    expect(service.activeCustomers()[0]?.name).toBe('Anna Käuferin');
    expect(service.activeCustomers()[0]?.contact).toBe('anna@example.com');
    expect(service.activeCustomers()[0]?.note).toBe('Stammkundin');
  });

  it('validates customer payload against domain contract', async () => {
    const db = await initializePrintCostDatabase();
    const service = new CustomerService(() => Promise.resolve(db));

    await expect(service.createCustomer({ name: '   ' })).rejects.toThrow('Customer name is required');
    await expect(service.createCustomer({ name: 'A'.repeat(121) })).rejects.toThrow('Customer name is too long');
    await expect(service.createCustomer({ name: 'Valid', contact: 'A'.repeat(161) })).rejects.toThrow(
      'Customer contact is too long'
    );
    await expect(service.createCustomer({ name: 'Valid', note: 'A'.repeat(501) })).rejects.toThrow(
      'Customer note is too long'
    );
  });

  it('soft deletes customers while preserving historical readability for calculations and sales', async () => {
    const db = await initializePrintCostDatabase();
    const service = new CustomerService(() => Promise.resolve(db));
    const created = await service.createCustomer({
      name: 'Anna Käuferin',
      contact: 'anna@example.com'
    });

    await db.put('calculations', {
      id: 'calc-1',
      projectName: 'Halterung',
      customerId: created.id,
      printerSnapshot: {
        id: 'printer-1',
        name: 'Prusa MK4',
        powerWatts: 350,
        purchasePriceEur: 1000,
        lifetimeHours: 10000,
        electricityPriceEurKwh: 0.35,
        annualBaseFeeEur: 0
      },
      filamentSnapshots: [],
      calculationInput: {
        filamentLines: [],
        printMinutes: 60,
        printQuantity: 1,
        partsPerPlate: 1,
        extraWorkFeePercent: 0,
        modelExists: true,
        modelingCostEur: 0,
        profitMarginPercent: 10,
        powerWatts: 350,
        electricityPriceEurKwh: 0.35,
        annualBaseFeeEur: 0,
        purchasePriceEur: 1000,
        lifetimeHours: 10000
      },
      calculationResult: {
        plateCount: 1,
        totalGrams: 0,
        materialCostEur: 0,
        electricityCostEur: 0,
        depreciationCostEur: 0,
        modelingCostEur: 0,
        extraWorkFeeEur: 0,
        subtotalEur: 0,
        finalPriceEur: 0,
        roundedFinalPriceEur: 0
      },
      timesPrinted: 0,
      deleted: false,
      createdAt: '2026-06-23T00:00:00.000Z',
      updatedAt: '2026-06-23T00:00:00.000Z'
    });
    await db.put('sales', {
      id: 'sale-1',
      calculationId: 'calc-1',
      customerId: created.id,
      date: '2026-06-23'
    });

    await service.softDeleteCustomer(created.id);

    expect(service.activeCustomers()).toHaveLength(0);
    expect(service.customers()).toHaveLength(1);
    expect(service.customers()[0]?.deleted).toBe(true);
    expect(service.resolveDisplayName(created.id)).toBe('Anna Käuferin');
    expect(service.resolveDisplayName(undefined)).toBeNull();

    const persistedCalculation = await db.get('calculations', 'calc-1');
    const persistedSale = await db.get('sales', 'sale-1');
    expect(persistedCalculation?.customerId).toBe(created.id);
    expect(persistedSale?.customerId).toBe(created.id);
  });
});
