import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DB_VERSION, deletePrintCostDatabase, initializePrintCostDatabase } from '../db/printcost-db';
import { BackupFormat } from '../../domain/models/storage.models';
import { BackupService } from './backup.service';

function makeValidBackup(overrides: Partial<BackupFormat> = {}): BackupFormat {
  return {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    printers: [],
    filaments: [],
    calculations: [],
    sales: [],
    customers: [],
    templates: [],
    parts: [],
    settings: [],
    ...overrides
  };
}

describe('BackupService.exportBackup()', () => {
  let service: BackupService;

  beforeEach(async () => {
    const db = await initializePrintCostDatabase();
    service = new BackupService(() => Promise.resolve(db));

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await deletePrintCostDatabase();
  });

  it('triggers download: creates blob URL, clicks anchor, and revokes URL', async () => {
    await service.exportBackup();

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    const appendedNode = (document.body.appendChild as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as HTMLAnchorElement;
    expect(appendedNode instanceof HTMLAnchorElement).toBe(true);
    expect(appendedNode?.download).toMatch(/^printcost-backup-\d{4}-\d{2}-\d{2}\.json$/);
    expect(appendedNode?.href).toContain('blob:');
  });

  it('does not make any network fetch calls', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(new Response());
    await service.exportBackup();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('serializes a valid BackupFormat structure with version and 8 store arrays', async () => {
    const blobs: Blob[] = [];
    vi.spyOn(URL, 'createObjectURL').mockImplementation((obj: Blob | MediaSource) => {
      if (obj instanceof Blob) {
        blobs.push(obj);
      }
      return 'blob:mock-url';
    });

    await service.exportBackup();
    await new Promise((r) => setTimeout(r, 10));

    expect(blobs).toHaveLength(1);
    const text = await blobs[0]!.text();
    const parsed = JSON.parse(text) as BackupFormat;
    expect(parsed.version).toBe(DB_VERSION);
    expect(typeof parsed.exportedAt).toBe('string');
    for (const store of ['printers', 'filaments', 'calculations', 'sales', 'customers', 'templates', 'parts', 'settings'] as const) {
      expect(Array.isArray(parsed[store])).toBe(true);
    }
  });
});

describe('BackupService.validateBackup()', () => {
  let service: BackupService;

  beforeEach(async () => {
    const db = await initializePrintCostDatabase();
    service = new BackupService(() => Promise.resolve(db));
  });

  afterEach(async () => {
    await deletePrintCostDatabase();
  });

  it('throws on null input', () => {
    expect(() => service.validateBackup(null)).toThrow();
  });

  it('throws on non-object input', () => {
    expect(() => service.validateBackup('hello')).toThrow();
  });

  it('throws on array input', () => {
    expect(() => service.validateBackup([])).toThrow();
  });

  it('throws when version mismatches DB_VERSION', () => {
    const bad = makeValidBackup({ version: DB_VERSION + 99 });
    expect(() => service.validateBackup(bad)).toThrow(/version/i);
  });

  it('throws when exportedAt is missing', () => {
    const bad = { version: DB_VERSION, printers: [], filaments: [], calculations: [], sales: [], customers: [], templates: [], parts: [], settings: [] };
    expect(() => service.validateBackup(bad)).toThrow();
  });

  it('throws when a required store array is missing', () => {
    const bad = makeValidBackup() as Partial<BackupFormat>;
    delete bad.filaments;
    expect(() => service.validateBackup(bad)).toThrow(/filaments/i);
  });

  it('returns typed BackupFormat for a valid payload', () => {
    const valid = makeValidBackup();
    const result = service.validateBackup(valid);
    expect(result.version).toBe(DB_VERSION);
    expect(Array.isArray(result.printers)).toBe(true);
  });
});

describe('BackupService.importBackup()', () => {
  let service: BackupService;

  beforeEach(async () => {
    const db = await initializePrintCostDatabase();
    service = new BackupService(() => Promise.resolve(db));
  });

  afterEach(async () => {
    await deletePrintCostDatabase();
  });

  it('clears existing records and populates from backup', async () => {
    const db = await initializePrintCostDatabase();
    await db.put('printers', {
      id: 'p1', name: 'Existing', powerWatts: 100, purchasePriceEur: 500,
      lifetimeHours: 5000, electricityPriceEurKwh: 0.3, annualBaseFeeEur: 0,
      deleted: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });

    const backup = makeValidBackup({
      printers: [
        { id: 'p2', name: 'Restored', powerWatts: 200, purchasePriceEur: 800,
          lifetimeHours: 8000, electricityPriceEurKwh: 0.35, annualBaseFeeEur: 0,
          deleted: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ]
    });

    await service.importBackup(backup);

    const allPrinters = await db.getAll('printers');
    expect(allPrinters).toHaveLength(1);
    expect(allPrinters[0]?.id).toBe('p2');
  });

  it('repopulates settings store using key/value shape', async () => {
    const db = await initializePrintCostDatabase();
    const backup = makeValidBackup({
      settings: [
        { key: 'locale', value: 'de-DE' },
        { key: 'defaultPriceMode', value: 'PAID' }
      ]
    });

    await service.importBackup(backup);

    const priceSetting = await db.get('settings', 'defaultPriceMode');
    expect(priceSetting?.value).toBe('PAID');
  });

  it('calls seedDefaultSettings after import to fill missing default keys', async () => {
    const db = await initializePrintCostDatabase();
    const backup = makeValidBackup({ settings: [] });

    await service.importBackup(backup);

    const localeSetting = await db.get('settings', 'locale');
    expect(localeSetting?.value).toBe('de-DE');
  });
});

describe('BackupService.clearAllData()', () => {
  let service: BackupService;

  beforeEach(async () => {
    const db = await initializePrintCostDatabase();
    service = new BackupService(() => Promise.resolve(db));
  });

  afterEach(async () => {
    await deletePrintCostDatabase();
  });

  it('clears all 8 stores', async () => {
    const db = await initializePrintCostDatabase();
    await db.put('printers', {
      id: 'p1', name: 'Test', powerWatts: 100, purchasePriceEur: 500,
      lifetimeHours: 5000, electricityPriceEurKwh: 0.3, annualBaseFeeEur: 0,
      deleted: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });

    await service.clearAllData();

    const printers = await db.getAll('printers');
    expect(printers).toHaveLength(0);
  });

  it('re-seeds default settings after clearing', async () => {
    const db = await initializePrintCostDatabase();
    await service.clearAllData();

    const localeSetting = await db.get('settings', 'locale');
    expect(localeSetting?.value).toBe('de-DE');
  });
});
