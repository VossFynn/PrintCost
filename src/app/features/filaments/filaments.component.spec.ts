import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { vi } from 'vitest';

import { FilamentRecord } from '../../domain/models/storage.models';
import { FilamentService } from '../../core/filaments/filament.service';
import { FilamentsComponent } from './filaments.component';

class MockFilamentService {
  private readonly filamentsSignal = signal<FilamentRecord[]>([]);

  filaments = this.filamentsSignal.asReadonly();
  activeFilaments = computed(() => this.filamentsSignal().filter((filament) => !filament.deleted));
  refreshCalls = 0;
  createCalls = 0;
  softDeleteCalls = 0;

  constructor(initialFilaments: FilamentRecord[] = []) {
    this.filamentsSignal.set(initialFilaments);
  }

  async refresh() {
    this.refreshCalls += 1;
  }

  async createFilament() {
    this.createCalls += 1;
    const now = new Date().toISOString();
    this.filamentsSignal.set([
      ...this.filamentsSignal(),
      {
        id: `filament-${this.filamentsSignal().length + 1}`,
        name: 'PLA White',
        type: 'PLA',
        colorHex: '#ffffff',
        manufacturer: 'Prusa',
        rollWeightG: 1000,
        remainingG: 0,
        purchases: [{ priceEur: 22.99, quantityKg: 1, purchasedAt: '2026-06-20' }],
        multiColorSurchargeEurKg: 0,
        fixedPriceEurG: undefined,
        deleted: false,
        createdAt: now,
        updatedAt: now
      }
    ]);
  }

  async softDeleteFilament(id: string) {
    this.softDeleteCalls += 1;
    this.filamentsSignal.set(
      this.filamentsSignal().map((filament) =>
        filament.id === id ? { ...filament, deleted: true, updatedAt: new Date().toISOString() } : filament
      )
    );
  }

  getFilamentById(id: string) {
    return this.filamentsSignal().find((filament) => filament.id === id);
  }

  weightedAveragePricePerGram(filament: FilamentRecord): number {
    const totalQuantityKg = filament.purchases?.reduce((sum, purchase) => sum + purchase.quantityKg, 0) ?? 0;
    if (totalQuantityKg <= 0) {
      return 0;
    }

    const totalPrice = filament.purchases?.reduce((sum, purchase) => sum + purchase.priceEur * purchase.quantityKg, 0) ?? 0;
    return totalPrice / totalQuantityKg / 1000;
  }
}

describe('FilamentsComponent', () => {
  it('renders list and opens add dialog', async () => {
    const mock = new MockFilamentService();
    await TestBed.configureTestingModule({
      imports: [FilamentsComponent],
      providers: [{ provide: FilamentService, useValue: mock }]
    }).compileComponents();

    const fixture = TestBed.createComponent(FilamentsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Filamente');
    expect(root.querySelector('[data-testid="filament-empty-state"]')).not.toBeNull();
    expect(mock.refreshCalls).toBeGreaterThan(0);

    (root.querySelector('[data-testid="open-filament-dialog"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('[data-testid="filament-dialog"]')).not.toBeNull();
  });

  it('shows German inline validation for invalid save', async () => {
    const mock = new MockFilamentService();
    await TestBed.configureTestingModule({
      imports: [FilamentsComponent],
      providers: [{ provide: FilamentService, useValue: mock }]
    }).compileComponents();

    const fixture = TestBed.createComponent(FilamentsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('[data-testid="open-filament-dialog"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    (root.querySelector('[data-testid="save-filament"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(root.textContent).toContain('Bitte Name eingeben');
    expect(root.textContent).toContain('Bitte mindestens einen Einkauf eingeben');
    expect(mock.createCalls).toBe(0);
  });

  it('keeps zero-stock filament visible with explicit state text', async () => {
    const mock = new MockFilamentService([
      {
        id: 'filament-1',
        name: 'PLA White',
        type: 'PLA',
        colorHex: '#ffffff',
        manufacturer: 'Prusa',
        rollWeightG: 1000,
        remainingG: 0,
        purchases: [{ priceEur: 22.99, quantityKg: 1, purchasedAt: '2026-06-20' }],
        multiColorSurchargeEurKg: 0,
        fixedPriceEurG: undefined,
        deleted: false,
        createdAt: '2026-06-23T00:00:00.000Z',
        updatedAt: '2026-06-23T00:00:00.000Z'
      }
    ]);

    await TestBed.configureTestingModule({
      imports: [FilamentsComponent],
      providers: [{ provide: FilamentService, useValue: mock }]
    }).compileComponents();

    const fixture = TestBed.createComponent(FilamentsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('PLA White');
    expect(root.textContent).toContain('Kein Bestand');
    expect(root.querySelector('[data-testid="filament-item"]')).not.toBeNull();
    const stockBadge = root.querySelector('[data-testid="filament-stock-badge"]') as HTMLElement | null;
    expect(stockBadge).not.toBeNull();
    expect(stockBadge?.classList.contains('filament-list__stock-badge--empty')).toBe(true);
  });

  it('filters filaments with search and chips while keeping chips visible on no results', async () => {
    const mock = new MockFilamentService([
      {
        id: 'filament-1',
        name: 'PLA White',
        type: 'PLA',
        colorHex: '#ffffff',
        manufacturer: 'Prusa',
        rollWeightG: 1000,
        remainingG: 650,
        purchases: [{ priceEur: 22.99, quantityKg: 1, purchasedAt: '2026-06-20' }],
        multiColorSurchargeEurKg: 0,
        fixedPriceEurG: undefined,
        deleted: false,
        createdAt: '2026-06-23T00:00:00.000Z',
        updatedAt: '2026-06-23T00:00:00.000Z'
      },
      {
        id: 'filament-2',
        name: 'TPU Orange',
        type: 'TPU',
        colorHex: '#ff6600',
        manufacturer: 'Fiberlogy',
        rollWeightG: 750,
        remainingG: 120,
        purchases: [{ priceEur: 34.5, quantityKg: 0.75, purchasedAt: '2026-06-19' }],
        multiColorSurchargeEurKg: 0,
        fixedPriceEurG: undefined,
        deleted: false,
        createdAt: '2026-06-23T00:00:00.000Z',
        updatedAt: '2026-06-23T00:00:00.000Z'
      }
    ]);

    await TestBed.configureTestingModule({
      imports: [FilamentsComponent],
      providers: [{ provide: FilamentService, useValue: mock }]
    }).compileComponents();

    const fixture = TestBed.createComponent(FilamentsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const chips = Array.from(root.querySelectorAll('[data-testid="filament-filter-chip"]')) as HTMLButtonElement[];
    expect(chips.map((chip) => chip.textContent?.trim())).toEqual(['Alle', 'PLA', 'PETG', 'ABS', 'TPU', 'Anderes']);

    chips.find((chip) => chip.textContent?.trim() === 'PLA')?.click();
    fixture.detectChanges();
    expect(chips.find((chip) => chip.textContent?.trim() === 'PLA')?.getAttribute('aria-pressed')).toBe('true');
    expect(chips.find((chip) => chip.textContent?.trim() === 'TPU')?.getAttribute('aria-pressed')).toBe('false');
    expect(root.textContent).toContain('PLA White');
    expect(root.textContent).not.toContain('TPU Orange');

    const searchInput = root.querySelector('[data-testid="filament-search"]') as HTMLInputElement;
    searchInput.value = 'zzz';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(root.textContent).toContain('Keine Filamente gefunden.');
    expect(root.querySelector('[data-testid="filament-filter-chip"]')).not.toBeNull();
  });

  it('renders material tag and price per gram in each row', async () => {
    const mock = new MockFilamentService([
      {
        id: 'filament-1',
        name: 'PLA White',
        type: 'PLA',
        colorHex: '#ffffff',
        manufacturer: 'Prusa',
        rollWeightG: 1000,
        remainingG: 180,
        purchases: [{ priceEur: 22.99, quantityKg: 1, purchasedAt: '2026-06-20' }],
        multiColorSurchargeEurKg: 0,
        fixedPriceEurG: undefined,
        deleted: false,
        createdAt: '2026-06-23T00:00:00.000Z',
        updatedAt: '2026-06-23T00:00:00.000Z'
      }
    ]);

    await TestBed.configureTestingModule({
      imports: [FilamentsComponent],
      providers: [{ provide: FilamentService, useValue: mock }]
    }).compileComponents();

    const fixture = TestBed.createComponent(FilamentsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('PLA White');
    expect(root.textContent).toContain('Prusa');
    expect(root.textContent).toContain('PLA');
    expect(root.textContent).toContain('0,023 €/g');
    expect(root.textContent).toContain('180 g');
  });

  it('asks for confirmation before deleting a filament and keeps cancel safe', async () => {
    const mock = new MockFilamentService([
      {
        id: 'filament-1',
        name: 'PLA White',
        type: 'PLA',
        colorHex: '#ffffff',
        manufacturer: 'Prusa',
        rollWeightG: 1000,
        remainingG: 180,
        purchases: [{ priceEur: 22.99, quantityKg: 1, purchasedAt: '2026-06-20' }],
        multiColorSurchargeEurKg: 0,
        fixedPriceEurG: undefined,
        deleted: false,
        createdAt: '2026-06-23T00:00:00.000Z',
        updatedAt: '2026-06-23T00:00:00.000Z'
      }
    ]);

    await TestBed.configureTestingModule({
      imports: [FilamentsComponent],
      providers: [{ provide: FilamentService, useValue: mock }]
    }).compileComponents();

    const fixture = TestBed.createComponent(FilamentsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    (root.querySelector('[data-testid="delete-filament"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(confirmSpy).toHaveBeenCalledWith(
      'Willst du dieses Filament wirklich löschen? Es bleibt für gespeicherte Kalkulationen erhalten.'
    );
    expect(mock.softDeleteCalls).toBe(0);
    expect(root.textContent).toContain('PLA White');
    confirmSpy.mockRestore();
  });

  it('soft-deletes a filament from the active list after confirmation', async () => {
    const mock = new MockFilamentService([
      {
        id: 'filament-1',
        name: 'PLA White',
        type: 'PLA',
        colorHex: '#ffffff',
        manufacturer: 'Prusa',
        rollWeightG: 1000,
        remainingG: 180,
        purchases: [{ priceEur: 22.99, quantityKg: 1, purchasedAt: '2026-06-20' }],
        multiColorSurchargeEurKg: 0,
        fixedPriceEurG: undefined,
        deleted: false,
        createdAt: '2026-06-23T00:00:00.000Z',
        updatedAt: '2026-06-23T00:00:00.000Z'
      }
    ]);

    await TestBed.configureTestingModule({
      imports: [FilamentsComponent],
      providers: [{ provide: FilamentService, useValue: mock }]
    }).compileComponents();

    const fixture = TestBed.createComponent(FilamentsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    (root.querySelector('[data-testid="delete-filament"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(confirmSpy).toHaveBeenCalled();
    expect(mock.softDeleteCalls).toBe(1);
    expect(root.textContent).not.toContain('PLA White');
    confirmSpy.mockRestore();
  });

  it('uses a German confirmation dialog when closing dirty form without saving', async () => {
    const mock = new MockFilamentService();
    await TestBed.configureTestingModule({
      imports: [FilamentsComponent],
      providers: [{ provide: FilamentService, useValue: mock }]
    }).compileComponents();

    const fixture = TestBed.createComponent(FilamentsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('[data-testid="open-filament-dialog"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const nameInput = root.querySelector('[data-testid="name"]') as HTMLInputElement;
    nameInput.value = 'PLA White';
    nameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    (root.querySelector('[data-testid="cancel-filament"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(confirmSpy).toHaveBeenCalledWith('Ungespeicherte Änderungen verwerfen?');
    expect(root.querySelector('[data-testid="filament-dialog"]')).not.toBeNull();
    confirmSpy.mockRestore();
  });
});
