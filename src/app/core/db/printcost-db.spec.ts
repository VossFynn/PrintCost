import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it } from 'vitest';

import {
  DB_NAME,
  deletePrintCostDatabase,
  initializePrintCostDatabase,
  readSetting,
  writeSetting
} from './printcost-db';

describe('printcost-db', () => {
  afterEach(async () => {
    await deletePrintCostDatabase();
  });

  it('creates v1 stores and indexes', async () => {
    const db = await initializePrintCostDatabase();

    expect(db.name).toBe(DB_NAME);
    expect(Array.from(db.objectStoreNames).sort()).toEqual([
      'calculations',
      'customers',
      'filaments',
      'parts',
      'printers',
      'sales',
      'settings',
      'templates'
    ]);

    const filamentsTx = db.transaction('filaments', 'readonly');
    expect(Array.from(filamentsTx.store.indexNames).sort()).toEqual(['deleted', 'type']);
    await filamentsTx.done;

    const calculationsTx = db.transaction('calculations', 'readonly');
    expect(Array.from(calculationsTx.store.indexNames).sort()).toEqual(['customerId', 'deleted', 'updatedAt']);
    await calculationsTx.done;
  });

  it('seeds settings once and does not overwrite edited settings', async () => {
    const db = await initializePrintCostDatabase();
    const seededSetting = await readSetting(db, 'defaultCurrency');
    expect(seededSetting?.value).toBe('EUR');

    await writeSetting(db, 'defaultCurrency', 'USD');

    const reopenedDb = await initializePrintCostDatabase();
    const persistedSetting = await readSetting(reopenedDb, 'defaultCurrency');
    expect(persistedSetting?.value).toBe('USD');
  });

  it('round-trips settings through core/db helpers', async () => {
    const db = await initializePrintCostDatabase();

    await writeSetting(db, 'test-setting', { ok: true, count: 3 });
    const loaded = await readSetting(db, 'test-setting');

    expect(loaded).toEqual({
      key: 'test-setting',
      value: { ok: true, count: 3 }
    });
  });
});
