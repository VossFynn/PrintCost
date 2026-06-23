import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it } from 'vitest';

import { deletePrintCostDatabase, initializePrintCostDatabase } from '../db/printcost-db';
import { FilamentPayload, FilamentService } from './filament.service';

const validPayload = (): FilamentPayload => ({
  name: 'PLA White',
  type: 'PLA',
  colorHex: '#ffffff',
  manufacturer: 'Prusa',
  rollWeightG: 1000,
  remainingG: 750,
  purchases: [{ priceEur: 22.99, quantityKg: 1, purchasedAt: '2026-06-20' }],
  multiColorSurchargeEurKg: 0,
  fixedPriceEurG: undefined
});

describe('FilamentService', () => {
  afterEach(async () => {
    await deletePrintCostDatabase();
  });

  it('loads active filaments and backfills defaults for legacy records', async () => {
    const db = await initializePrintCostDatabase();
    await db.put('filaments', {
      id: 'legacy',
      name: 'Legacy PLA',
      type: 'PLA',
      deleted: false,
      updatedAt: '2026-01-01T00:00:00.000Z'
    });

    const service = new FilamentService(() => Promise.resolve(db));
    await service.refresh();

    const loaded = service.filaments()[0];
    expect(loaded.colorHex).toBe('#000000');
    expect(loaded.rollWeightG).toBe(0);
    expect(loaded.remainingG).toBe(0);
    expect(loaded.purchases).toEqual([]);
    expect(service.activeFilaments()).toHaveLength(1);
  });

  it('rejects create payload without at least one valid purchase', async () => {
    const db = await initializePrintCostDatabase();
    const service = new FilamentService(() => Promise.resolve(db));

    await expect(
      service.createFilament({
        ...validPayload(),
        purchases: []
      })
    ).rejects.toThrow('At least one valid purchase is required');
  });

  it('creates and updates filament with persisted purchases', async () => {
    const db = await initializePrintCostDatabase();
    const service = new FilamentService(() => Promise.resolve(db));

    const created = await service.createFilament(validPayload());
    expect(service.activeFilaments()).toHaveLength(1);
    expect(created.purchases).toHaveLength(1);

    const updated = await service.updateFilament(created.id, {
      ...validPayload(),
      remainingG: 0,
      purchases: [
        { priceEur: 22.99, quantityKg: 1, purchasedAt: '2026-06-20' },
        { priceEur: 24.5, quantityKg: 0.75, purchasedAt: '2026-06-22' }
      ]
    });

    expect(updated.id).toBe(created.id);
    expect(updated.purchases).toHaveLength(2);
    expect(service.activeFilaments()[0]?.remainingG).toBe(0);
  });

  it('soft-delete style filtering hides deleted records from active list', async () => {
    const db = await initializePrintCostDatabase();
    const service = new FilamentService(() => Promise.resolve(db));
    const created = await service.createFilament(validPayload());

    await db.put('filaments', { ...created, deleted: true });
    await service.refresh();

    expect(service.filaments()).toHaveLength(1);
    expect(service.activeFilaments()).toHaveLength(0);
  });

  it('soft-deletes filament records without breaking by-id lookup', async () => {
    const db = await initializePrintCostDatabase();
    const service = new FilamentService(() => Promise.resolve(db));
    const created = await service.createFilament(validPayload());

    const deleted = await service.softDeleteFilament(created.id);
    expect(deleted.deleted).toBe(true);
    expect(service.activeFilaments()).toHaveLength(0);
    expect(service.getFilamentById(created.id)?.deleted).toBe(true);
  });

  it('calculates weighted average and last-paid price per gram', () => {
    const service = new FilamentService();
    const filament = {
      id: 'filament-1',
      name: 'PLA White',
      type: 'PLA',
      colorHex: '#ffffff',
      manufacturer: 'Prusa',
      rollWeightG: 1000,
      remainingG: 750,
      purchases: [
        { priceEur: 20, quantityKg: 1, purchasedAt: '2026-06-20' },
        { priceEur: 24, quantityKg: 0.5, purchasedAt: '2026-06-22' }
      ],
      multiColorSurchargeEurKg: 0,
      fixedPriceEurG: 0.031,
      deleted: false,
      updatedAt: '2026-06-23T00:00:00.000Z'
    };

    expect(service.weightedAveragePricePerGram(filament)).toBeCloseTo(0.0213333333, 10);
    expect(service.lastPaidPricePerGram(filament)).toBeCloseTo(0.024, 10);
    expect(service.pricePerGramForMode(filament, 'FIXED')).toBeCloseTo(0.031, 10);
  });

  it('calculates weighted average from a single purchase', () => {
    const service = new FilamentService();
    const filament = {
      id: 'filament-1a',
      name: 'PLA White',
      type: 'PLA',
      colorHex: '#ffffff',
      manufacturer: 'Prusa',
      rollWeightG: 1000,
      remainingG: 750,
      purchases: [{ priceEur: 22.99, quantityKg: 1, purchasedAt: '2026-06-20' }],
      multiColorSurchargeEurKg: 0,
      fixedPriceEurG: 0.02299,
      deleted: false,
      updatedAt: '2026-06-23T00:00:00.000Z'
    };

    expect(service.weightedAveragePricePerGram(filament)).toBeCloseTo(0.02299, 10);
  });

  it('uses the latest same-day purchase and rejects missing fixed price', () => {
    const service = new FilamentService();
    const filament = {
      id: 'filament-2',
      name: 'PLA Black',
      type: 'PLA',
      colorHex: '#000000',
      manufacturer: 'Prusa',
      rollWeightG: 1000,
      remainingG: 500,
      purchases: [
        { priceEur: 18, quantityKg: 1, purchasedAt: '2026-06-22' },
        { priceEur: 26, quantityKg: 1, purchasedAt: '2026-06-22' }
      ],
      multiColorSurchargeEurKg: 0,
      fixedPriceEurG: undefined,
      deleted: false,
      updatedAt: '2026-06-23T00:00:00.000Z'
    };

    expect(service.lastPaidPricePerGram(filament)).toBeCloseTo(0.026, 10);
    expect(() => service.pricePerGramForMode(filament, 'FIXED')).toThrow('Bitte Fixpreis eingeben');
  });

  it('does not mutate purchase history while resolving price basis', () => {
    const service = new FilamentService();
    const purchases = [
      { priceEur: 20, quantityKg: 1, purchasedAt: '2026-06-20' },
      { priceEur: 24, quantityKg: 0.5, purchasedAt: '2026-06-22' }
    ];
    const filament = {
      id: 'filament-3',
      name: 'PETG Gray',
      type: 'PETG',
      colorHex: '#808080',
      manufacturer: 'Prusa',
      rollWeightG: 1000,
      remainingG: 500,
      purchases,
      multiColorSurchargeEurKg: 0,
      fixedPriceEurG: 0.026,
      deleted: false,
      updatedAt: '2026-06-23T00:00:00.000Z'
    };

    const snapshot = JSON.parse(JSON.stringify(filament));
    service.pricePerGramForMode(filament, 'WEIGHTED_AVERAGE');
    service.pricePerGramForMode(filament, 'PAID');

    expect(filament).toEqual(snapshot);
    expect(purchases).toEqual(snapshot.purchases);
  });

  it('throws a German error when a filament id cannot be resolved', () => {
    const service = new FilamentService();

    expect(() => service.requireFilamentById('missing')).toThrow('Filament nicht gefunden');
  });
});
