import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CalculationService } from '../../core/calculations/calculation.service';
import { CustomerService } from '../../core/customers/customer.service';
import { FilamentPriceMode, FilamentService } from '../../core/filaments/filament.service';
import { PrinterService } from '../../core/printers/printer.service';
import { SettingsService } from '../../core/settings/settings.service';
import { calculate, CalculationInput, CalculationResult } from '../../domain/calculation/calculate';
import { CalculationFilamentLineSnapshot, FilamentRecord } from '../../domain/models/storage.models';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

const LAST_USED_PRINTER_SETTING_KEY = 'lastUsedPrinterProfileId';
const RESULT_ANNOUNCEMENT_DEBOUNCE_MS = 300;
const DEFAULT_PRINT_QUANTITY = 1;
const DEFAULT_PARTS_PER_PLATE = 1;
const DEFAULT_EXTRA_WORK_FEE_PERCENT = 0;
const DEFAULT_MODELING_HOURLY_RATE_EUR = 0;
const DEFAULT_MODELING_HOURS = 0;
const DEFAULT_PROFIT_MARGIN_PERCENT = 0;

type CalculationFieldName = 'projectName' | 'printerId' | 'printHours';

type FilamentPriceModeOption = {
  value: FilamentPriceMode;
  label: string;
};

type FilamentLineForm = FormGroup<{
  filamentId: FormControl<string>;
  grams: FormControl<number>;
  priceMode: FormControl<FilamentPriceMode>;
  fixedPriceEurG: FormControl<number>;
}>;

@Component({
  selector: 'app-calculate',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PageHeaderComponent],
  templateUrl: './calculate.component.html',
  styleUrl: './calculate.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalculateComponent {
  readonly #filamentService = inject(FilamentService);
  readonly #printerService = inject(PrinterService);
  readonly #customerService = inject(CustomerService);
  readonly #settingsService = inject(SettingsService);
  readonly #calculationService = inject(CalculationService);
  readonly #formBuilder = inject(FormBuilder);
  readonly #currencyFormatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  readonly activeFilaments = this.#filamentService.activeFilaments;
  readonly activePrinters = this.#printerService.activePrinters;
  readonly activeCustomers = this.#customerService.activeCustomers;
  readonly hasActiveFilaments = computed(() => this.activeFilaments().length > 0);
  readonly hasActivePrinters = computed(() => this.activePrinters().length > 0);
  readonly loadError = signal<string | null>(null);
  readonly #formRevision = signal(0);
  readonly resultAnnouncementText = signal('');
  readonly saveFeedback = signal('');
  readonly liveResult = computed(() => {
    this.#formRevision();
    return this.computeLiveResult();
  });
  readonly plateExplanation = computed(() => {
    const result = this.liveResult();
    if (!result || result.plateCount <= 1) {
      return null;
    }

    return `${result.plateCount} Platten werden benötigt`;
  });
  readonly showExtraWorkFeeControl = computed(() => this.plateExplanation() !== null);
  readonly profitAmountEur = computed(() => {
    const result = this.liveResult();
    if (!result) {
      return null;
    }

    return result.finalPriceEur - result.subtotalEur;
  });
  readonly isMulticolor = computed(() => this.filamentLines.length > 1);
  readonly gewinnmarge = computed(() => {
    const result = this.liveResult();
    if (!result || result.roundedFinalPriceEur <= 0) {
      return 0;
    }

    return Math.round(((result.finalPriceEur - result.subtotalEur) / result.finalPriceEur) * 100);
  });
  #announcementTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly form = this.#formBuilder.nonNullable.group({
    projectName: ['', [Validators.required, Validators.maxLength(120)]],
    customerId: [''],
    printerId: ['', [Validators.required]],
    printHours: [0, [Validators.required, Validators.min(0.0001)]],
    printQuantity: [DEFAULT_PRINT_QUANTITY, [Validators.required, Validators.min(1)]],
    partsPerPlate: [DEFAULT_PARTS_PER_PLATE, [Validators.required, Validators.min(1)]],
    modelExists: [false, [Validators.required]],
    modelingHourlyRateEur: [DEFAULT_MODELING_HOURLY_RATE_EUR, [Validators.required, Validators.min(0)]],
    modelingHours: [DEFAULT_MODELING_HOURS, [Validators.required, Validators.min(0)]],
    extraWorkFeePercent: [DEFAULT_EXTRA_WORK_FEE_PERCENT, [Validators.required, Validators.min(0), Validators.max(100)]],
    profitMarginPercent: [DEFAULT_PROFIT_MARGIN_PERCENT, [Validators.required, Validators.min(0)]]
  });
  readonly filamentLines = this.#formBuilder.array<FilamentLineForm>([]);
  readonly priceModeOptions: readonly FilamentPriceModeOption[] = [
    { value: 'WEIGHTED_AVERAGE', label: 'Ø Schnitt' },
    { value: 'PAID', label: 'Bezahlt' },
    { value: 'FIXED', label: 'Fester Preis' }
  ] as const;

  constructor() {
    this.syncPrinterSelection();
    this.syncSelectedFilamentLines();

    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.bumpFormRevision());
    this.filamentLines.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.bumpFormRevision());

    effect(() => {
      const result = this.liveResult();
      if (!result) {
        this.resultAnnouncementText.set('');
        this.clearPendingAnnouncement();
        return;
      }

      this.scheduleResultAnnouncement(result.roundedFinalPriceEur);
    });

    void this.initialize();
  }

  async savePrintProject(): Promise<void> {
    this.form.markAllAsTouched();
    this.filamentLines.markAllAsTouched();

    if (!this.hasActivePrinters() || !this.hasActiveFilaments() || this.form.invalid || this.filamentLines.length === 0) {
      return;
    }

    if (this.hasInvalidFilamentLines()) {
      return;
    }

    const printer = this.activePrinters().find((entry) => entry.id === this.form.controls.printerId.value);
    if (!printer) {
      return;
    }

    const calculationInput = this.mapToCalculationInput(printer);
    if (!calculationInput) {
      return;
    }

    const calculationResult = this.liveResult();
    if (!calculationResult) {
      return;
    }

    const settings = this.#settingsService.settings();
    await this.#calculationService.savePlannedCalculation({
      projectName: this.form.controls.projectName.value,
      customerId: this.selectedCustomerId(),
      printerSnapshot: {
        id: printer.id,
        name: printer.name,
        powerWatts: printer.powerWatts,
        purchasePriceEur: printer.purchasePriceEur,
        lifetimeHours: printer.lifetimeHours,
        electricityPriceEurKwh: typeof settings['electricityPriceEurKwh'] === 'number' ? settings['electricityPriceEurKwh'] : 0.32,
        annualBaseFeeEur: typeof settings['annualBaseFeeEur'] === 'number' ? settings['annualBaseFeeEur'] : 0,
        note: printer.note
      },
      filamentSnapshots: this.buildFilamentSnapshots(),
      calculationInput,
      calculationResult
    });
    this.saveFeedback.set('Druckprojekt gespeichert – jetzt im Bestand verfügbar.');
  }

  async onPrinterChange(printerId: string): Promise<void> {
    if (!printerId) {
      return;
    }

    await this.#settingsService.setSetting(LAST_USED_PRINTER_SETTING_KEY, printerId);
  }

  getError(field: CalculationFieldName): string | null {
    const control = this.form.controls[field];
    if (!control.touched || !control.invalid) {
      return null;
    }

    if (control.hasError('required')) {
      switch (field) {
        case 'projectName':
          return 'Bitte Projektnamen eingeben';
        case 'printerId':
          return 'Bitte Drucker auswählen';
        case 'printHours':
          return 'Bitte Druckzeit eingeben';
      }
    }

    if (control.hasError('min')) {
      switch (field) {
        case 'printHours':
          return 'Druckzeit muss größer als 0 sein';
        default:
          return 'Ungültiger Wert';
      }
    }

    if (control.hasError('maxlength') && field === 'projectName') {
      return 'Projektname ist zu lang';
    }

    return null;
  }

  private async initialize(): Promise<void> {
    try {
      await Promise.all([
        this.#filamentService.refresh(),
        this.#printerService.refresh(),
        this.#customerService.refresh(),
        this.#settingsService.refresh()
      ]);
      this.syncPrinterSelection();
      this.syncSelectedFilamentLines();
      this.applySettingsDefaults();
    } catch (error) {
      if (error instanceof Error) {
        this.loadError.set(error.message);
      } else {
        this.loadError.set('Daten konnten nicht geladen werden');
      }
    }
  }

  private applySettingsDefaults(): void {
    const settings = this.#settingsService.settings();
    const profitMargin = settings['defaultProfitMarginPercent'];
    const modelingHourlyRate = settings['defaultModelingCostEur'];
    const extraWorkFee = settings['defaultExtraWorkFeePercent'];

    this.form.patchValue(
      {
        profitMarginPercent: typeof profitMargin === 'number' ? profitMargin : DEFAULT_PROFIT_MARGIN_PERCENT,
        // The "Modellierung" default is now an hourly rate (€/h); hours start at 0.
        modelingHourlyRateEur: typeof modelingHourlyRate === 'number' ? modelingHourlyRate : DEFAULT_MODELING_HOURLY_RATE_EUR,
        extraWorkFeePercent: typeof extraWorkFee === 'number' ? extraWorkFee : DEFAULT_EXTRA_WORK_FEE_PERCENT
      },
      { emitEvent: false }
    );
  }

  /**
   * Keeps the printer control aligned with active records and persisted defaults.
   */
  private syncPrinterSelection(): void {
    const activePrinters = this.activePrinters();
    if (activePrinters.length === 0) {
      this.form.controls.printerId.disable({ emitEvent: false });
      this.form.controls.printerId.setValue('', { emitEvent: false });
      return;
    }

    this.form.controls.printerId.enable({ emitEvent: false });

    const savedPrinterId = this.#settingsService.settings()[LAST_USED_PRINTER_SETTING_KEY];
    const preferredId = typeof savedPrinterId === 'string' ? savedPrinterId : undefined;
    let selectedPrinterId = activePrinters[0].id;
    if (preferredId && activePrinters.some((printer) => printer.id === preferredId)) {
      selectedPrinterId = preferredId;
    }
    this.form.controls.printerId.setValue(selectedPrinterId, { emitEvent: false });
  }

  toggleFilamentSelection(filamentId: string): void {
    const index = this.filamentLines.controls.findIndex((line) => line.controls.filamentId.value === filamentId);
    if (index >= 0) {
      this.filamentLines.removeAt(index);
      this.bumpFormRevision();
      return;
    }

    this.filamentLines.push(this.createFilamentLine(filamentId));
    this.bumpFormRevision();
  }

  isFilamentSelected(filamentId: string): boolean {
    return this.filamentLines.controls.some((line) => line.controls.filamentId.value === filamentId);
  }

  filamentNameForLine(index: number): string {
    const filamentId = this.filamentLines.at(index).controls.filamentId.value;
    return this.activeFilaments().find((filament) => filament.id === filamentId)?.name ?? 'Filament';
  }

  filamentColorForLine(index: number): string {
    const filamentId = this.filamentLines.at(index).controls.filamentId.value;
    return this.activeFilaments().find((filament) => filament.id === filamentId)?.colorHex ?? '#cccccc';
  }

  priceModeForLine(index: number): FilamentPriceMode {
    return this.normalizePriceMode(this.filamentLines.at(index).controls.priceMode.value);
  }

  onPriceModeChange(index: number, rawMode: string): void {
    const mode = this.normalizePriceMode(rawMode);
    const line = this.filamentLines.at(index);
    line.controls.priceMode.setValue(mode);
    if (mode === 'FIXED') {
      // Prefill the fixed price (default 0) from the selected filament's own
      // fixed price so the user starts from a sensible value instead of blank.
      if (Number(line.controls.fixedPriceEurG.value) <= 0) {
        const filament = this.activeFilaments().find((entry) => entry.id === line.controls.filamentId.value);
        const presetPrice = filament?.fixedPriceEurG ?? 0;
        if (presetPrice > 0) {
          line.controls.fixedPriceEurG.setValue(presetPrice);
        }
      }
    } else {
      line.controls.fixedPriceEurG.setValue(0);
      line.controls.fixedPriceEurG.markAsUntouched();
    }
    this.bumpFormRevision();
  }

  filamentLineError(index: number, field: 'grams' | 'fixedPriceEurG'): string | null {
    const line = this.filamentLines.at(index);
    const control = line.controls[field];
    if (!control.touched) {
      return null;
    }

    if (field === 'grams' && control.invalid) {
      return 'Filamentmenge muss größer als 0 sein';
    }

    if (field === 'fixedPriceEurG' && this.priceModeForLine(index) === 'FIXED' && this.isFixedPriceInvalid(line)) {
      return 'Bitte gültigen Fixpreis eingeben';
    }

    return null;
  }

  isSaveDisabled(): boolean {
    return (
      this.form.invalid ||
      !this.hasActivePrinters() ||
      !this.hasActiveFilaments() ||
      this.filamentLines.length === 0 ||
      this.hasInvalidFilamentLines()
    );
  }

  totalFilamentGrams(): number {
    return this.sumFilamentLineGrams(this.filamentLines);
  }

  filamentTotalsStateText(): string {
    return this.hasInvalidFilamentLines() || this.filamentLines.length === 0 ? '⚠ Eingaben prüfen' : '✓ Eingaben gültig';
  }

  trackByFilamentId(index: number, filament: FilamentRecord): string {
    return filament.id;
  }

  /**
   * Formats EUR values for German UI labels in the result card.
   */
  formatCurrency(value: number): string {
    return this.#currencyFormatter.format(value);
  }

  /** Header subtitle, e.g. "Prusa MK4 · noch nicht gespeichert". */
  headerSubtitle(): string {
    const printer = this.activePrinters().find((entry) => entry.id === this.form.controls.printerId.value);
    return printer ? `${printer.name} · noch nicht gespeichert` : 'Noch nicht gespeichert';
  }

  totalPieces(): number {
    const plates = Math.max(1, Number(this.form.controls.printQuantity.value) || 1);
    const ppp = Math.max(1, Number(this.form.controls.partsPerPlate.value) || 1);
    return plates * ppp;
  }

  perUnit(total: number): number {
    return total / this.totalPieces();
  }

  /** Modelling cost for the whole job: hourly rate × hours (0 when a model already exists). */
  modelingCostEur(): number {
    if (this.form.controls.modelExists.value) {
      return 0;
    }

    const rate = Number(this.form.controls.modelingHourlyRateEur.value);
    const hours = Number(this.form.controls.modelingHours.value);
    if (!Number.isFinite(rate) || !Number.isFinite(hours) || rate < 0 || hours < 0) {
      return 0;
    }

    return rate * hours;
  }

  totalForAll(perPlateCost: number): number {
    return perPlateCost * this.totalPieces();
  }

  /**
   * Material cost for a single filament line (grams × resolved €/g).
   *
   * Computed independently of the full-form validity so the cost column updates
   * the moment a gram amount is entered — even before the project name, printer
   * or print time are filled in. Returns null when no price can be resolved yet.
   */
  lineMaterialCostEur(index: number): number | null {
    const line = this.filamentLines.at(index);
    if (!line) {
      return null;
    }

    const grams = Number(line.controls.grams.value);
    if (!Number.isFinite(grams) || grams <= 0) {
      return null;
    }

    const filament = this.activeFilaments().find((entry) => entry.id === line.controls.filamentId.value);
    if (!filament) {
      return null;
    }

    const mode = this.normalizePriceMode(line.controls.priceMode.value);
    try {
      const pricePerGram =
        mode === 'FIXED'
          ? Number(line.controls.fixedPriceEurG.value)
          : this.#filamentService.pricePerGramForMode(filament, mode);
      if (!Number.isFinite(pricePerGram) || pricePerGram <= 0) {
        return null;
      }

      return grams * pricePerGram;
    } catch {
      return null;
    }
  }

  /** Sum of all resolvable per-line material costs (for the table footer). */
  totalMaterialCostEur(): number {
    return this.filamentLines.controls.reduce(
      (sum, _line, index) => sum + (this.lineMaterialCostEur(index) ?? 0),
      0
    );
  }

  private createFilamentLine(filamentId: string): FilamentLineForm {
    const rawMode = this.#settingsService.settings()['defaultPriceMode'];
    const defaultMode = this.normalizePriceMode(typeof rawMode === 'string' ? rawMode : 'WEIGHTED_AVERAGE');

    return this.#formBuilder.nonNullable.group({
      filamentId: [filamentId, [Validators.required]],
      grams: [0, [Validators.required, Validators.min(0.0001)]],
      priceMode: [defaultMode, [Validators.required]],
      fixedPriceEurG: [0, [Validators.min(0.0001)]]
    });
  }

  private hasInvalidFilamentLines(): boolean {
    return this.filamentLines.controls.some((line) => line.controls.grams.invalid || this.isFixedPriceInvalid(line));
  }

  private isFixedPriceInvalid(line: FilamentLineForm): boolean {
    return this.normalizePriceMode(line.controls.priceMode.value) === 'FIXED' && Number(line.controls.fixedPriceEurG.value) <= 0;
  }

  /**
   * Keeps chip selection and line rows in sync with active filament records.
   */
  private syncSelectedFilamentLines(): void {
    const activeFilamentIds = new Set(this.activeFilaments().map((filament) => filament.id));
    // Removing orphaned rows here keeps the chip state recoverable after service refreshes.
    for (let index = this.filamentLines.length - 1; index >= 0; index -= 1) {
      if (!activeFilamentIds.has(this.filamentLines.at(index).controls.filamentId.value)) {
        this.filamentLines.removeAt(index);
      }
    }
  }

  /**
   * Normalizes raw option values to known enum values used by storage/contracts.
   */
  private normalizePriceMode(rawMode: string): FilamentPriceMode {
    if (rawMode === 'PAID' || rawMode === 'FIXED') {
      return rawMode;
    }

    return 'WEIGHTED_AVERAGE';
  }

  /**
   * Totals all selected filament grams for live material feedback in the form.
   */
  private sumFilamentLineGrams(lines: FormArray<FilamentLineForm>): number {
    return lines.controls.reduce((sum, line) => {
      const grams = Number(line.controls.grams.value);
      if (Number.isFinite(grams) && grams > 0) {
        return sum + grams;
      }

      return sum;
    }, 0);
  }

  private bumpFormRevision(): void {
    this.#formRevision.update((revision) => revision + 1);
  }

  private selectedCustomerId(): string | undefined {
    const customerId = this.form.controls.customerId.value.trim();
    return customerId ? customerId : undefined;
  }

  private computeLiveResult(): CalculationResult | null {
    if (this.form.invalid || this.hasInvalidFilamentLines() || this.filamentLines.length === 0) {
      return null;
    }

    const printer = this.activePrinters().find((entry) => entry.id === this.form.controls.printerId.value);
    if (!printer) {
      return null;
    }

    const input = this.mapToCalculationInput(printer);
    if (!input) {
      return null;
    }

    try {
      return calculate(input);
    } catch {
      return null;
    }
  }

  private mapToCalculationInput(printer: {
    powerWatts: number;
    purchasePriceEur: number;
    lifetimeHours: number;
  }): CalculationInput | null {
    const settings = this.#settingsService.settings();
    const electricityPriceEurKwh = typeof settings['electricityPriceEurKwh'] === 'number' ? settings['electricityPriceEurKwh'] : 0.32;
    const annualBaseFeeEur = typeof settings['annualBaseFeeEur'] === 'number' ? settings['annualBaseFeeEur'] : 0;
    const filamentLines = this.filamentLines.controls.map((line) => {
      const filament = this.activeFilaments().find((entry) => entry.id === line.controls.filamentId.value);
      if (!filament) {
        return null;
      }

      return {
        gramsUsed: Number(line.controls.grams.value),
        priceMode: this.normalizePriceMode(line.controls.priceMode.value),
        fixedPriceEurG: Number(line.controls.fixedPriceEurG.value),
        purchases: filament.purchases ?? []
      };
    });

    if (filamentLines.some((line) => line === null)) {
      return null;
    }

    return {
      filamentLines: filamentLines.filter((line): line is NonNullable<typeof line> => line !== null),
      printMinutes: Number(this.form.controls.printHours.value) * 60,
      printQuantity: Number(this.form.controls.printQuantity.value) * Number(this.form.controls.partsPerPlate.value),
      partsPerPlate: Number(this.form.controls.partsPerPlate.value),
      extraWorkFeePercent: Number(this.form.controls.extraWorkFeePercent.value),
      modelExists: this.form.controls.modelExists.value,
      modelingCostEur: this.modelingCostEur(),
      profitMarginPercent: Number(this.form.controls.profitMarginPercent.value),
      powerWatts: printer.powerWatts,
      electricityPriceEurKwh,
      annualBaseFeeEur,
      purchasePriceEur: printer.purchasePriceEur,
      lifetimeHours: printer.lifetimeHours
    };
  }

  /**
   * Builds a detached snapshot list for persisted filament line history.
   */
  private buildFilamentSnapshots(): CalculationFilamentLineSnapshot[] {
    return this.filamentLines.controls
      .map((line): CalculationFilamentLineSnapshot | null => {
        const filament = this.activeFilaments().find((entry) => entry.id === line.controls.filamentId.value);
        if (!filament) {
          return null;
        }

        const selectedPriceMode = this.normalizePriceMode(line.controls.priceMode.value);
        const selectedPricePerGramEur = this.resolvePricePerGramForSnapshot(line, filament, selectedPriceMode);

        return {
          filamentId: filament.id,
          filamentName: filament.name,
          gramsUsed: Number(line.controls.grams.value),
          selectedPriceMode,
          selectedPricePerGramEur,
          filamentSnapshot: {
            id: filament.id,
            name: filament.name,
            type: filament.type,
            colorHex: filament.colorHex,
            manufacturer: filament.manufacturer,
            rollWeightG: filament.rollWeightG,
            remainingG: filament.remainingG,
            purchases: filament.purchases ? filament.purchases.map((purchase) => ({ ...purchase })) : [],
            multiColorSurchargeEurKg: filament.multiColorSurchargeEurKg,
            fixedPriceEurG: filament.fixedPriceEurG
          }
        };
      })
      .filter((entry): entry is CalculationFilamentLineSnapshot => entry !== null);
  }

  /**
   * Resolves persisted price-per-gram value for the selected price mode.
   */
  private resolvePricePerGramForSnapshot(
    line: FilamentLineForm,
    filament: FilamentRecord,
    selectedPriceMode: FilamentPriceMode
  ): number {
    if (selectedPriceMode === 'FIXED') {
      return Number(line.controls.fixedPriceEurG.value);
    }

    return this.#filamentService.pricePerGramForMode(filament, selectedPriceMode);
  }

  /**
   * Announces rounded price updates with a debounce to prevent screen-reader spam while typing.
   */
  private scheduleResultAnnouncement(roundedFinalPriceEur: number): void {
    this.clearPendingAnnouncement();
    this.#announcementTimeoutId = setTimeout(() => {
      this.resultAnnouncementText.set(`Preis aktualisiert: ${this.formatCurrency(roundedFinalPriceEur)}`);
      this.#announcementTimeoutId = null;
    }, RESULT_ANNOUNCEMENT_DEBOUNCE_MS);
  }

  private clearPendingAnnouncement(): void {
    if (this.#announcementTimeoutId !== null) {
      clearTimeout(this.#announcementTimeoutId);
      this.#announcementTimeoutId = null;
    }
  }
}
