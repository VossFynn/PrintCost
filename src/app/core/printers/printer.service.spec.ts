import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it } from 'vitest';

import { deletePrintCostDatabase, initializePrintCostDatabase } from '../db/printcost-db';
import { PrinterService } from './printer.service';

describe('PrinterService', () => {
  afterEach(async () => {
    await deletePrintCostDatabase();
  });

  it('creates printer and exposes only active printers in active list', async () => {
    const db = await initializePrintCostDatabase();
    const service = new PrinterService(() => Promise.resolve(db));

    await service.refresh();
    expect(service.activePrinters().length).toBe(0);

    await service.createPrinter({
      name: 'Prusa MK4',
      powerWatts: 350,
      purchasePriceEur: 1000,
      lifetimeHours: 10000,
      note: '  Workhorse  '
    });

    expect(service.activePrinters().length).toBe(1);
    expect(service.activePrinters()[0]?.name).toBe('Prusa MK4');
    expect(service.activePrinters()[0]?.note).toBe('Workhorse');
  });

  it('updates existing printer while preserving immutable fields', async () => {
    const db = await initializePrintCostDatabase();
    const service = new PrinterService(() => Promise.resolve(db));
    await service.createPrinter({
      name: 'Prusa MK4',
      powerWatts: 350,
      purchasePriceEur: 1000,
      lifetimeHours: 10000
    });

    const created = service.activePrinters()[0];
    await service.updatePrinter(created.id, {
      name: 'Prusa XL',
      powerWatts: 400,
      purchasePriceEur: 2000,
      lifetimeHours: 8000,
      note: 'Updated profile'
    });

    const updated = service.activePrinters()[0];
    expect(updated?.id).toBe(created.id);
    expect(updated?.createdAt).toBe(created.createdAt);
    expect(updated?.updatedAt).not.toBe(created.updatedAt);
    expect(updated?.name).toBe('Prusa XL');
  });

  it('rejects invalid payloads', async () => {
    const db = await initializePrintCostDatabase();
    const service = new PrinterService(() => Promise.resolve(db));

    await expect(
      service.createPrinter({
        name: '   ',
        powerWatts: 350,
        purchasePriceEur: 1000,
        lifetimeHours: 10000
      })
    ).rejects.toThrow('Printer name is required');

    await expect(
      service.createPrinter({
        name: 'Prusa MK4',
        powerWatts: -1,
        purchasePriceEur: 1000,
        lifetimeHours: 10000
      })
    ).rejects.toThrow('Power must be greater than 0');
  });

  it('excludes deleted printers from active list', async () => {
    const db = await initializePrintCostDatabase();
    const service = new PrinterService(() => Promise.resolve(db));

    await service.createPrinter({
      name: 'Prusa MK4',
      powerWatts: 350,
      purchasePriceEur: 1000,
      lifetimeHours: 10000
    });

    const created = service.activePrinters()[0];
    await db.put('printers', { ...created, deleted: true });
    await service.refresh();

    expect(service.printers().length).toBe(1);
    expect(service.activePrinters().length).toBe(0);
  });

  it('soft deletes printer records but keeps them retrievable by id', async () => {
    const db = await initializePrintCostDatabase();
    const service = new PrinterService(() => Promise.resolve(db));

    const created = await service.createPrinter({
      name: 'Bambu P1S',
      powerWatts: 400,
      purchasePriceEur: 750,
      lifetimeHours: 9000
    });

    await service.softDeletePrinter(created.id);

    expect(service.activePrinters()).toHaveLength(0);
    expect(service.printers()).toHaveLength(1);
    expect(service.printers()[0]?.deleted).toBe(true);

    const persisted = await db.get('printers', created.id);
    expect(persisted?.id).toBe(created.id);
    expect(persisted?.deleted).toBe(true);
  });
});
