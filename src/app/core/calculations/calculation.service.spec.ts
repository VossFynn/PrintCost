import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it } from 'vitest';

import { calculate, CalculationInput } from '../../domain/calculation/calculate';
import { deletePrintCostDatabase, initializePrintCostDatabase } from '../db/printcost-db';
import { CalculationRecord } from '../../domain/models/storage.models';
import { CalculationService, SaveCalculationTemplatePayload } from './calculation.service';

const baseInput = (): CalculationInput => ({
  filamentLines: [
    {
      gramsUsed: 12,
      priceMode: 'WEIGHTED_AVERAGE',
      purchases: [{ priceEur: 22, quantityKg: 1, purchasedAt: '2026-06-20' }]
    }
  ],
  printMinutes: 120,
  printQuantity: 2,
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
});

describe('CalculationService', () => {
  afterEach(async () => {
    await deletePrintCostDatabase();
  });

  it('saves full snapshot payload with timesPrinted=0 for planned calculations', async () => {
    const db = await initializePrintCostDatabase();
    const service = new CalculationService(() => Promise.resolve(db));
    const calculationInput = baseInput();
    const calculationResult = calculate(calculationInput);

    const saved = await service.savePlannedCalculation({
      projectName: 'Gehäuse',
      printerSnapshot: {
        id: 'printer-1',
        name: 'Prusa MK4',
        powerWatts: 350,
        purchasePriceEur: 1000,
        lifetimeHours: 10000,
        electricityPriceEurKwh: 0.35,
        annualBaseFeeEur: 0
      },
      filamentSnapshots: [
        {
          filamentId: 'filament-1',
          filamentName: 'PLA White',
          gramsUsed: 12,
          selectedPriceMode: 'WEIGHTED_AVERAGE',
          selectedPricePerGramEur: 0.022,
          filamentSnapshot: {
            id: 'filament-1',
            name: 'PLA White',
            type: 'PLA',
            colorHex: '#ffffff',
            manufacturer: 'Prusa',
            rollWeightG: 1000,
            remainingG: 700,
            purchases: [{ priceEur: 22, quantityKg: 1, purchasedAt: '2026-06-20' }],
            fixedPriceEurG: 0.03
          }
        }
      ],
      calculationInput,
      calculationResult
    });

    expect(saved.timesPrinted).toBe(0);
    expect(saved.deleted).toBe(false);
    expect(saved.calculationInput).toEqual(calculationInput);
    expect(saved.calculationResult).toEqual(calculationResult);
    expect(saved.filamentSnapshots[0]?.selectedPriceMode).toBe('WEIGHTED_AVERAGE');
    expect(saved.filamentSnapshots[0]?.selectedPricePerGramEur).toBeCloseTo(0.022, 10);
  });

  it('does not deduct filament remaining grams when saving a planned calculation', async () => {
    const db = await initializePrintCostDatabase();
    const service = new CalculationService(() => Promise.resolve(db));
    await db.put('filaments', {
      id: 'filament-1',
      name: 'PLA White',
      type: 'PLA',
      colorHex: '#ffffff',
      manufacturer: 'Prusa',
      rollWeightG: 1000,
      remainingG: 700,
      purchases: [{ priceEur: 22, quantityKg: 1, purchasedAt: '2026-06-20' }],
      deleted: false,
      createdAt: '2026-06-23T00:00:00.000Z',
      updatedAt: '2026-06-23T00:00:00.000Z'
    });

    await service.savePlannedCalculation({
      projectName: 'Halterung',
      printerSnapshot: {
        id: 'printer-1',
        name: 'Prusa MK4',
        powerWatts: 350,
        purchasePriceEur: 1000,
        lifetimeHours: 10000,
        electricityPriceEurKwh: 0.35,
        annualBaseFeeEur: 0
      },
      filamentSnapshots: [
        {
          filamentId: 'filament-1',
          filamentName: 'PLA White',
          gramsUsed: 12,
          selectedPriceMode: 'WEIGHTED_AVERAGE',
          selectedPricePerGramEur: 0.022,
          filamentSnapshot: {
            id: 'filament-1',
            name: 'PLA White',
            type: 'PLA',
            remainingG: 700,
            purchases: [{ priceEur: 22, quantityKg: 1, purchasedAt: '2026-06-20' }]
          }
        }
      ],
      calculationInput: baseInput(),
      calculationResult: calculate(baseInput())
    });

    const persistedFilament = await db.get('filaments', 'filament-1');
    expect(persistedFilament?.remainingG).toBe(700);
  });

  it('preserves historical snapshots even after source printer/filament edits', async () => {
    const db = await initializePrintCostDatabase();
    const service = new CalculationService(() => Promise.resolve(db));

    const saved = await service.savePlannedCalculation({
      projectName: 'Deckel',
      printerSnapshot: {
        id: 'printer-1',
        name: 'Prusa MK4',
        powerWatts: 350,
        purchasePriceEur: 1000,
        lifetimeHours: 10000,
        electricityPriceEurKwh: 0.35,
        annualBaseFeeEur: 0
      },
      filamentSnapshots: [
        {
          filamentId: 'filament-1',
          filamentName: 'PLA White',
          gramsUsed: 12,
          selectedPriceMode: 'PAID',
          selectedPricePerGramEur: 0.023,
          filamentSnapshot: {
            id: 'filament-1',
            name: 'PLA White',
            type: 'PLA',
            remainingG: 700,
            purchases: [{ priceEur: 23, quantityKg: 1, purchasedAt: '2026-06-20' }]
          }
        }
      ],
      calculationInput: baseInput(),
      calculationResult: calculate(baseInput())
    });

    await db.put('printers', {
      id: 'printer-1',
      name: 'Bambu X1',
      powerWatts: 450,
      purchasePriceEur: 1500,
      lifetimeHours: 9000,
      electricityPriceEurKwh: 0.4,
      annualBaseFeeEur: 50,
      deleted: false,
      createdAt: '2026-06-23T00:00:00.000Z',
      updatedAt: '2026-06-24T00:00:00.000Z'
    });

    await db.put('filaments', {
      id: 'filament-1',
      name: 'PETG Black',
      type: 'PETG',
      remainingG: 200,
      purchases: [{ priceEur: 40, quantityKg: 1, purchasedAt: '2026-06-24' }],
      deleted: false,
      updatedAt: '2026-06-24T00:00:00.000Z'
    });

    await service.refresh();
    const reloaded = service.savedCalculations().find((record) => record.id === saved.id);
    expect(reloaded?.printerSnapshot.name).toBe('Prusa MK4');
    expect(reloaded?.filamentSnapshots[0]?.filamentSnapshot.name).toBe('PLA White');
    expect(reloaded?.filamentSnapshots[0]?.selectedPricePerGramEur).toBeCloseTo(0.023, 10);
  });

  it('saves templates with independent template names in templates store', async () => {
    const db = await initializePrintCostDatabase();
    const service = new CalculationService(() => Promise.resolve(db));
    const payload: SaveCalculationTemplatePayload = {
      templateName: 'Lieblings-PLA',
      templateInput: {
        projectName: 'Kundenteil',
        printerId: 'printer-1',
        printHours: 2,
        printQuantity: 1,
        partsPerPlate: 1,
        modelExists: true,
        modelingCostEur: 0,
        extraWorkFeePercent: 0,
        profitMarginPercent: 10,
        filamentLines: [
          {
            filamentId: 'filament-1',
            grams: 20,
            priceMode: 'WEIGHTED_AVERAGE',
            fixedPriceEurG: 0
          }
        ]
      }
    };

    const saved = await service.saveTemplate(payload);
    const persisted = await db.get('templates', saved.id);

    expect(saved.templateName).toBe('Lieblings-PLA');
    expect(saved.templateInput.projectName).toBe('Kundenteil');
    expect(persisted?.templateName).toBe('Lieblings-PLA');
  });

  it('returns detached template copies so edits do not mutate stored templates', async () => {
    const db = await initializePrintCostDatabase();
    const service = new CalculationService(() => Promise.resolve(db));
    const saved = await service.saveTemplate({
      templateName: 'Standard',
      templateInput: {
        projectName: 'Alt',
        printerId: 'printer-1',
        printHours: 1,
        printQuantity: 1,
        partsPerPlate: 1,
        modelExists: true,
        modelingCostEur: 0,
        extraWorkFeePercent: 0,
        profitMarginPercent: 10,
        filamentLines: [
          {
            filamentId: 'filament-1',
            grams: 10,
            priceMode: 'WEIGHTED_AVERAGE',
            fixedPriceEurG: 0
          }
        ]
      }
    });

    const loaded = await service.loadTemplate(saved.id);
    expect(loaded).toBeTruthy();
    if (!loaded) {
      return;
    }

    loaded.templateInput.projectName = 'Geändert';
    loaded.templateInput.filamentLines[0]!.grams = 999;

    const reloaded = await service.loadTemplate(saved.id);
    expect(reloaded?.templateInput.projectName).toBe('Alt');
    expect(reloaded?.templateInput.filamentLines[0]?.grams).toBe(10);
  });

  it('builds calculation detail history with sold/gifted counts and customer labels', async () => {
    const db = await initializePrintCostDatabase();
    const service = new CalculationService(() => Promise.resolve(db));
    const saved = await service.savePlannedCalculation({
      projectName: 'Adapter',
      customerId: 'customer-1',
      printerSnapshot: {
        id: 'printer-1',
        name: 'Prusa MK4',
        powerWatts: 350,
        purchasePriceEur: 1000,
        lifetimeHours: 10000,
        electricityPriceEurKwh: 0.35,
        annualBaseFeeEur: 0
      },
      filamentSnapshots: [
        {
          filamentId: 'filament-1',
          filamentName: 'PLA Weiß',
          gramsUsed: 25,
          selectedPriceMode: 'PAID',
          selectedPricePerGramEur: 0.025,
          filamentSnapshot: {
            id: 'filament-1',
            name: 'PLA Weiß',
            type: 'PLA',
            remainingG: 700
          }
        }
      ],
      calculationInput: { ...baseInput(), printMinutes: 180 },
      calculationResult: calculate({ ...baseInput(), printMinutes: 180 })
    });
    await db.put('calculations', {
      ...saved,
      timesPrinted: 7
    });
    await db.put('customers', {
      id: 'customer-1',
      name: 'Anna Käuferin',
      deleted: false,
      createdAt: '2026-06-23T00:00:00.000Z',
      updatedAt: '2026-06-23T00:00:00.000Z'
    });
    await db.put('sales', {
      id: 'sale-1',
      calculationId: saved.id,
      customerId: 'customer-1',
      date: '2026-06-24',
      quantity: 2,
      priceEur: 19.9
    } as any);
    await db.put('sales', {
      id: 'sale-2',
      calculationId: saved.id,
      date: '2026-06-25',
      quantity: 1,
      isGift: true,
      note: 'Musterteil'
    } as any);

    const detail = await (service as any).loadCalculationDetail(saved.id);
    expect(detail).toBeTruthy();
    if (!detail) {
      return;
    }

    expect(detail.record.printerSnapshot.name).toBe('Prusa MK4');
    expect(detail.history.printedCount).toBe(7);
    expect(detail.history.soldCount).toBe(2);
    expect(detail.history.giftedCount).toBe(1);
    expect(detail.history.remainingCount).toBe(4);
    expect(detail.history.entries[0]?.entryType).toBe('gift');
    expect(detail.history.entries[0]?.priceLabel).toBe('Geschenk');
    expect(detail.history.entries[1]?.customerLabel).toBe('Anna Käuferin');
    expect(detail.history.entries[1]?.priceLabel).toBe('19,90 €');
  });

  it('records gift sales with price 0 and gifted=true without deducting filament stock', async () => {
    const db = await initializePrintCostDatabase();
    const service = new CalculationService(() => Promise.resolve(db));
    const saved = await service.savePlannedCalculation({
      projectName: 'Musterteil',
      printerSnapshot: {
        id: 'printer-1',
        name: 'Prusa MK4',
        powerWatts: 350,
        purchasePriceEur: 1000,
        lifetimeHours: 10000,
        electricityPriceEurKwh: 0.35,
        annualBaseFeeEur: 0
      },
      filamentSnapshots: [
        {
          filamentId: 'filament-1',
          filamentName: 'PLA Weiß',
          gramsUsed: 50,
          selectedPriceMode: 'PAID',
          selectedPricePerGramEur: 0.025,
          filamentSnapshot: {
            id: 'filament-1',
            name: 'PLA Weiß',
            type: 'PLA',
            remainingG: 700
          }
        }
      ],
      calculationInput: baseInput(),
      calculationResult: calculate(baseInput())
    });
    await db.put('calculations', { ...saved, timesPrinted: 4 });
    await db.put('filaments', createFilamentRecord({ id: 'filament-1', remainingG: 700 }));

    const sale = await service.recordSale({
      calculationId: saved.id,
      customerId: 'customer-1',
      date: '2026-06-26',
      priceEur: 0,
      gifted: true,
      note: 'Für Ausstellung'
    });

    const persistedSale = await db.get('sales', sale.id);
    const persistedCalculation = await db.get('calculations', saved.id);
    const persistedFilament = await db.get('filaments', 'filament-1');
    const detail = await service.loadCalculationDetail(saved.id);

    expect(persistedSale?.gifted).toBe(true);
    expect(persistedSale?.priceEur).toBe(0);
    expect(persistedCalculation?.timesGifted).toBe(1);
    expect(persistedCalculation?.timesSold).toBe(0);
    expect(persistedFilament?.remainingG).toBe(700);
    expect(detail?.history.giftedCount).toBe(1);
    expect(detail?.history.remainingCount).toBe(3);
  });

  it('records a print occurrence by incrementing timesPrinted on existing calculation and not creating a new one', async () => {
    const db = await initializePrintCostDatabase();
    const service = new CalculationService(() => Promise.resolve(db));
    const calculation = createSavedCalculation({
      id: 'calc-1',
      timesPrinted: 2,
      filamentSnapshots: [{ filamentId: 'filament-1', gramsUsed: 15 }]
    });
    await db.put('calculations', calculation);
    await db.put('filaments', createFilamentRecord({ id: 'filament-1', remainingG: 200 }));

    await service.recordPrintOccurrence('calc-1');

    const calculations = await db.getAll('calculations');
    expect(calculations).toHaveLength(1);
    expect(calculations[0]?.id).toBe('calc-1');
    expect(calculations[0]?.timesPrinted).toBe(3);
  });

  it('deducts grams by saved filamentId including soft-deleted filament records', async () => {
    const db = await initializePrintCostDatabase();
    const service = new CalculationService(() => Promise.resolve(db));
    await db.put(
      'calculations',
      createSavedCalculation({
        id: 'calc-1',
        filamentSnapshots: [
          { filamentId: 'active-filament', gramsUsed: 20 },
          { filamentId: 'soft-deleted-filament', gramsUsed: 30 }
        ]
      })
    );
    await db.put('filaments', createFilamentRecord({ id: 'active-filament', remainingG: 120, deleted: false }));
    await db.put('filaments', createFilamentRecord({ id: 'soft-deleted-filament', remainingG: 70, deleted: true }));

    await service.recordPrintOccurrence('calc-1');

    expect((await db.get('filaments', 'active-filament'))?.remainingG).toBe(100);
    expect((await db.get('filaments', 'soft-deleted-filament'))?.remainingG).toBe(40);
  });

  it('does not block low-stock print occurrence and clamps remainingG to 0 with German warning', async () => {
    const db = await initializePrintCostDatabase();
    const service = new CalculationService(() => Promise.resolve(db));
    await db.put(
      'calculations',
      createSavedCalculation({
        id: 'calc-1',
        timesPrinted: 0,
        filamentSnapshots: [{ filamentId: 'filament-1', gramsUsed: 50 }]
      })
    );
    await db.put('filaments', createFilamentRecord({ id: 'filament-1', remainingG: 20 }));

    const result = await service.recordPrintOccurrence('calc-1');

    expect(result.warning).toContain('Warnung');
    expect((await db.get('filaments', 'filament-1'))?.remainingG).toBe(0);
    expect((await db.get('calculations', 'calc-1'))?.timesPrinted).toBe(1);
  });

  it('blocks print occurrence when referenced filament is missing and returns German data error', async () => {
    const db = await initializePrintCostDatabase();
    const service = new CalculationService(() => Promise.resolve(db));
    await db.put(
      'calculations',
      createSavedCalculation({
        id: 'calc-1',
        timesPrinted: 2,
        filamentSnapshots: [{ filamentId: 'missing-filament', gramsUsed: 25 }]
      })
    );

    await expect(service.recordPrintOccurrence('calc-1')).rejects.toThrow(
      'Datenfehler: Filamentbestand konnte nicht abgezogen werden.'
    );
    expect((await db.get('calculations', 'calc-1'))?.timesPrinted).toBe(2);
  });
});

type FilamentLineSeed = {
  filamentId: string;
  gramsUsed: number;
};

function createSavedCalculation(seed: {
  id: string;
  timesPrinted?: number;
  filamentSnapshots?: FilamentLineSeed[];
}): CalculationRecord {
  const input = baseInput();
  return {
    id: seed.id,
    projectName: 'Projekt',
    printerSnapshot: {
      id: 'printer-1',
      name: 'Prusa MK4',
      powerWatts: 350,
      purchasePriceEur: 1000,
      lifetimeHours: 10000,
      electricityPriceEurKwh: 0.35,
      annualBaseFeeEur: 0
    },
    filamentSnapshots: (seed.filamentSnapshots ?? []).map((line) => ({
      filamentId: line.filamentId,
      filamentName: line.filamentId,
      gramsUsed: line.gramsUsed,
      selectedPriceMode: 'WEIGHTED_AVERAGE',
      selectedPricePerGramEur: 0.02,
      filamentSnapshot: {
        id: line.filamentId,
        name: line.filamentId,
        type: 'PLA',
        remainingG: 100,
        purchases: [{ priceEur: 20, quantityKg: 1, purchasedAt: '2026-06-20' }]
      }
    })),
    calculationInput: input,
    calculationResult: calculate(input),
    timesPrinted: seed.timesPrinted ?? 0,
    deleted: false,
    createdAt: '2026-06-23T00:00:00.000Z',
    updatedAt: '2026-06-23T00:00:00.000Z'
  };
}

function createFilamentRecord(seed: { id: string; remainingG: number; deleted?: boolean }) {
  return {
    id: seed.id,
    name: seed.id,
    type: 'PLA',
    remainingG: seed.remainingG,
    purchases: [{ priceEur: 20, quantityKg: 1, purchasedAt: '2026-06-20' }],
    deleted: seed.deleted ?? false,
    createdAt: '2026-06-23T00:00:00.000Z',
    updatedAt: '2026-06-23T00:00:00.000Z'
  };
}
