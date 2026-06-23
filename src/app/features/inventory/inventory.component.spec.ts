import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { vi } from 'vitest';

import { CalculationRecord } from '../../domain/models/storage.models';
import { CalculationService } from '../../core/calculations/calculation.service';
import { CustomerService } from '../../core/customers/customer.service';
import { InventoryComponent } from './inventory.component';

class MockCalculationService {
  readonly #savedCalculations = signal<CalculationRecord[]>([]);
  readonly #details = new Map<string, unknown>();
  readonly activeSavedCalculations = computed(() => this.#savedCalculations().filter((record) => !record.deleted));
  warningMessage: string | null = null;
  shouldThrowOnRecord = false;
  recordPrintCalls = 0;
  recordSaleCalls: any[] = [];
  shouldThrowOnSale = false;

  setSavedCalculations(records: CalculationRecord[]) {
    this.#savedCalculations.set(records);
  }

  setDetail(calculationId: string, detail: unknown) {
    this.#details.set(calculationId, detail);
  }

  async loadCalculationDetail(calculationId: string): Promise<unknown> {
    return this.#details.get(calculationId) ?? null;
  }

  async recordPrintOccurrence(calculationId: string) {
    this.recordPrintCalls += 1;
    if (this.shouldThrowOnRecord) {
      throw new Error('Datenfehler: Filamentbestand konnte nicht abgezogen werden.');
    }

    this.#savedCalculations.update((records) =>
      records.map((record) =>
        record.id === calculationId
          ? {
              ...record,
              timesPrinted: record.timesPrinted + 1
            }
          : record
      )
    );

    return this.warningMessage ? { warning: this.warningMessage } : {};
  }

  async recordSale(payload: any) {
    this.recordSaleCalls.push(payload);
    if (this.shouldThrowOnSale) {
      throw new Error('Fehler beim Speichern des Verkaufs.');
    }

    const isGift = payload.gifted === true;
    this.#savedCalculations.update((records) =>
      records.map((record) =>
        record.id === payload.calculationId
          ? {
              ...record,
              timesSold: (record.timesSold ?? 0) + (isGift ? 0 : 1),
              timesGifted: (record.timesGifted ?? 0) + (isGift ? 1 : 0)
            }
          : record
      )
    );

    const cached = this.#details.get(payload.calculationId) as any;
    if (cached) {
      const entries = [...cached.history.entries];
      entries.unshift({
        id: 'new-sale-id',
        dateLabel: payload.date,
        entryType: isGift ? 'gift' : 'sale',
        quantity: 1,
        priceLabel: isGift ? 'Geschenk' : `${payload.priceEur} €`,
        customerLabel: payload.customerId ? 'Anna Käuferin' : null,
        note: payload.note ?? null
      });

      this.#details.set(payload.calculationId, {
        record: {
          ...cached.record,
          timesSold: (cached.record.timesSold ?? 0) + (isGift ? 0 : 1),
          timesGifted: (cached.record.timesGifted ?? 0) + (isGift ? 1 : 0)
        },
        history: {
          printedCount: cached.history.printedCount,
          soldCount: cached.history.soldCount + (isGift ? 0 : 1),
          giftedCount: cached.history.giftedCount + (isGift ? 1 : 0),
          remainingCount: Math.max(cached.history.printedCount - (cached.history.soldCount + (isGift ? 0 : 1)) - (cached.history.giftedCount + (isGift ? 1 : 0)), 0),
          entries
        }
      });
    }

    return { id: 'sale-mock' };
  }

  async refresh() {
    // no-op
  }
}

class MockCustomerService {
  readonly #customers = signal<any[]>([]);
  activeCustomers = computed(() => this.#customers());

  setCustomers(records: any[]) {
    this.#customers.set(records);
  }

  async refresh() {
    // no-op
  }
}

describe('InventoryComponent', () => {
  it('provides Drucke and Teile tabs with Drucke active on load', async () => {
    const calculationService = new MockCalculationService();
    calculationService.setSavedCalculations([createCalculationRecord({ id: 'calc-1', projectName: 'Halterung' })]);

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        { provide: CalculationService, useValue: calculationService },
        { provide: CustomerService, useClass: MockCustomerService }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Bestand');
    expect(root.textContent).toContain('Drucke');
    expect(root.textContent).toContain('Teile');
    expect(root.querySelector('[data-testid="inventory-tab-drucke"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelector('[data-testid="inventory-tab-teile"]')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('lists saved calculations in Drucke including timesPrinted = 0 with required card fields', async () => {
    const calculationService = new MockCalculationService();
    calculationService.setSavedCalculations([
      createCalculationRecord({
        id: 'calc-1',
        projectName: 'Halterung',
        timesPrinted: 0,
        roundedFinalPriceEur: 12,
        updatedAt: '2026-06-23T10:00:00.000Z'
      }),
      createCalculationRecord({
        id: 'calc-2',
        projectName: 'Adapter',
        timesPrinted: 5,
        roundedFinalPriceEur: 18,
        updatedAt: '2026-06-22T10:00:00.000Z'
      })
    ]);

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        { provide: CalculationService, useValue: calculationService },
        { provide: CustomerService, useClass: MockCustomerService }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const cardTitles = Array.from(root.querySelectorAll('[data-testid="inventory-card-title"]')).map((title) => title.textContent?.trim());
    expect(cardTitles).toEqual(['Halterung', 'Adapter']);
    expect(root.textContent).toContain('Gedruckt: 0');
    expect(root.textContent).toContain('Verkauft: 0');
    expect(root.textContent).toContain('Preis: 12 €');
    expect(root.textContent).toContain('Aktualisiert:');
  });

  it('filters Drucke cards with one active chip at a time', async () => {
    const calculationService = new MockCalculationService();
    calculationService.setSavedCalculations([
      createCalculationRecord({ id: 'calc-stock', projectName: 'Auf-Lager-Projekt', timesPrinted: 4, timesSold: 0 }),
      createCalculationRecord({ id: 'calc-partial', projectName: 'Teilweise-Projekt', timesPrinted: 4, timesSold: 2 }),
      createCalculationRecord({ id: 'calc-full', projectName: 'Vollstaendig-Projekt', timesPrinted: 2, timesSold: 2 }),
      createCalculationRecord({ id: 'calc-gifted', projectName: 'Verschenkt-Projekt', timesPrinted: 3, timesGifted: 3 }),
      createCalculationRecord({ id: 'calc-planned', projectName: 'Geplant-Projekt', timesPrinted: 0 })
    ]);

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        { provide: CalculationService, useValue: calculationService },
        { provide: CustomerService, useClass: MockCustomerService }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const chips = Array.from(root.querySelectorAll('[data-testid="drucke-filter-chip"]')) as HTMLButtonElement[];
    expect(chips.map((chip) => chip.textContent?.trim())).toEqual(['Alle', 'Auf Lager', 'Teilweise', 'Vollständig', 'Verschenkt']);

    clickChip(chips, 'Auf Lager', fixture);
    expect(visibleProjectNames(root)).toEqual(['Auf-Lager-Projekt', 'Geplant-Projekt']);
    expect(chipState(chips, 'Auf Lager')).toBe('true');
    expect(chipState(chips, 'Alle')).toBe('false');

    clickChip(chips, 'Teilweise', fixture);
    expect(visibleProjectNames(root)).toEqual(['Teilweise-Projekt']);
    expect(chipState(chips, 'Teilweise')).toBe('true');
    expect(chipState(chips, 'Auf Lager')).toBe('false');

    clickChip(chips, 'Vollständig', fixture);
    expect(visibleProjectNames(root)).toEqual(['Vollstaendig-Projekt']);

    clickChip(chips, 'Verschenkt', fixture);
    expect(visibleProjectNames(root)).toEqual(['Verschenkt-Projekt']);
  });

  it('shows German empty state with Kalkulation CTA when no saved calculations exist', async () => {
    const calculationService = new MockCalculationService();
    calculationService.setSavedCalculations([]);

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        { provide: CalculationService, useValue: calculationService },
        { provide: CustomerService, useClass: MockCustomerService }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const cta = root.querySelector('[data-testid="inventory-empty-cta"]') as HTMLAnchorElement | null;
    expect(root.textContent).toContain('Noch keine gespeicherten Kalkulationen vorhanden.');
    expect(cta).not.toBeNull();
    expect(cta?.getAttribute('href')).toBe('/calculate');
    expect(cta?.textContent).toContain('Zur Kalkulation');
  });

  it('opens detail from card tap while quick action tap stays separate', async () => {
    const calculationService = new MockCalculationService();
    const record = createCalculationRecord({ id: 'calc-1', projectName: 'Halterung', timesPrinted: 5 });
    calculationService.setSavedCalculations([record]);
    calculationService.setDetail('calc-1', {
      record,
      history: {
        printedCount: 5,
        soldCount: 2,
        giftedCount: 1,
        remainingCount: 2,
        entries: []
      }
    });

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        { provide: CalculationService, useValue: calculationService },
        { provide: CustomerService, useClass: MockCustomerService }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="inventory-detail"]')).toBeNull();

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    root.querySelector('[data-testid="inventory-record-print"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('[data-testid="inventory-detail"]')).toBeNull();
    confirmSpy.mockRestore();

    root.querySelector('[data-testid="inventory-card"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('[data-testid="inventory-detail"]')).toBeTruthy();
    expect(root.textContent).toContain('Details zur Kalkulation');
  });

  it('renders snapshot and sale history detail data with German labels', async () => {
    const calculationService = new MockCalculationService();
    const record = createCalculationRecord({ id: 'calc-1', projectName: 'Halterung', timesPrinted: 6 });
    calculationService.setSavedCalculations([record]);
    calculationService.setDetail('calc-1', {
      record,
      history: {
        printedCount: 6,
        soldCount: 3,
        giftedCount: 1,
        remainingCount: 2,
        entries: [
          {
            id: 'sale-2',
            dateLabel: '25.06.2026',
            entryType: 'gift',
            quantity: 1,
            priceLabel: 'Geschenk',
            note: 'Messe'
          },
          {
            id: 'sale-1',
            dateLabel: '24.06.2026',
            entryType: 'sale',
            quantity: 3,
            priceLabel: '19,90 €',
            customerLabel: 'Anna Käuferin'
          }
        ]
      }
    });

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        { provide: CalculationService, useValue: calculationService },
        { provide: CustomerService, useClass: MockCustomerService }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    root.querySelector('[data-testid="inventory-card"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.textContent).toContain('Drucker: Prusa MK4');
    expect(root.textContent).toContain('Druckzeit: 2 Std.');
    expect(root.textContent).toContain('Verkauft: 3');
    expect(root.textContent).toContain('Verschenkt: 1');
    expect(root.textContent).toContain('Verbleibend: 2');
    expect(root.textContent).toContain('Geschenk');
    expect(root.textContent).toContain('Anna Käuferin');
    expect(root.textContent).toContain('Notiz: Messe');
  });

  it('records +1 print occurrence after German confirmation and updates printed count', async () => {
    const calculationService = new MockCalculationService();
    calculationService.setSavedCalculations([createCalculationRecord({ id: 'calc-1', projectName: 'Halterung', timesPrinted: 2 })]);

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        { provide: CalculationService, useValue: calculationService },
        { provide: CustomerService, useClass: MockCustomerService }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('[data-testid="inventory-record-print"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(confirmSpy).toHaveBeenCalledWith('Druck verbuchen?');
    expect(calculationService.recordPrintCalls).toBe(1);
    expect(root.textContent).toContain('Gedruckt: 3');
    confirmSpy.mockRestore();
  });

  it('shows German warning when stock is clamped to zero during print occurrence', async () => {
    const calculationService = new MockCalculationService();
    calculationService.warningMessage = 'Warnung: Bestand war zu niedrig, Restmenge wurde auf 0 g gesetzt.';
    calculationService.setSavedCalculations([createCalculationRecord({ id: 'calc-1', projectName: 'Halterung', timesPrinted: 0 })]);

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        { provide: CalculationService, useValue: calculationService },
        { provide: CustomerService, useClass: MockCustomerService }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('[data-testid="inventory-record-print"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.textContent).toContain('Warnung: Bestand war zu niedrig, Restmenge wurde auf 0 g gesetzt.');
    confirmSpy.mockRestore();
  });

  it('blocks print occurrence with German data error when stock deduction fails', async () => {
    const calculationService = new MockCalculationService();
    calculationService.shouldThrowOnRecord = true;
    calculationService.setSavedCalculations([createCalculationRecord({ id: 'calc-1', projectName: 'Halterung', timesPrinted: 1 })]);

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        { provide: CalculationService, useValue: calculationService },
        { provide: CustomerService, useClass: MockCustomerService }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('[data-testid="inventory-record-print"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(calculationService.recordPrintCalls).toBe(1);
    expect(root.textContent).toContain('Datenfehler: Filamentbestand konnte nicht abgezogen werden.');
    expect(root.textContent).toContain('Gedruckt: 1');
    confirmSpy.mockRestore();
  });

  it('opens and closes the sale/gift form when clicking the toggle button', async () => {
    const calculationService = new MockCalculationService();
    const record = createCalculationRecord({ id: 'calc-1', projectName: 'Halterung', timesPrinted: 5 });
    calculationService.setSavedCalculations([record]);
    calculationService.setDetail('calc-1', {
      record,
      history: { printedCount: 5, soldCount: 0, giftedCount: 0, remainingCount: 5, entries: [] }
    });

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        { provide: CalculationService, useValue: calculationService },
        { provide: CustomerService, useClass: MockCustomerService }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    root.querySelector('[data-testid="inventory-card"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="sale-form"]')).toBeNull();

    const toggleBtn = root.querySelector('[data-testid="toggle-sale-form-btn"]') as HTMLButtonElement;
    toggleBtn.click();
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="sale-form"]')).toBeTruthy();

    toggleBtn.click();
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="sale-form"]')).toBeNull();
  });

  it('validates price non-negativity and required date', async () => {
    const calculationService = new MockCalculationService();
    const record = createCalculationRecord({ id: 'calc-1', projectName: 'Halterung', timesPrinted: 5 });
    calculationService.setSavedCalculations([record]);
    calculationService.setDetail('calc-1', {
      record,
      history: { printedCount: 5, soldCount: 0, giftedCount: 0, remainingCount: 5, entries: [] }
    });

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        { provide: CalculationService, useValue: calculationService },
        { provide: CustomerService, useClass: MockCustomerService }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    root.querySelector('[data-testid="inventory-card"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    (root.querySelector('[data-testid="toggle-sale-form-btn"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const priceInput = root.querySelector('[data-testid="sale-price-input"]') as HTMLInputElement;
    priceInput.value = '-5';
    priceInput.dispatchEvent(new Event('input'));
    priceInput.dispatchEvent(new Event('blur'));

    const dateInput = root.querySelector('[data-testid="sale-date-input"]') as HTMLInputElement;
    dateInput.value = '';
    dateInput.dispatchEvent(new Event('input'));
    dateInput.dispatchEvent(new Event('blur'));

    fixture.detectChanges();

    expect(root.querySelector('[data-testid="price-min-error"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="date-required-error"]')).toBeTruthy();
  });

  it('disables and sets price to 0 when checking gifted', async () => {
    const calculationService = new MockCalculationService();
    const record = createCalculationRecord({ id: 'calc-1', projectName: 'Halterung', timesPrinted: 5 });
    calculationService.setSavedCalculations([record]);
    calculationService.setDetail('calc-1', {
      record,
      history: { printedCount: 5, soldCount: 0, giftedCount: 0, remainingCount: 5, entries: [] }
    });

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        { provide: CalculationService, useValue: calculationService },
        { provide: CustomerService, useClass: MockCustomerService }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    root.querySelector('[data-testid="inventory-card"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    (root.querySelector('[data-testid="toggle-sale-form-btn"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const priceInput = root.querySelector('[data-testid="sale-price-input"]') as HTMLInputElement;
    priceInput.value = '25';
    priceInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(priceInput.value).toBe('25');

    const giftedCheck = root.querySelector('[data-testid="sale-gifted-checkbox"]') as HTMLInputElement;
    giftedCheck.click();
    giftedCheck.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(priceInput.value).toBe('0');
    expect(priceInput.disabled).toBe(true);
  });

  it('records a sale and updates the history detail/card counters', async () => {
    const calculationService = new MockCalculationService();
    const record = createCalculationRecord({ id: 'calc-1', projectName: 'Halterung', timesPrinted: 5 });
    calculationService.setSavedCalculations([record]);
    calculationService.setDetail('calc-1', {
      record,
      history: { printedCount: 5, soldCount: 0, giftedCount: 0, remainingCount: 5, entries: [] }
    });

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        { provide: CalculationService, useValue: calculationService },
        { provide: CustomerService, useClass: MockCustomerService }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    root.querySelector('[data-testid="inventory-card"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    (root.querySelector('[data-testid="toggle-sale-form-btn"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const priceInput = root.querySelector('[data-testid="sale-price-input"]') as HTMLInputElement;
    priceInput.value = '19.99';
    priceInput.dispatchEvent(new Event('input'));

    const dateInput = root.querySelector('[data-testid="sale-date-input"]') as HTMLInputElement;
    dateInput.value = '2026-06-25';
    dateInput.dispatchEvent(new Event('input'));

    const noteInput = root.querySelector('[data-testid="sale-note-input"]') as HTMLTextAreaElement;
    noteInput.value = 'Online sale';
    noteInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    const submitBtn = root.querySelector('[data-testid="submit-sale-btn"]') as HTMLButtonElement;
    submitBtn.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(calculationService.recordSaleCalls.length).toBe(1);
    expect(calculationService.recordSaleCalls[0]).toEqual({
      calculationId: 'calc-1',
      customerId: undefined,
      date: '2026-06-25',
      priceEur: 19.99,
      gifted: false,
      note: 'Online sale'
    });

    expect(root.textContent).toContain('Eintrag erfolgreich gespeichert.');
    expect(root.querySelector('[data-testid="sale-form"]')).toBeNull();

    expect(root.textContent).toContain('Verkauft: 1');
    expect(root.textContent).toContain('Verbleibend: 4');
  });
});

function clickChip(chips: HTMLButtonElement[], label: string, fixture: { detectChanges: () => void }) {
  chips.find((chip) => chip.textContent?.trim() === label)?.click();
  fixture.detectChanges();
}

function chipState(chips: HTMLButtonElement[], label: string): string | null {
  return chips.find((chip) => chip.textContent?.trim() === label)?.getAttribute('aria-pressed') ?? null;
}

function visibleProjectNames(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll('[data-testid="inventory-card-title"]')).map((title) => title.textContent?.trim() ?? '');
}

type InventoryRecordSeed = {
  id: string;
  projectName: string;
  timesPrinted?: number;
  roundedFinalPriceEur?: number;
  updatedAt?: string;
  timesSold?: number;
  timesGifted?: number;
};

function createCalculationRecord(seed: InventoryRecordSeed): CalculationRecord {
  return {
    id: seed.id,
    projectName: seed.projectName,
    timesPrinted: seed.timesPrinted ?? 0,
    deleted: false,
    printerSnapshot: {
      id: 'printer-1',
      name: 'Prusa MK4',
      powerWatts: 350,
      purchasePriceEur: 1000,
      lifetimeHours: 10000,
      electricityPriceEurKwh: 0.35,
      annualBaseFeeEur: 0
    },
    filamentSnapshots: [],
    calculationInput: {
      filamentLines: [],
      printMinutes: 120,
      printQuantity: 1,
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
    },
    calculationResult: {
      plateCount: 1,
      totalGrams: 0,
      materialCostEur: 0,
      electricityCostEur: 0,
      depreciationCostEur: 0,
      modelingCostEur: 0,
      extraWorkFeeEur: 0,
      subtotalEur: 0,
      finalPriceEur: 0,
      roundedFinalPriceEur: seed.roundedFinalPriceEur ?? 0
    },
    createdAt: '2026-06-23T00:00:00.000Z',
    updatedAt: seed.updatedAt ?? '2026-06-23T00:00:00.000Z',
    ...(seed.timesSold === undefined ? {} : { timesSold: seed.timesSold }),
    ...(seed.timesGifted === undefined ? {} : { timesGifted: seed.timesGifted })
  } as CalculationRecord;
}
