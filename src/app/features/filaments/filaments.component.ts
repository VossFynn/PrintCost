import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { FilamentPayload, FilamentService } from '../../core/filaments/filament.service';
import { FilamentRecord } from '../../domain/models/storage.models';

type FilamentFormFieldName =
  | 'name'
  | 'type'
  | 'colorHex'
  | 'manufacturer'
  | 'rollWeightG'
  | 'remainingG'
  | 'multiColorSurchargeEurKg'
  | 'fixedPriceEurG';

type FilamentFilter = 'Alle' | 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'Anderes';

/**
 * Manages the filament list, search/filter state, and create/edit dialog.
 *
 * The component keeps persistence rules in the service and only orchestrates
 * form state, list filtering, and user-facing confirmations here.
 */
@Component({
  selector: 'app-filaments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './filaments.component.html',
  styleUrl: './filaments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilamentsComponent {
  readonly #filamentService = inject(FilamentService);
  readonly #formBuilder = inject(FormBuilder);
  readonly #materialFilters = new Set<Exclude<FilamentFilter, 'Alle' | 'Anderes'>>(['PLA', 'PETG', 'ABS', 'TPU']);

  readonly form = this.#formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    type: ['', [Validators.required, Validators.maxLength(50)]],
    colorHex: ['#000000', [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)]],
    manufacturer: ['', [Validators.maxLength(120)]],
    rollWeightG: [0, [Validators.required, Validators.min(0.0001)]],
    remainingG: [0, [Validators.required, Validators.min(0)]],
    multiColorSurchargeEurKg: [0, [Validators.required, Validators.min(0)]],
    fixedPriceEurG: [0, [Validators.min(0)]]
  });

  readonly purchases = this.#formBuilder.array([this.createPurchaseGroup()]);
  readonly isDialogOpen = signal(false);
  readonly isSaving = signal(false);
  readonly serviceError = signal<string | null>(null);
  readonly editingFilamentId = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly selectedFilter = signal<FilamentFilter>('Alle');
  readonly filamentFilters = ['Alle', 'PLA', 'PETG', 'ABS', 'TPU', 'Anderes'] as const;

  readonly filaments = this.#filamentService.activeFilaments;
  readonly visibleFilaments = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const selectedFilter = this.selectedFilter();

    return this.filaments().filter((filament) => {
      // Keep the chip filter and free-text search aligned so the UI stays reactive.
      const material = this.materialTag(filament.type);
      const matchesFilter =
        selectedFilter === 'Alle'
          ? true
          : selectedFilter === 'Anderes'
            ? !this.#materialFilters.has(material as Exclude<FilamentFilter, 'Alle' | 'Anderes'>)
            : material === selectedFilter;
      const matchesSearch = !search
        ? true
        : [filament.name, filament.type, filament.manufacturer ?? '']
            .join(' ')
            .toLowerCase()
            .includes(search);

      return matchesFilter && matchesSearch;
    });
  });

  get purchaseGroups() {
    return this.purchases.controls;
  }

  constructor() {
    void this.#filamentService.refresh();
  }

  openCreateDialog(): void {
    this.resetForm();
    this.isDialogOpen.set(true);
    this.serviceError.set(null);
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  selectFilter(filter: FilamentFilter): void {
    this.selectedFilter.set(filter);
  }

  async requestDelete(filamentId: string): Promise<void> {
    // Deletion stays a confirm-first action because the service keeps history alive.
    const confirmed = window.confirm(
      'Willst du dieses Filament wirklich löschen? Es bleibt für gespeicherte Kalkulationen erhalten.'
    );

    if (!confirmed) {
      return;
    }

    this.serviceError.set(null);
    try {
      await this.#filamentService.softDeleteFilament(filamentId);
    } catch (error) {
      if (error instanceof Error) {
        this.serviceError.set(error.message);
      } else {
        this.serviceError.set('Löschen fehlgeschlagen');
      }
    }
  }

  startEdit(filamentId: string): void {
    // The dialog is populated from the cached record so edits always start from the latest persisted state.
    const filament = this.filaments().find((candidate) => candidate.id === filamentId);
    if (!filament) {
      return;
    }

    this.editingFilamentId.set(filament.id);
    this.form.setValue({
      name: filament.name,
      type: filament.type,
      colorHex: filament.colorHex ?? '#000000',
      manufacturer: filament.manufacturer ?? '',
      rollWeightG: filament.rollWeightG ?? 0,
      remainingG: filament.remainingG ?? 0,
      multiColorSurchargeEurKg: filament.multiColorSurchargeEurKg ?? 0,
      fixedPriceEurG: filament.fixedPriceEurG ?? 0
    });

    while (this.purchases.length > 0) {
      this.purchases.removeAt(0);
    }
    const sourcePurchases = filament.purchases?.length ? filament.purchases : [{ priceEur: 0, quantityKg: 0, purchasedAt: '' }];
    for (const purchase of sourcePurchases) {
      this.purchases.push(
        this.#formBuilder.nonNullable.group({
          priceEur: [purchase.priceEur, [Validators.required, Validators.min(0.0001)]],
          quantityKg: [purchase.quantityKg, [Validators.required, Validators.min(0.0001)]],
          purchasedAt: [purchase.purchasedAt, [Validators.required]]
        })
      );
    }

    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.purchases.markAsPristine();
    this.purchases.markAsUntouched();
    this.serviceError.set(null);
    this.isDialogOpen.set(true);
  }

  async saveFilament(): Promise<void> {
    this.form.markAllAsTouched();
    this.purchases.markAllAsTouched();
    this.serviceError.set(null);

    if (this.form.invalid || this.purchases.length === 0 || this.purchases.invalid) {
      return;
    }

    const payload = this.buildPayload();
    this.isSaving.set(true);
    try {
      const editId = this.editingFilamentId();
      // Use the presence of an edit id to switch between create and update without duplicating form logic.
      if (editId) {
        await this.#filamentService.updateFilament(editId, payload);
      } else {
        await this.#filamentService.createFilament(payload);
      }
      this.closeDialog(true);
    } catch (error) {
      if (error instanceof Error) {
        this.serviceError.set(error.message);
      } else {
        this.serviceError.set('Speichern fehlgeschlagen');
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  closeDialog(force = false): void {
    if (!force && (this.form.dirty || this.purchases.dirty)) {
      const confirmed = window.confirm('Ungespeicherte Änderungen verwerfen?');
      if (!confirmed) {
        return;
      }
    }

    this.isDialogOpen.set(false);
    this.resetForm();
  }

  addPurchase(): void {
    this.purchases.push(this.createPurchaseGroup());
  }

  removePurchase(index: number): void {
    if (this.purchases.length === 1) {
      return;
    }

    this.purchases.removeAt(index);
  }

  getError(field: FilamentFormFieldName): string | null {
    const control = this.form.controls[field];
    if (!control.touched || !control.invalid) {
      return null;
    }

    if (control.hasError('required')) {
      switch (field) {
        case 'name':
          return 'Bitte Name eingeben';
        case 'type':
          return 'Bitte Typ eingeben';
        case 'colorHex':
          return 'Bitte Farbe eingeben';
        case 'rollWeightG':
          return 'Bitte Rollengewicht eingeben';
        case 'remainingG':
          return 'Bitte Restmenge eingeben';
        case 'multiColorSurchargeEurKg':
          return 'Bitte Zuschlag eingeben';
        default:
          return 'Pflichtfeld';
      }
    }

    if (control.hasError('pattern') && field === 'colorHex') {
      return 'Farbe muss ein Hex-Wert sein (z. B. #ff00aa)';
    }

    if (control.hasError('min')) {
      switch (field) {
        case 'rollWeightG':
          return 'Rollengewicht muss größer als 0 sein';
        case 'remainingG':
          return 'Restmenge darf nicht negativ sein';
        case 'multiColorSurchargeEurKg':
          return 'Zuschlag darf nicht negativ sein';
        case 'fixedPriceEurG':
          return 'Fixpreis darf nicht negativ sein';
      }
    }

    if (control.hasError('maxlength')) {
      switch (field) {
        case 'name':
          return 'Name ist zu lang';
        case 'type':
          return 'Typ ist zu lang';
        case 'manufacturer':
          return 'Hersteller ist zu lang';
      }
    }

    return null;
  }

  getPurchaseError(index: number, field: 'priceEur' | 'quantityKg' | 'purchasedAt'): string | null {
    const control = this.purchases.at(index).get(field);
    if (!control || !control.touched || !control.invalid) {
      return null;
    }

    if (control.hasError('required')) {
      if (field === 'priceEur') {
        return 'Bitte Preis eingeben';
      }
      if (field === 'quantityKg') {
        return 'Bitte Menge eingeben';
      }
      return 'Bitte Datum eingeben';
    }

    if (control.hasError('min')) {
      if (field === 'priceEur') {
        return 'Preis muss größer als 0 sein';
      }
      return 'Menge muss größer als 0 sein';
    }

    return null;
  }

  getPurchaseArrayError(): string | null {
    if (this.purchases.length > 0 && !this.purchases.invalid) {
      return null;
    }

    if (!this.purchases.touched && !this.form.touched) {
      return null;
    }

    return 'Bitte mindestens einen Einkauf eingeben';
  }

  stockStateText(remainingG: number): string {
    if (remainingG <= 0) {
      return 'Kein Bestand';
    }

    if (remainingG <= 100) {
      return 'Niedriger Bestand';
    }

    return 'Bestand verfügbar';
  }

  stockStateTone(remainingG: number): 'empty' | 'low' | 'available' {
    if (remainingG <= 0) {
      return 'empty';
    }

    if (remainingG <= 100) {
      return 'low';
    }

    return 'available';
  }

  materialTag(type: string): FilamentFilter {
    const normalized = type.trim().toUpperCase() as FilamentFilter;
    // Unknown materials collapse into "Anderes" so the chip row stays small and predictable.
    return this.filamentFilters.includes(normalized) ? normalized : 'Anderes';
  }

  formatPricePerGram(filament: FilamentRecord): string {
    const price = this.#filamentService.weightedAveragePricePerGram(filament);
    return `${price.toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} €/g`;
  }

  trackByFilamentId(index: number, filament: FilamentRecord): string {
    return filament.id;
  }

  private createPurchaseGroup() {
    return this.#formBuilder.nonNullable.group({
      priceEur: [0, [Validators.required, Validators.min(0.0001)]],
      quantityKg: [0, [Validators.required, Validators.min(0.0001)]],
      purchasedAt: ['', [Validators.required]]
    });
  }

  private buildPayload(): FilamentPayload {
    const form = this.form.getRawValue();
    const purchases = this.purchases.getRawValue().map((purchase) => ({
      priceEur: Number(purchase.priceEur),
      quantityKg: Number(purchase.quantityKg),
      purchasedAt: purchase.purchasedAt
    }));

    return {
      name: form.name,
      type: form.type,
      colorHex: form.colorHex,
      manufacturer: form.manufacturer?.trim() ? form.manufacturer : undefined,
      rollWeightG: Number(form.rollWeightG),
      remainingG: Number(form.remainingG),
      purchases,
      multiColorSurchargeEurKg: Number(form.multiColorSurchargeEurKg),
      fixedPriceEurG: form.fixedPriceEurG > 0 ? Number(form.fixedPriceEurG) : undefined
    };
  }

  private resetForm(): void {
    this.editingFilamentId.set(null);
    this.form.reset({
      name: '',
      type: '',
      colorHex: '#000000',
      manufacturer: '',
      rollWeightG: 0,
      remainingG: 0,
      multiColorSurchargeEurKg: 0,
      fixedPriceEurG: 0
    });

    while (this.purchases.length > 0) {
      this.purchases.removeAt(0);
    }
    this.purchases.push(this.createPurchaseGroup());
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.purchases.markAsPristine();
    this.purchases.markAsUntouched();
  }
}
