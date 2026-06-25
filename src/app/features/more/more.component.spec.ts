import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { BackupService } from '../../core/backup/backup.service';
import { CalculationService } from '../../core/calculations/calculation.service';
import { CustomerService } from '../../core/customers/customer.service';
import { FilamentService } from '../../core/filaments/filament.service';
import { PartService } from '../../core/inventory/part.service';
import { PrinterService } from '../../core/printers/printer.service';
import { SettingsService } from '../../core/settings/settings.service';
import { BackupFormat, CustomerRecord, PrinterRecord } from '../../domain/models/storage.models';
import { MoreComponent } from './more.component';

class MockPrinterService {
  private readonly printersSignal = signal<PrinterRecord[]>([]);

  printers = this.printersSignal.asReadonly();
  activePrinters = this.printersSignal.asReadonly();

  refreshCalls = 0;
  createCalls = 0;
  updateCalls = 0;
  softDeleteCalls = 0;
  lastCreatedPayload: unknown;
  lastUpdatedPayload: unknown;
  lastSoftDeletedId: string | null = null;

  async refresh() {
    this.refreshCalls += 1;
  }

  async createPrinter(payload: unknown) {
    this.createCalls += 1;
    this.lastCreatedPayload = payload;

    const now = new Date().toISOString();
    this.printersSignal.set([
      ...this.printersSignal(),
      {
        id: `printer-${this.printersSignal().length + 1}`,
        name: 'Prusa MK4',
        powerWatts: 350,
        purchasePriceEur: 1000,
        lifetimeHours: 10000,
        electricityPriceEurKwh: 0.35,
        annualBaseFeeEur: 0,
        deleted: false,
        createdAt: now,
        updatedAt: now
      }
    ]);
  }

  async updatePrinter(id: string, payload: unknown) {
    this.updateCalls += 1;
    this.lastUpdatedPayload = { id, payload };
  }

  async softDeletePrinter(id: string) {
    this.softDeleteCalls += 1;
    this.lastSoftDeletedId = id;
    this.printersSignal.update((printers) => printers.filter((printer) => printer.id !== id));
  }
}

class MockCustomerService {
  private readonly customersSignal = signal<CustomerRecord[]>([]);

  customers = this.customersSignal.asReadonly();
  activeCustomers = this.customersSignal.asReadonly();

  refreshCalls = 0;
  createCalls = 0;
  updateCalls = 0;
  softDeleteCalls = 0;
  lastSoftDeletedId: string | null = null;

  async refresh() {
    this.refreshCalls += 1;
  }

  async createCustomer(payload: { name: string; contact?: string; note?: string }) {
    this.createCalls += 1;
    const now = new Date().toISOString();
    const record: CustomerRecord = {
      id: `customer-${this.customersSignal().length + 1}`,
      name: payload.name.trim(),
      contact: payload.contact?.trim(),
      note: payload.note?.trim(),
      deleted: false,
      createdAt: now,
      updatedAt: now
    };
    this.customersSignal.set([...this.customersSignal(), record]);
    return record;
  }

  async updateCustomer(id: string, payload: { name: string; contact?: string; note?: string }) {
    this.updateCalls += 1;
    const now = new Date().toISOString();
    this.customersSignal.update((customers) =>
      customers.map((customer) =>
        customer.id === id
          ? {
              ...customer,
              name: payload.name.trim(),
              contact: payload.contact?.trim(),
              note: payload.note?.trim(),
              updatedAt: now
            }
          : customer
      )
    );
  }

  async softDeleteCustomer(id: string) {
    this.softDeleteCalls += 1;
    this.lastSoftDeletedId = id;
    this.customersSignal.update((customers) => customers.filter((customer) => customer.id !== id));
  }
}

class MockSettingsService {
  private readonly settingsSignal = signal<Record<string, unknown>>({
    defaultPriceMode: 'FIXED',
    defaultProfitMarginPercent: 0,
    defaultModelingCostEur: 0,
    defaultExtraWorkFeePercent: 0
  });

  settings = this.settingsSignal.asReadonly();
  refreshCalls = 0;
  setSettingCalls: Array<{ key: string; value: unknown }> = [];

  async refresh() {
    this.refreshCalls += 1;
  }

  async setSetting(key: string, value: unknown) {
    this.setSettingCalls.push({ key, value });
    this.settingsSignal.update((s) => ({ ...s, [key]: value }));
  }

  setSettingsData(data: Record<string, unknown>) {
    this.settingsSignal.set(data);
  }
}

class MockBackupService {
  exportCalls = 0;
  importCalls = 0;
  clearCalls = 0;
  validateResult: BackupFormat | null = null;
  shouldExportFail = false;
  shouldImportFail = false;
  shouldClearFail = false;

  async exportBackup() {
    this.exportCalls += 1;
    if (this.shouldExportFail) {
      throw new Error('Export error');
    }
  }

  validateBackup(payload: unknown): BackupFormat {
    if (this.validateResult) {
      return this.validateResult;
    }
    throw new Error('Invalid backup');
  }

  async importBackup(_backup: BackupFormat) {
    this.importCalls += 1;
    if (this.shouldImportFail) {
      throw new Error('Import error');
    }
  }

  async clearAllData() {
    this.clearCalls += 1;
    if (this.shouldClearFail) {
      throw new Error('Clear error');
    }
  }
}

const mockFilamentService = { refresh: vi.fn().mockResolvedValue(undefined) };
const mockCalculationService = { refresh: vi.fn().mockResolvedValue(undefined), refreshTemplates: vi.fn().mockResolvedValue(undefined) };
const mockPartService = { refresh: vi.fn().mockResolvedValue(undefined) };

function makeValidBackup(): BackupFormat {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    printers: [], filaments: [], calculations: [],
    sales: [], customers: [], templates: [], parts: [], settings: []
  };
}

async function createComponent(options?: {
  printerMock?: MockPrinterService;
  customerMock?: MockCustomerService;
  settingsMock?: MockSettingsService;
  backupMock?: MockBackupService;
}) {
  const printerMock = options?.printerMock ?? new MockPrinterService();
  const customerMock = options?.customerMock ?? new MockCustomerService();
  const settingsMock = options?.settingsMock ?? new MockSettingsService();
  const backupMock = options?.backupMock ?? new MockBackupService();

  await TestBed.configureTestingModule({
    imports: [MoreComponent],
    providers: [
      { provide: PrinterService, useValue: printerMock },
      { provide: CustomerService, useValue: customerMock },
      { provide: SettingsService, useValue: settingsMock },
      { provide: BackupService, useValue: backupMock },
      { provide: FilamentService, useValue: mockFilamentService },
      { provide: CalculationService, useValue: mockCalculationService },
      { provide: PartService, useValue: mockPartService }
    ]
  }).compileComponents();

  const fixture = TestBed.createComponent(MoreComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return { fixture, printerMock, customerMock, settingsMock, backupMock, root: fixture.nativeElement as HTMLElement };
}

describe('MoreComponent', () => {
  // --- Existing printer tests ---

  it('renders Drucker verwalten section with active printers list', async () => {
    const { root, printerMock } = await createComponent();
    expect(root.textContent).toContain('Drucker verwalten');
    expect(printerMock.refreshCalls).toBeGreaterThan(0);
  });

  it('shows inline German validation and blocks invalid submit', async () => {
    const { fixture, root } = await createComponent();
    (root.querySelector('[data-testid="open-printer-dialog"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const submitButton = root.querySelector('[data-testid="save-printer"]') as HTMLButtonElement;
    submitButton.click();
    fixture.detectChanges();

    expect(root.textContent).toContain('Bitte Name eingeben');
    expect(root.textContent).toContain('Leistung muss größer als 0 sein');
  });

  it('creates printer on valid submit and updates visible list', async () => {
    const { fixture, root, printerMock } = await createComponent();
    (root.querySelector('[data-testid="open-printer-dialog"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (root.querySelector('[data-testid="name"]') as HTMLInputElement).value = 'Prusa MK4';
    (root.querySelector('[data-testid="name"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="powerWatts"]') as HTMLInputElement).value = '350';
    (root.querySelector('[data-testid="powerWatts"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="purchasePriceEur"]') as HTMLInputElement).value = '1000';
    (root.querySelector('[data-testid="purchasePriceEur"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="lifetimeHours"]') as HTMLInputElement).value = '10000';
    (root.querySelector('[data-testid="lifetimeHours"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="electricityPriceEurKwh"]') as HTMLInputElement).value = '0.35';
    (root.querySelector('[data-testid="electricityPriceEurKwh"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="annualBaseFeeEur"]') as HTMLInputElement).value = '0';
    (root.querySelector('[data-testid="annualBaseFeeEur"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (root.querySelector('[data-testid="save-printer"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(printerMock.createCalls).toBe(1);
    expect(root.textContent).toContain('Prusa MK4');
  });

  it('soft deletes an active printer directly without confirmation and removes it from list', async () => {
    const printerMock = new MockPrinterService();
    await printerMock.createPrinter({});
    const { fixture, root } = await createComponent({ printerMock });

    (root.querySelector('[data-testid="delete-printer"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(printerMock.softDeleteCalls).toBe(1);
    expect(root.textContent).toContain('Noch kein aktives Druckerprofil vorhanden.');
  });

  // --- Existing customer tests ---

  it('renders Kunden list rows with initials and contact or note preview', async () => {
    const customerMock = new MockCustomerService();
    await customerMock.createCustomer({ name: 'Anna Käuferin', contact: 'anna@example.com' });
    await customerMock.createCustomer({ name: 'Ben', note: 'Messekontakt' });
    const { root } = await createComponent({ customerMock });

    expect(root.textContent).toContain('Kunden');
    expect(root.textContent).toContain('AK');
    expect(root.textContent).toContain('Anna Käuferin');
    expect(root.textContent).toContain('anna@example.com');
    expect(root.textContent).toContain('B');
    expect(root.textContent).toContain('Messekontakt');
  });

  it('shows German inline validation for invalid customer submit', async () => {
    const { fixture, root } = await createComponent();
    (root.querySelector('[data-testid="open-customer-dialog"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (root.querySelector('#customerContact') as HTMLInputElement).value = 'A'.repeat(161);
    (root.querySelector('#customerContact') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="save-customer"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(root.textContent).toContain('Bitte Namen eingeben');
    expect(root.textContent).toContain('Kontakt ist zu lang');
  });

  it('soft deletes a customer directly without confirmation and removes it from list', async () => {
    const customerMock = new MockCustomerService();
    await customerMock.createCustomer({ name: 'Anna Käuferin', contact: 'anna@example.com' });
    const { fixture, root } = await createComponent({ customerMock });

    (root.querySelector('[data-testid="delete-customer"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(customerMock.softDeleteCalls).toBe(1);
    expect(root.textContent).toContain('Noch kein aktiver Kunde vorhanden.');
  });

  // --- Settings form tests (5.1) ---

  it('renders Kalkulations-Standards section with all 4 form fields', async () => {
    const { root } = await createComponent();
    expect(root.querySelector('[data-testid="settings-form"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="defaultPriceMode"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="defaultProfitMarginPercent"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="defaultModelingCostEur"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="defaultExtraWorkFeePercent"]')).toBeTruthy();
  });

  it('populates settings form from SettingsService signal on load', async () => {
    const settingsMock = new MockSettingsService();
    settingsMock.setSettingsData({
      defaultPriceMode: 'PAID',
      defaultProfitMarginPercent: 15,
      defaultModelingCostEur: 5,
      defaultExtraWorkFeePercent: 10
    });
    const { root } = await createComponent({ settingsMock });

    const profitInput = root.querySelector('[data-testid="defaultProfitMarginPercent"]') as HTMLInputElement;
    expect(Number(profitInput.value)).toBe(15);
    const priceModeSelect = root.querySelector('[data-testid="defaultPriceMode"]') as HTMLSelectElement;
    expect(priceModeSelect.value).toBe('PAID');
  });

  it('calls setSetting for each field on valid settings save', async () => {
    const settingsMock = new MockSettingsService();
    const { fixture, root } = await createComponent({ settingsMock });

    const profitInput = root.querySelector('[data-testid="defaultProfitMarginPercent"]') as HTMLInputElement;
    profitInput.value = '20';
    profitInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (root.querySelector('[data-testid="save-settings"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    const savedKeys = settingsMock.setSettingCalls.map((c) => c.key);
    expect(savedKeys).toContain('defaultPriceMode');
    expect(savedKeys).toContain('defaultProfitMarginPercent');
    expect(savedKeys).toContain('defaultModelingCostEur');
    expect(savedKeys).toContain('defaultExtraWorkFeePercent');
  });

  it('shows German validation error when profit margin exceeds 500', async () => {
    const { fixture, root } = await createComponent();

    const profitInput = root.querySelector('[data-testid="defaultProfitMarginPercent"]') as HTMLInputElement;
    profitInput.value = '600';
    profitInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.componentInstance.settingsForm.markAllAsTouched();
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="settings-error-margin"]')?.textContent).toContain('500');
  });

  it('shows German validation error when modeling cost exceeds 9999', async () => {
    const { fixture, root } = await createComponent();

    const costInput = root.querySelector('[data-testid="defaultModelingCostEur"]') as HTMLInputElement;
    costInput.value = '10000';
    costInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.componentInstance.settingsForm.markAllAsTouched();
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="settings-error-modeling"]')?.textContent).toContain('9.999');
  });

  it('shows success feedback after saving settings', async () => {
    const { fixture, root } = await createComponent();

    (root.querySelector('[data-testid="save-settings"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="settings-save-success"]')).toBeTruthy();
  });

  it('disables save button while settings form is invalid', async () => {
    const { fixture, root } = await createComponent();

    const feeInput = root.querySelector('[data-testid="defaultExtraWorkFeePercent"]') as HTMLInputElement;
    feeInput.value = '300';
    feeInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const saveBtn = root.querySelector('[data-testid="save-settings"]') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  // --- Export tests (5.2) ---

  it('calls exportBackup on export button click', async () => {
    const backupMock = new MockBackupService();
    const { fixture, root } = await createComponent({ backupMock });

    (root.querySelector('[data-testid="export-backup"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(backupMock.exportCalls).toBe(1);
  });

  it('shows German success message after export', async () => {
    const backupMock = new MockBackupService();
    const { fixture, root } = await createComponent({ backupMock });

    (root.querySelector('[data-testid="export-backup"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="export-success"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="export-success"]')?.textContent).toContain('erfolgreich');
  });

  it('shows German error message when export fails', async () => {
    const backupMock = new MockBackupService();
    backupMock.shouldExportFail = true;
    const { fixture, root } = await createComponent({ backupMock });

    (root.querySelector('[data-testid="export-backup"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="export-error"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="export-error"]')?.textContent).toContain('fehlgeschlagen');
  });

  it('disables export button while exporting', async () => {
    const backupMock = new MockBackupService();
    let resolveExport!: () => void;
    backupMock.exportBackup = () => new Promise<void>((resolve) => { resolveExport = resolve; });

    const { fixture, root } = await createComponent({ backupMock });

    (root.querySelector('[data-testid="export-backup"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect((root.querySelector('[data-testid="export-backup"]') as HTMLButtonElement).disabled).toBe(true);
    resolveExport();
    await fixture.whenStable();
  });

  // --- Import tests (5.3) ---

  it('shows import confirmation dialog when file is valid', async () => {
    const backupMock = new MockBackupService();
    backupMock.validateResult = makeValidBackup();
    const { fixture, root } = await createComponent({ backupMock });
    const component = fixture.componentInstance;

    const mockFile = new File([JSON.stringify(makeValidBackup())], 'backup.json', { type: 'application/json' });
    const event = { target: { files: [mockFile], value: '' } } as unknown as Event;

    await component.onImportFileChange(event);
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="confirm-import"]')).toBeTruthy();
  });

  it('shows German error and no dialog when JSON is invalid', async () => {
    const backupMock = new MockBackupService();
    const { fixture, root } = await createComponent({ backupMock });
    const component = fixture.componentInstance;

    const mockFile = new File(['not valid json!!!'], 'backup.json', { type: 'application/json' });
    const event = { target: { files: [mockFile], value: '' } } as unknown as Event;

    await component.onImportFileChange(event);
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="import-error"]')?.textContent).toContain('Ungültige JSON');
    expect(root.querySelector('[data-testid="confirm-import"]')).toBeNull();
  });

  it('shows German error and no dialog when backup validation fails', async () => {
    const backupMock = new MockBackupService();
    // validateResult stays null, so validateBackup() throws
    const { fixture, root } = await createComponent({ backupMock });
    const component = fixture.componentInstance;

    const mockFile = new File([JSON.stringify({ version: 99 })], 'backup.json', { type: 'application/json' });
    const event = { target: { files: [mockFile], value: '' } } as unknown as Event;

    await component.onImportFileChange(event);
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="import-error"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="confirm-import"]')).toBeNull();
  });

  it('cancel on import dialog prevents importBackup call', async () => {
    const backupMock = new MockBackupService();
    backupMock.validateResult = makeValidBackup();
    const { fixture, root } = await createComponent({ backupMock });
    const component = fixture.componentInstance;

    const mockFile = new File([JSON.stringify(makeValidBackup())], 'backup.json', { type: 'application/json' });
    await component.onImportFileChange({ target: { files: [mockFile], value: '' } } as unknown as Event);
    fixture.detectChanges();

    (root.querySelector('[data-testid="cancel-import"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(backupMock.importCalls).toBe(0);
    expect(root.querySelector('[data-testid="confirm-import"]')).toBeNull();
  });

  it('confirm on import dialog calls importBackup and shows success', async () => {
    const backupMock = new MockBackupService();
    backupMock.validateResult = makeValidBackup();
    const { fixture, root } = await createComponent({ backupMock });
    const component = fixture.componentInstance;

    const mockFile = new File([JSON.stringify(makeValidBackup())], 'backup.json', { type: 'application/json' });
    await component.onImportFileChange({ target: { files: [mockFile], value: '' } } as unknown as Event);
    fixture.detectChanges();

    (root.querySelector('[data-testid="confirm-import"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(backupMock.importCalls).toBe(1);
    expect(root.querySelector('[data-testid="import-success"]')).toBeTruthy();
  });

  it('confirm import calls refresh on all services', async () => {
    vi.clearAllMocks();
    const backupMock = new MockBackupService();
    backupMock.validateResult = makeValidBackup();
    const printerMock = new MockPrinterService();
    const customerMock = new MockCustomerService();
    const settingsMock = new MockSettingsService();
    const { fixture, root } = await createComponent({ backupMock, printerMock, customerMock, settingsMock });
    const component = fixture.componentInstance;

    const mockFile = new File([JSON.stringify(makeValidBackup())], 'backup.json', { type: 'application/json' });
    await component.onImportFileChange({ target: { files: [mockFile], value: '' } } as unknown as Event);
    fixture.detectChanges();

    printerMock.refreshCalls = 0;
    customerMock.refreshCalls = 0;
    settingsMock.refreshCalls = 0;

    (root.querySelector('[data-testid="confirm-import"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(printerMock.refreshCalls).toBeGreaterThan(0);
    expect(customerMock.refreshCalls).toBeGreaterThan(0);
    expect(settingsMock.refreshCalls).toBeGreaterThan(0);
    expect(mockFilamentService.refresh).toHaveBeenCalled();
    expect(mockCalculationService.refresh).toHaveBeenCalled();
    expect(mockPartService.refresh).toHaveBeenCalled();
  });

  // --- Delete all data tests (5.4) ---

  it('renders delete all data button', async () => {
    const { root } = await createComponent();
    expect(root.querySelector('[data-testid="delete-all-data"]')).toBeTruthy();
  });

  it('opens delete confirmation dialog when delete button clicked', async () => {
    const { fixture, root } = await createComponent();

    (root.querySelector('[data-testid="delete-all-data"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="confirm-delete"]')).toBeTruthy();
  });

  it('cancel on delete dialog prevents clearAllData call', async () => {
    const backupMock = new MockBackupService();
    const { fixture, root } = await createComponent({ backupMock });

    (root.querySelector('[data-testid="delete-all-data"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    (root.querySelector('[data-testid="cancel-delete"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(backupMock.clearCalls).toBe(0);
    expect(root.querySelector('[data-testid="confirm-delete"]')).toBeNull();
  });

  it('confirm delete calls clearAllData and shows German success message', async () => {
    const backupMock = new MockBackupService();
    const { fixture, root } = await createComponent({ backupMock });

    (root.querySelector('[data-testid="delete-all-data"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    (root.querySelector('[data-testid="confirm-delete"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(backupMock.clearCalls).toBe(1);
    expect(root.querySelector('[data-testid="delete-success"]')?.textContent).toContain('gelöscht');
  });

  it('shows German error when clearAllData fails', async () => {
    const backupMock = new MockBackupService();
    backupMock.shouldClearFail = true;
    const { fixture, root } = await createComponent({ backupMock });

    (root.querySelector('[data-testid="delete-all-data"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    (root.querySelector('[data-testid="confirm-delete"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="delete-error"]')?.textContent).toContain('fehlgeschlagen');
  });

  it('confirm delete calls refresh on all services', async () => {
    vi.clearAllMocks();
    const backupMock = new MockBackupService();
    const printerMock = new MockPrinterService();
    const customerMock = new MockCustomerService();
    const settingsMock = new MockSettingsService();
    const { fixture, root } = await createComponent({ backupMock, printerMock, customerMock, settingsMock });

    printerMock.refreshCalls = 0;
    customerMock.refreshCalls = 0;
    settingsMock.refreshCalls = 0;

    (root.querySelector('[data-testid="delete-all-data"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    (root.querySelector('[data-testid="confirm-delete"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(printerMock.refreshCalls).toBeGreaterThan(0);
    expect(customerMock.refreshCalls).toBeGreaterThan(0);
    expect(settingsMock.refreshCalls).toBeGreaterThan(0);
  });

  // --- Story 5.5 polish tests ---

  it('renders local-only data info text in System section', async () => {
    const { root } = await createComponent();
    expect(root.textContent).toContain('ausschließlich lokal');
    expect(root.textContent).toContain('keine Cloud-Synchronisierung');
  });

  it('renders backup reminder text in data section', async () => {
    const { root } = await createComponent();
    expect(root.textContent).toContain('Exportiere regelmäßig');
  });

  it('renders Verwaltung and System group headings', async () => {
    const { root } = await createComponent();
    expect(root.textContent).toContain('Verwaltung');
    expect(root.textContent).toContain('System');
  });

  it('has no CSV export button, merge import, sign-in, or language switcher', async () => {
    const { root } = await createComponent();
    expect(root.innerHTML).not.toContain('csv');
    expect(root.innerHTML).not.toContain('CSV');
    expect(root.innerHTML).not.toContain('sign-in');
    expect(root.innerHTML).not.toContain('anmelden');
    expect(root.innerHTML).not.toContain('sprache');
  });
});
