import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it } from 'vitest';

import { deletePrintCostDatabase, initializePrintCostDatabase } from '../db/printcost-db';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  afterEach(async () => {
    await deletePrintCostDatabase();
  });

  it('exposes read state and async command updates', async () => {
    const db = await initializePrintCostDatabase();
    const service = new SettingsService(() => Promise.resolve(db));

    await service.refresh();
    expect(service.settings()['defaultCurrency']).toBe('EUR');

    await service.setSetting('defaultCurrency', 'CHF');
    expect(service.settings()['defaultCurrency']).toBe('CHF');
  });
});
