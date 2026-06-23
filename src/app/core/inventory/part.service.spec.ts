import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it } from 'vitest';

import { deletePrintCostDatabase, initializePrintCostDatabase } from '../db/printcost-db';
import { PartService } from './part.service';

describe('PartService', () => {
  afterEach(async () => {
    await deletePrintCostDatabase();
  });

  it('persists a manual part with and without linked calculation', async () => {
    const db = await initializePrintCostDatabase();
    const service = new PartService(() => Promise.resolve(db));

    const standalone = await service.createPart({
      name: 'Distanzring',
      quantity: 2
    });

    const linked = await service.createPart({
      name: 'Rahmenhalter',
      quantity: 4,
      calculationId: 'calc-1',
      note: 'Set A'
    });

    expect(standalone.calculationId).toBeUndefined();
    expect(linked.calculationId).toBe('calc-1');
    expect(linked.note).toBe('Set A');
    expect(service.parts()).toHaveLength(2);
  });

  it('updates quantity with zero floor for decrement flows', async () => {
    const db = await initializePrintCostDatabase();
    const service = new PartService(() => Promise.resolve(db));
    const created = await service.createPart({
      name: 'Abstandshalter',
      quantity: 0
    });

    const unchanged = await service.updatePartQuantity(created.id, -1);
    expect(unchanged.quantity).toBe(0);

    const incremented = await service.updatePartQuantity(created.id, 3);
    expect(incremented.quantity).toBe(3);
  });

  it('rejects invalid payloads and does not persist them', async () => {
    const db = await initializePrintCostDatabase();
    const service = new PartService(() => Promise.resolve(db));

    await expect(
      service.createPart({
        name: '   ',
        quantity: 1
      })
    ).rejects.toThrow('Part name is required');

    await expect(
      service.createPart({
        name: 'Ungültig',
        quantity: -1
      })
    ).rejects.toThrow('Quantity cannot be negative');

    expect(service.parts()).toHaveLength(0);
  });
});
