import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it } from 'vitest';

import { deletePrintCostDatabase, initializePrintCostDatabase } from '../db/printcost-db';
import { PrinterService } from './printer.service';

describe('PrinterService', () => {
  afterEach(async () => {
    await deletePrintCostDatabase();
  });

  it('exposes signal-like query state and async write command', async () => {
    const db = await initializePrintCostDatabase();
    const service = new PrinterService(() => Promise.resolve(db));

    await service.refresh();
    expect(service.printers().length).toBe(0);

    await service.savePrinter({
      id: 'printer-1',
      name: 'Prusa MK4',
      powerWatts: 350,
      purchasePriceEur: 1000,
      lifetimeHours: 10000,
      electricityPriceEurKwh: 0.35,
      annualBaseFeeEur: 0,
      deleted: false,
      createdAt: '2026-06-23T00:00:00.000Z',
      updatedAt: '2026-06-23T00:00:00.000Z'
    });

    expect(service.printers().length).toBe(1);
    expect(service.printers()[0]?.name).toBe('Prusa MK4');
  });
});
