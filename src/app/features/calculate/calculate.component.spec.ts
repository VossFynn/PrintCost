import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';

import { FilamentService } from '../../core/filaments/filament.service';
import {
  CalculationService,
  CalculationTemplateInput,
  SaveCalculationTemplatePayload
} from '../../core/calculations/calculation.service';
import { CustomerService } from '../../core/customers/customer.service';
import { PrinterService } from '../../core/printers/printer.service';
import { SettingsService } from '../../core/settings/settings.service';
import { CustomerRecord, FilamentRecord, PrinterRecord, TemplateRecord } from '../../domain/models/storage.models';
import { CalculateComponent } from './calculate.component';

const LAST_USED_PRINTER_SETTING_KEY = 'lastUsedPrinterProfileId';

class MockPrinterService {
  private readonly printersSignal = signal<PrinterRecord[]>([]);

  activePrinters = computed(() => this.printersSignal().filter((printer) => !printer.deleted));
  refreshCalls = 0;

  constructor(initialPrinters: PrinterRecord[] = []) {
    this.printersSignal.set(initialPrinters);
  }

  async refresh() {
    this.refreshCalls += 1;
  }
}

class MockSettingsService {
  private readonly settingsSignal = signal<Record<string, unknown>>({});

  settings = this.settingsSignal.asReadonly();
  refreshCalls = 0;
  setCalls: Array<{ key: string; value: unknown }> = [];

  constructor(initialSettings: Record<string, unknown> = {}) {
    this.settingsSignal.set(initialSettings);
  }

  async refresh() {
    this.refreshCalls += 1;
  }

  async setSetting(key: string, value: unknown) {
    this.setCalls.push({ key, value });
    this.settingsSignal.update((current) => ({ ...current, [key]: value }));
  }
}

class MockFilamentService {
  private readonly filamentsSignal = signal<FilamentRecord[]>([]);

  activeFilaments = computed(() => this.filamentsSignal().filter((filament) => !filament.deleted));
  refreshCalls = 0;

  constructor(initialFilaments: FilamentRecord[] = []) {
    this.filamentsSignal.set(initialFilaments);
  }

  async refresh() {
    this.refreshCalls += 1;
  }

  pricePerGramForMode(filament: FilamentRecord, mode: 'WEIGHTED_AVERAGE' | 'PAID' | 'FIXED'): number {
    if (mode === 'FIXED') {
      return filament.fixedPriceEurG ?? 0;
    }

    const purchases = filament.purchases ?? [];
    if (purchases.length === 0) {
      return 0;
    }

    if (mode === 'PAID') {
      return purchases[purchases.length - 1]!.priceEur / 1000;
    }

    const totalKg = purchases.reduce((sum, purchase) => sum + purchase.quantityKg, 0);
    const weightedSum = purchases.reduce((sum, purchase) => sum + purchase.priceEur * purchase.quantityKg, 0);
    return totalKg <= 0 ? 0 : weightedSum / totalKg / 1000;
  }
}

class MockCustomerService {
  private readonly customersSignal = signal<CustomerRecord[]>([]);
  activeCustomers = computed(() => this.customersSignal().filter((customer) => !customer.deleted));
  refreshCalls = 0;

  constructor(initialCustomers: CustomerRecord[] = []) {
    this.customersSignal.set(initialCustomers);
  }

  async refresh() {
    this.refreshCalls += 1;
  }
}

class MockCalculationService {
  saveCalls: unknown[] = [];
  saveTemplateCalls: SaveCalculationTemplatePayload[] = [];
  private readonly templatesSignal = signal<TemplateRecord[]>([]);
  templates = this.templatesSignal.asReadonly();

  constructor(initialTemplates: TemplateRecord[] = []) {
    this.templatesSignal.set(initialTemplates);
  }

  async refreshTemplates() {}
  async savePlannedCalculation(payload: unknown) {
    this.saveCalls.push(payload);
    return {
      id: 'calculation-1',
      timesPrinted: 0
    };
  }

  async saveTemplate(payload: SaveCalculationTemplatePayload): Promise<TemplateRecord> {
    this.saveTemplateCalls.push(clone(payload));
    const now = '2026-06-23T00:00:00.000Z';
    const record: TemplateRecord = {
      id: `template-${this.templatesSignal().length + 1}`,
      templateName: payload.templateName,
      templateInput: clone(payload.templateInput),
      createdAt: now,
      updatedAt: now
    };
    this.templatesSignal.update((current) => [record, ...current]);
    return clone(record);
  }

  async loadTemplate(templateId: string): Promise<TemplateRecord | undefined> {
    const found = this.templatesSignal().find((entry) => entry.id === templateId);
    return found ? clone(found) : undefined;
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createTemplateRecord(id: string, input: CalculationTemplateInput): TemplateRecord {
  return {
    id,
    templateName: 'Vorlage',
    templateInput: clone(input),
    createdAt: '2026-06-23T00:00:00.000Z',
    updatedAt: '2026-06-23T00:00:00.000Z'
  };
}

function createActivePrinter(id: string, name: string): PrinterRecord {
  return {
    id,
    name,
    powerWatts: 350,
    purchasePriceEur: 1000,
    lifetimeHours: 10000,
    electricityPriceEurKwh: 0.35,
    annualBaseFeeEur: 0,
    deleted: false,
    createdAt: '2026-06-23T00:00:00.000Z',
    updatedAt: '2026-06-23T00:00:00.000Z'
  };
}

function createActiveFilament(id: string, name: string): FilamentRecord {
  return {
    id,
    name,
    type: 'PLA',
    colorHex: '#ffffff',
    manufacturer: 'Prusa',
    rollWeightG: 1000,
    remainingG: 700,
    purchases: [{ priceEur: 22, quantityKg: 1, purchasedAt: '2026-06-20' }],
    multiColorSurchargeEurKg: 0,
    fixedPriceEurG: 0.03,
    deleted: false,
    createdAt: '2026-06-23T00:00:00.000Z',
    updatedAt: '2026-06-23T00:00:00.000Z'
  };
}

function createActiveCustomer(id: string, name: string): CustomerRecord {
  return {
    id,
    name,
    contact: `${id}@example.com`,
    note: undefined,
    deleted: false,
    createdAt: '2026-06-23T00:00:00.000Z',
    updatedAt: '2026-06-23T00:00:00.000Z'
  };
}

describe('CalculateComponent', () => {
  async function setupComponent(options?: {
    printers?: PrinterRecord[];
    filaments?: FilamentRecord[];
    customers?: CustomerRecord[];
    settings?: Record<string, unknown>;
    templates?: TemplateRecord[];
  }) {
    const printerService = new MockPrinterService(options?.printers ?? [createActivePrinter('printer-1', 'Prusa MK4')]);
    const settingsService = new MockSettingsService(options?.settings);
    const filamentService = new MockFilamentService(options?.filaments ?? [createActiveFilament('filament-1', 'PLA White')]);
    const customerService = new MockCustomerService(options?.customers ?? []);
    const calculationService = new MockCalculationService(options?.templates);

    await TestBed.configureTestingModule({
      imports: [CalculateComponent],
      providers: [
        { provide: PrinterService, useValue: printerService },
        { provide: SettingsService, useValue: settingsService },
        { provide: FilamentService, useValue: filamentService },
        { provide: CustomerService, useValue: customerService },
        { provide: CalculationService, useValue: calculationService }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CalculateComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return { fixture, root: fixture.nativeElement as HTMLElement, calculationService, customerService };
  }

  it('renders Projekt, Filament, Druck sections in order', async () => {
    const printerService = new MockPrinterService([createActivePrinter('printer-1', 'Prusa MK4')]);
    const settingsService = new MockSettingsService();
    const filamentService = new MockFilamentService([createActiveFilament('filament-1', 'PLA White')]);

    await TestBed.configureTestingModule({
      imports: [CalculateComponent],
      providers: [
        { provide: PrinterService, useValue: printerService },
        { provide: SettingsService, useValue: settingsService },
        { provide: FilamentService, useValue: filamentService },
        { provide: CustomerService, useValue: new MockCustomerService() },
        { provide: CalculationService, useValue: new MockCalculationService() }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CalculateComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const sectionTitles = Array.from(root.querySelectorAll('[data-testid="calculate-section-title"]')).map((node) =>
      node.textContent?.trim()
    );
    expect(sectionTitles).toEqual(['Projekt', 'Filament', 'Druck']);
  });

  it('shows active printer options only and preselects last used active printer', async () => {
    const printerService = new MockPrinterService([
      createActivePrinter('printer-1', 'Prusa MK4'),
      { ...createActivePrinter('printer-2', 'Bambu X1'), deleted: true },
      createActivePrinter('printer-3', 'Voron 2.4')
    ]);
    const settingsService = new MockSettingsService({
      [LAST_USED_PRINTER_SETTING_KEY]: 'printer-3'
    });
    const filamentService = new MockFilamentService([createActiveFilament('filament-1', 'PLA White')]);

    await TestBed.configureTestingModule({
      imports: [CalculateComponent],
      providers: [
        { provide: PrinterService, useValue: printerService },
        { provide: SettingsService, useValue: settingsService },
        { provide: FilamentService, useValue: filamentService },
        { provide: CustomerService, useValue: new MockCustomerService() },
        { provide: CalculationService, useValue: new MockCalculationService() }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CalculateComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const options = Array.from(root.querySelectorAll('[data-testid="printer-option"]')).map((option) =>
      option.textContent?.trim()
    );
    const printerSelect = root.querySelector('[data-testid="printer-select"]') as HTMLSelectElement;

    expect(options).toEqual(['Prusa MK4', 'Voron 2.4']);
    expect(printerSelect.value).toBe('printer-3');
  });

  it('shows German empty-state CTA and blocks save when no active printer exists', async () => {
    const printerService = new MockPrinterService([]);
    const settingsService = new MockSettingsService();
    const filamentService = new MockFilamentService([createActiveFilament('filament-1', 'PLA White')]);

    await TestBed.configureTestingModule({
      imports: [CalculateComponent],
      providers: [
        { provide: PrinterService, useValue: printerService },
        { provide: SettingsService, useValue: settingsService },
        { provide: FilamentService, useValue: filamentService },
        { provide: CustomerService, useValue: new MockCustomerService() },
        { provide: CalculationService, useValue: new MockCalculationService() }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CalculateComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const saveButton = root.querySelector('[data-testid="save-calculation"]') as HTMLButtonElement;
    expect(root.querySelector('[data-testid="printer-select"]')).toBeNull();
    expect(root.textContent).toContain('Noch kein aktives Druckerprofil vorhanden.');
    expect(root.textContent).toContain('Erst Drucker anlegen');
    expect(saveButton.disabled).toBe(true);
  });

  it('shows active customers in selector and keeps no-customer option valid', async () => {
    const { root } = await setupComponent({
      customers: [
        createActiveCustomer('customer-1', 'Anna Käuferin'),
        { ...createActiveCustomer('customer-2', 'Ben Muster'), deleted: true },
        createActiveCustomer('customer-3', 'Clara König')
      ]
    });

    const customerSelect = root.querySelector('[data-testid="customer-select"]') as HTMLSelectElement;
    const optionLabels = Array.from(customerSelect.options).map((option) => option.textContent?.trim());
    const optionValues = Array.from(customerSelect.options).map((option) => option.value);

    expect(optionLabels).toEqual(['Kein Kunde (privat)', 'Anna Käuferin', 'Clara König']);
    expect(optionValues).toEqual(['', 'customer-1', 'customer-3']);
    expect(customerSelect.value).toBe('');
  });

  it('creates and removes one grams row per selected filament chip', async () => {
    const printerService = new MockPrinterService([createActivePrinter('printer-1', 'Prusa MK4')]);
    const settingsService = new MockSettingsService();
    const filamentService = new MockFilamentService([
      createActiveFilament('filament-1', 'PLA White'),
      createActiveFilament('filament-2', 'PETG Black')
    ]);

    await TestBed.configureTestingModule({
      imports: [CalculateComponent],
      providers: [
        { provide: PrinterService, useValue: printerService },
        { provide: SettingsService, useValue: settingsService },
        { provide: FilamentService, useValue: filamentService },
        { provide: CustomerService, useValue: new MockCustomerService() },
        { provide: CalculationService, useValue: new MockCalculationService() }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CalculateComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const chips = Array.from(root.querySelectorAll('[data-testid="filament-chip"]')) as HTMLButtonElement[];
    expect(chips.map((chip) => chip.textContent?.trim())).toEqual(['PLA White', 'PETG Black']);
    expect(root.querySelectorAll('[data-testid="filament-line"]').length).toBe(0);

    chips[0].click();
    fixture.detectChanges();
    expect(root.querySelectorAll('[data-testid="filament-line"]').length).toBe(1);
    expect(root.textContent).toContain('PLA White');

    const priceMode = root.querySelector('[data-testid="filament-price-mode"]') as HTMLSelectElement;
    const labels = Array.from(priceMode.options).map((option) => ({ value: option.value, label: option.textContent?.trim() }));
    expect(labels).toEqual([
      { value: 'WEIGHTED_AVERAGE', label: 'Ø Schnitt' },
      { value: 'PAID', label: 'Bezahlt' },
      { value: 'FIXED', label: 'Fester Preis' }
    ]);

    chips[0].click();
    fixture.detectChanges();
    expect(root.querySelectorAll('[data-testid="filament-line"]').length).toBe(0);
  });

  it('shows no-filament blocker with Filament hinzufügen CTA and blocks selector controls', async () => {
    const printerService = new MockPrinterService([createActivePrinter('printer-1', 'Prusa MK4')]);
    const settingsService = new MockSettingsService();
    const filamentService = new MockFilamentService([]);

    await TestBed.configureTestingModule({
      imports: [CalculateComponent],
      providers: [
        { provide: PrinterService, useValue: printerService },
        { provide: SettingsService, useValue: settingsService },
        { provide: FilamentService, useValue: filamentService },
        { provide: CustomerService, useValue: new MockCustomerService() },
        { provide: CalculationService, useValue: new MockCalculationService() }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CalculateComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="filament-chip"]')).toBeNull();
    expect(root.textContent).toContain('Noch kein aktives Filament vorhanden.');
    expect(root.textContent).toContain('Filament hinzufügen');
    expect(root.querySelector('[data-testid="filament-empty"] a')?.getAttribute('href')).toBe('/filaments');
  });

  it('shows fixed-mode inline validation and keeps save disabled until fixed value is valid', async () => {
    const printerService = new MockPrinterService([createActivePrinter('printer-1', 'Prusa MK4')]);
    const settingsService = new MockSettingsService();
    const filamentService = new MockFilamentService([createActiveFilament('filament-1', 'PLA White')]);

    await TestBed.configureTestingModule({
      imports: [CalculateComponent],
      providers: [
        { provide: PrinterService, useValue: printerService },
        { provide: SettingsService, useValue: settingsService },
        { provide: FilamentService, useValue: filamentService },
        { provide: CustomerService, useValue: new MockCustomerService() },
        { provide: CalculationService, useValue: new MockCalculationService() }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CalculateComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const saveButton = root.querySelector('[data-testid="save-calculation"]') as HTMLButtonElement;

    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).value = 'Halterung';
    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).value = '2.5';
    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).dispatchEvent(new Event('input'));

    (root.querySelector('[data-testid="filament-chip"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    (root.querySelector('[data-testid="filament-grams"]') as HTMLInputElement).value = '12';
    (root.querySelector('[data-testid="filament-grams"]') as HTMLInputElement).dispatchEvent(new Event('input'));

    const priceMode = root.querySelector('[data-testid="filament-price-mode"]') as HTMLSelectElement;
    priceMode.value = 'FIXED';
    priceMode.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    (root.querySelector('[data-testid="filament-fixed-price"]') as HTMLInputElement).value = '0';
    (root.querySelector('[data-testid="filament-fixed-price"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="filament-fixed-price"]') as HTMLInputElement).dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(root.textContent).toContain('Bitte gültigen Fixpreis eingeben');
    expect(saveButton.disabled).toBe(true);

    (root.querySelector('[data-testid="filament-fixed-price"]') as HTMLInputElement).value = '0.05';
    (root.querySelector('[data-testid="filament-fixed-price"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(root.textContent).not.toContain('Bitte gültigen Fixpreis eingeben');
    expect(saveButton.disabled).toBe(false);
  });

  it('updates total grams live and exposes non-color valid/invalid cues', async () => {
    const printerService = new MockPrinterService([createActivePrinter('printer-1', 'Prusa MK4')]);
    const settingsService = new MockSettingsService();
    const filamentService = new MockFilamentService([
      createActiveFilament('filament-1', 'PLA White'),
      createActiveFilament('filament-2', 'PETG Black')
    ]);

    await TestBed.configureTestingModule({
      imports: [CalculateComponent],
      providers: [
        { provide: PrinterService, useValue: printerService },
        { provide: SettingsService, useValue: settingsService },
        { provide: FilamentService, useValue: filamentService },
        { provide: CustomerService, useValue: new MockCustomerService() },
        { provide: CalculationService, useValue: new MockCalculationService() }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CalculateComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const chips = Array.from(root.querySelectorAll('[data-testid="filament-chip"]')) as HTMLButtonElement[];
    chips[0].click();
    chips[1].click();
    fixture.detectChanges();

    const gramInputs = Array.from(root.querySelectorAll('[data-testid="filament-grams"]')) as HTMLInputElement[];
    gramInputs[0].value = '10';
    gramInputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(root.querySelector('[data-testid="total-grams"]')?.textContent).toContain('10 g');
    expect(root.querySelector('[data-testid="total-grams-state"]')?.textContent).toContain('⚠');

    gramInputs[1].value = '20';
    gramInputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(root.querySelector('[data-testid="total-grams"]')?.textContent).toContain('30 g');
    expect(root.querySelector('[data-testid="total-grams-state"]')?.textContent).toContain('✓');

    gramInputs[1].value = '0';
    gramInputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(root.querySelector('[data-testid="total-grams-state"]')?.textContent).toContain('⚠');
  });

  it('keeps the form in a single-column mobile-first shell without horizontal overflow hooks', async () => {
    const printerService = new MockPrinterService([createActivePrinter('printer-1', 'Prusa MK4')]);
    const settingsService = new MockSettingsService();
    const filamentService = new MockFilamentService([createActiveFilament('filament-1', 'PLA White')]);

    await TestBed.configureTestingModule({
      imports: [CalculateComponent],
      providers: [
        { provide: PrinterService, useValue: printerService },
        { provide: SettingsService, useValue: settingsService },
        { provide: FilamentService, useValue: filamentService },
        { provide: CustomerService, useValue: new MockCustomerService() },
        { provide: CalculationService, useValue: new MockCalculationService() }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CalculateComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const shell = root.querySelector('[data-testid="calculate-shell"]');
    expect(shell).not.toBeNull();
    expect(shell?.classList.contains('calculate-shell')).toBe(true);
    expect(shell?.classList.contains('calculate-shell--single-column')).toBe(true);
  });

  it('updates the result card live without a submit step', async () => {
    const { fixture, root } = await setupComponent();

    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).value = 'Halterung';
    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).value = '2';
    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="filament-chip"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (root.querySelector('[data-testid="filament-grams"]') as HTMLInputElement).value = '10';
    (root.querySelector('[data-testid="filament-grams"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const firstPrice = root.querySelector('[data-testid="result-price-value"]')?.textContent?.trim();
    expect(firstPrice).toBeTruthy();

    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).value = '4';
    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const secondPrice = root.querySelector('[data-testid="result-price-value"]')?.textContent?.trim();
    expect(secondPrice).toBeTruthy();
    expect(secondPrice).not.toBe(firstPrice);
  });

  it('renders German result labels and a dominant final Preis display', async () => {
    const { fixture, root } = await setupComponent();

    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).value = 'Halterung';
    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).value = '1';
    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="filament-chip"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (root.querySelector('[data-testid="filament-grams"]') as HTMLInputElement).value = '10';
    (root.querySelector('[data-testid="filament-grams"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const labels = [
      'Materialkosten',
      'Stromkosten',
      'AfA',
      'Modellierung',
      'Mehrplatten-Aufschlag',
      'Zwischensumme',
      'Gewinn',
      'Preis'
    ];
    for (const label of labels) {
      expect(root.textContent).toContain(label);
    }

    const dominantPrice = root.querySelector('[data-testid="result-price-value"]');
    expect(dominantPrice?.classList.contains('calculate-result__price-value--dominant')).toBe(true);
  });

  it('shows plate explanation and extra-work control only when multiple plates are required', async () => {
    const { fixture, root } = await setupComponent();

    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).value = 'Halterung';
    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).value = '1';
    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="filament-chip"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (root.querySelector('[data-testid="filament-grams"]') as HTMLInputElement).value = '10';
    (root.querySelector('[data-testid="filament-grams"]') as HTMLInputElement).dispatchEvent(new Event('input'));

    (root.querySelector('[data-testid="print-quantity"]') as HTMLInputElement).value = '3';
    (root.querySelector('[data-testid="print-quantity"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="parts-per-plate"]') as HTMLInputElement).value = '1';
    (root.querySelector('[data-testid="parts-per-plate"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="plate-explanation"]')?.textContent).toContain('3 Platten werden benötigt');
    expect(root.querySelector('[data-testid="extra-work-fee"]')).not.toBeNull();

    (root.querySelector('[data-testid="print-quantity"]') as HTMLInputElement).value = '1';
    (root.querySelector('[data-testid="print-quantity"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="plate-explanation"]')).toBeNull();
    expect(root.querySelector('[data-testid="extra-work-fee"]')).toBeNull();
  });

  it('debounces live region announcements to avoid screen reader spam', async () => {
    vi.useFakeTimers();
    const { fixture, root } = await setupComponent();

    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).value = 'Halterung';
    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).value = '1';
    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="filament-chip"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (root.querySelector('[data-testid="filament-grams"]') as HTMLInputElement).value = '10';
    (root.querySelector('[data-testid="filament-grams"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const liveRegion = root.querySelector('[data-testid="result-live-announcement"]');
    expect(liveRegion?.textContent?.trim()).toBe('');

    const printHoursInput = root.querySelector('[data-testid="print-hours"]') as HTMLInputElement;
    printHoursInput.value = '2';
    printHoursInput.dispatchEvent(new Event('input'));
    printHoursInput.value = '3';
    printHoursInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(150);
    fixture.detectChanges();
    expect(liveRegion?.textContent?.trim()).toBe('');

    await vi.advanceTimersByTimeAsync(200);
    fixture.detectChanges();
    expect(liveRegion?.textContent).toContain('Preis aktualisiert');
    vi.useRealTimers();
  });

  it('saves planned calculation with German success feedback', async () => {
    const { fixture, root, calculationService } = await setupComponent({
      customers: [createActiveCustomer('customer-1', 'Anna Käuferin')]
    });

    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).value = 'Halterung';
    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).value = '2';
    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="filament-chip"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (root.querySelector('[data-testid="filament-grams"]') as HTMLInputElement).value = '10';
    (root.querySelector('[data-testid="filament-grams"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = root.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(calculationService.saveCalls).toHaveLength(1);
    const savedPayload = calculationService.saveCalls[0] as { customerId?: string };
    expect(savedPayload.customerId).toBeUndefined();
    expect(root.textContent).toContain('Kalkulation gespeichert');
  });

  it('persists selected customer id when saving a calculation', async () => {
    const { fixture, root, calculationService } = await setupComponent({
      customers: [createActiveCustomer('customer-1', 'Anna Käuferin')]
    });

    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).value = 'Halterung';
    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).value = '2';
    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="filament-chip"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (root.querySelector('[data-testid="filament-grams"]') as HTMLInputElement).value = '10';
    (root.querySelector('[data-testid="filament-grams"]') as HTMLInputElement).dispatchEvent(new Event('input'));

    const customerSelect = root.querySelector('[data-testid="customer-select"]') as HTMLSelectElement;
    customerSelect.value = 'customer-1';
    customerSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const form = root.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    const savedPayload = calculationService.saveCalls[0] as { customerId?: string };
    expect(savedPayload.customerId).toBe('customer-1');
  });

  it('shows German template empty prompt and blocks template load when none exist', async () => {
    const { root } = await setupComponent({ templates: [] });

    expect(root.textContent).toContain('Noch keine Vorlage gespeichert.');
    const loadTemplateButton = root.querySelector('[data-testid="load-template"]') as HTMLButtonElement;
    expect(loadTemplateButton.disabled).toBe(true);
  });

  it('saves template name independently from project name and loads editable form data', async () => {
    const { fixture, root, calculationService } = await setupComponent();

    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).value = 'Projekt A';
    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).value = '2';
    (root.querySelector('[data-testid="print-hours"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="filament-chip"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (root.querySelector('[data-testid="filament-grams"]') as HTMLInputElement).value = '14';
    (root.querySelector('[data-testid="filament-grams"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    (root.querySelector('[data-testid="template-name"]') as HTMLInputElement).value = 'Standard PLA';
    (root.querySelector('[data-testid="template-name"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (root.querySelector('[data-testid="save-template"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(calculationService.saveTemplateCalls).toHaveLength(1);
    expect(calculationService.saveTemplateCalls[0]?.templateName).toBe('Standard PLA');
    expect(calculationService.saveTemplateCalls[0]?.templateInput.projectName).toBe('Projekt A');

    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).value = 'Zwischenstand';
    (root.querySelector('[data-testid="project-name"]') as HTMLInputElement).dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (root.querySelector('[data-testid="load-template"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    const projectNameInput = root.querySelector('[data-testid="project-name"]') as HTMLInputElement;
    expect(projectNameInput.value).toBe('Projekt A');

    projectNameInput.value = 'Neuer Name';
    projectNameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(projectNameInput.value).toBe('Neuer Name');
  });

  it('shows German reselection guidance when template references unavailable records and keeps save blocked', async () => {
    const missingTemplate = createTemplateRecord('template-1', {
      projectName: 'Projekt',
      printerId: 'printer-missing',
      printHours: 2,
      printQuantity: 1,
      partsPerPlate: 1,
      modelExists: true,
      modelingCostEur: 0,
      extraWorkFeePercent: 0,
      profitMarginPercent: 10,
      filamentLines: [
        {
          filamentId: 'filament-missing',
          grams: 20,
          priceMode: 'WEIGHTED_AVERAGE',
          fixedPriceEurG: 0
        }
      ]
    });

    const { fixture, root } = await setupComponent({
      templates: [missingTemplate]
    });

    (root.querySelector('[data-testid="load-template"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.textContent).toContain('Gespeicherter Drucker ist nicht verfügbar. Bitte neu auswählen.');
    expect(root.textContent).toContain('Gespeicherte Filamente sind nicht verfügbar. Bitte Filamente neu auswählen.');
    expect((root.querySelector('[data-testid="save-calculation"]') as HTMLButtonElement).disabled).toBe(true);
  });
});
