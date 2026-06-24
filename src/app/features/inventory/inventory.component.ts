import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

import { CalculationDetailView, CalculationService } from '../../core/calculations/calculation.service';
import { CustomerService } from '../../core/customers/customer.service';
import { CalculationRecord } from '../../domain/models/storage.models';

type InventoryArea = 'drucke' | 'teile';
type DruckeFilter = 'Alle' | 'Auf Lager' | 'Teilweise' | 'Vollständig' | 'Verschenkt';
type InventoryCardStatus = 'in-stock' | 'partial' | 'complete' | 'gifted';

interface InventoryCardViewModel {
  id: string;
  projectName: string;
  timesPrinted: number;
  timesSold: number;
  timesGifted: number;
  remainingCount: number;
  roundedPriceEur: number;
  updatedAtLabel: string;
  status: InventoryCardStatus;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryComponent {
  readonly #calculationService = inject(CalculationService);
  readonly #customerService = inject(CustomerService);
  readonly #formBuilder = inject(FormBuilder);
  readonly #router = inject(Router, { optional: true });
  readonly #route = inject(ActivatedRoute, { optional: true });
  #activeDetailRequest = 0;

  readonly savedCalculations = this.#calculationService.activeSavedCalculations;
  readonly inventoryAreas: InventoryArea[] = ['drucke', 'teile'];
  readonly druckeFilters: DruckeFilter[] = ['Alle', 'Auf Lager', 'Teilweise', 'Vollständig', 'Verschenkt'];
  readonly activeArea = signal<InventoryArea>('drucke');
  readonly activeDruckeFilter = signal<DruckeFilter>('Alle');
  readonly actionFeedback = signal<string | null>(null);
  readonly detailError = signal<string | null>(null);
  readonly #routeDetailId = signal<string | null>(null);
  readonly #localDetailId = signal<string | null>(null);
  readonly selectedDetail = signal<CalculationDetailView | null>(null);
  readonly druckeCards = computed(() => this.savedCalculations().map((record) => mapInventoryCard(record)));
  readonly visibleDruckeCards = computed(() =>
    this.druckeCards().filter((card) => matchesDruckeFilter(card, this.activeDruckeFilter()))
  );
  readonly totalPrinted = computed(() => this.druckeCards().reduce((sum, card) => sum + card.timesPrinted, 0));
  readonly totalSold = computed(() => this.druckeCards().reduce((sum, card) => sum + card.timesSold, 0));
  readonly totalInStock = computed(() => this.druckeCards().reduce((sum, card) => sum + card.remainingCount, 0));
  readonly activeDetailId = computed(() => this.#routeDetailId() ?? this.#localDetailId());
  readonly detailFilamentSummary = computed(() => {
    const detail = this.selectedDetail();
    if (!detail) {
      return '-';
    }

    return detail.record.filamentSnapshots.map((line) => line.filamentName).join(', ') || '-';
  });

  readonly activeCustomers = this.#customerService.activeCustomers;
  readonly showSaleForm = signal<boolean>(false);

  readonly saleForm = this.#formBuilder.nonNullable.group({
    customerId: [''],
    priceEur: [0, [Validators.required, Validators.min(0)]],
    gifted: [false],
    date: [this.getLocalDateString(), [Validators.required]],
    note: ['', [Validators.maxLength(500)]]
  });

  constructor() {
    void this.#calculationService.refresh();
    void this.#customerService.refresh();

    this.saleForm.controls.gifted.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((gifted) => {
        const priceControl = this.saleForm.controls.priceEur;
        if (gifted) {
          priceControl.setValue(0);
          priceControl.disable();
        } else {
          priceControl.enable();
        }
      });

    if (this.#route) {
      this.#route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
        this.#routeDetailId.set(params.get('detail'));
      });
    }

    effect(() => {
      void this.loadDetail(this.activeDetailId());
    });
  }

  selectArea(area: InventoryArea): void {
    this.activeArea.set(area);
  }

  selectDruckeFilter(filter: DruckeFilter): void {
    this.activeDruckeFilter.set(filter);
  }

  isAreaActive(area: InventoryArea): boolean {
    return this.activeArea() === area;
  }

  isDruckeFilterActive(filter: DruckeFilter): boolean {
    return this.activeDruckeFilter() === filter;
  }

  async recordPrintOccurrence(calculationId: string): Promise<void> {
    const confirmed = window.confirm('Druck verbuchen?');
    if (!confirmed) {
      return;
    }

    this.actionFeedback.set(null);
    try {
      const result = await this.#calculationService.recordPrintOccurrence(calculationId);
      this.actionFeedback.set(result.warning ?? 'Druck verbucht.');
    } catch (error) {
      if (error instanceof Error) {
        this.actionFeedback.set(error.message);
      } else {
        this.actionFeedback.set('Druck konnte nicht verbucht werden.');
      }
    }
  }

  async openDetail(calculationId: string): Promise<void> {
    if (this.#router && this.#route) {
      await this.#router.navigate([], {
        relativeTo: this.#route,
        queryParams: { detail: calculationId },
        queryParamsHandling: 'merge'
      });
      return;
    }

    this.#localDetailId.set(calculationId);
  }

  async closeDetail(): Promise<void> {
    if (!this.activeDetailId()) {
      return;
    }

    if (this.#router && this.#route) {
      await this.#router.navigate([], {
        relativeTo: this.#route,
        queryParams: { detail: null },
        queryParamsHandling: 'merge'
      });
      return;
    }

    this.#localDetailId.set(null);
  }

  onCardQuickAction(event: MouseEvent, calculationId: string): void {
    event.stopPropagation();
    void this.recordPrintOccurrence(calculationId);
  }

  detailPrintDurationLabel(): string {
    const detail = this.selectedDetail();
    if (!detail) {
      return '-';
    }

    return formatMinutesAsHours(detail.record.calculationInput.printMinutes);
  }

  formatMoney(value: number): string {
    if (!Number.isFinite(value)) {
      return '-';
    }

    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  /**
   * Toggles the visibility of the transaction form (sale or gift recording).
   * Resets active feedback alerts.
   */
  toggleSaleForm(): void {
    this.showSaleForm.update((show) => !show);
    this.actionFeedback.set(null);
  }

  /**
   * Submits the sale/gift form data to persistence service, updating owning inventory counts.
   * Keeps filament stock deduction untouched per AD-6 architecture guardrails.
   *
   * @param calculationId The unique ID of the calculation being sold/gifted.
   */
  async submitSale(calculationId: string): Promise<void> {
    if (this.saleForm.invalid) {
      this.saleForm.markAllAsTouched();
      return;
    }

    const rawValue = this.saleForm.getRawValue();
    this.actionFeedback.set(null);

    try {
      await this.#calculationService.recordSale({
        calculationId,
        customerId: rawValue.customerId || undefined,
        date: rawValue.date,
        priceEur: rawValue.gifted ? 0 : rawValue.priceEur,
        gifted: rawValue.gifted,
        note: rawValue.note || undefined
      });

      this.actionFeedback.set('Eintrag erfolgreich gespeichert.');
      this.showSaleForm.set(false);
      this.saleForm.reset({
        customerId: '',
        priceEur: 0,
        gifted: false,
        date: this.getLocalDateString(),
        note: ''
      });

      // Reload active detail to refresh lists and counters
      await this.loadDetail(calculationId);
    } catch (error) {
      if (error instanceof Error) {
        this.actionFeedback.set(error.message);
      } else {
        this.actionFeedback.set('Ein unerwarteter Fehler ist aufgetreten.');
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    if (this.showSaleForm()) {
      this.toggleSaleForm();
      return;
    }
    if (!this.activeDetailId()) {
      return;
    }

    void this.closeDetail();
  }

  private getLocalDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async loadDetail(calculationId: string | null): Promise<void> {
    this.showSaleForm.set(false);
    this.saleForm.reset({
      customerId: '',
      priceEur: 0,
      gifted: false,
      date: this.getLocalDateString(),
      note: ''
    });

    if (!calculationId) {
      this.selectedDetail.set(null);
      this.detailError.set(null);
      return;
    }

    const requestId = ++this.#activeDetailRequest;
    const detail = await this.#calculationService.loadCalculationDetail(calculationId);
    if (requestId !== this.#activeDetailRequest) {
      return;
    }

    this.selectedDetail.set(detail);
    this.detailError.set(detail ? null : 'Detailansicht konnte nicht geladen werden.');
  }
}

/**
 * Maps saved calculation records into a stable inventory card model for the
 * Drucke list so filter and display behavior can evolve without template churn.
 */
function mapInventoryCard(record: CalculationRecord): InventoryCardViewModel {
  const timesSold = readCounterField(record, 'timesSold');
  const timesGifted = readCounterField(record, 'timesGifted');
  const timesPrinted = record.timesPrinted ?? 0;
  return {
    id: record.id,
    projectName: record.projectName,
    timesPrinted,
    timesSold,
    timesGifted,
    remainingCount: Math.max(timesPrinted - timesSold - timesGifted, 0),
    roundedPriceEur: Math.round(record.calculationResult.roundedFinalPriceEur),
    updatedAtLabel: formatInventoryDate(record.updatedAt),
    status: classifyInventoryStatus(timesPrinted, timesSold, timesGifted)
  };
}

/**
 * Applies the one-active Drucke filter chip logic and returns whether a card
 * belongs to the selected inventory subset.
 */
function matchesDruckeFilter(card: InventoryCardViewModel, filter: DruckeFilter): boolean {
  switch (filter) {
    case 'Auf Lager':
      return card.status === 'in-stock';
    case 'Teilweise':
      return card.status === 'partial';
    case 'Vollständig':
      return card.status === 'complete';
    case 'Verschenkt':
      return card.status === 'gifted';
    default:
      return true;
  }
}

function classifyInventoryStatus(timesPrinted: number, timesSold: number, timesGifted: number): InventoryCardStatus {
  const distributed = timesSold + timesGifted;
  if (distributed === 0) {
    return 'in-stock';
  }
  if (timesGifted > 0 && timesSold === 0 && distributed >= timesPrinted) {
    return 'gifted';
  }
  if (distributed >= timesPrinted) {
    return 'complete';
  }
  return 'partial';
}

function readCounterField(record: CalculationRecord, key: 'timesSold' | 'timesGifted'): number {
  const value = (record as unknown as Record<string, unknown>)[key];
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

function formatInventoryDate(value: string): string {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.valueOf())) {
    return '-';
  }
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(parsedDate);
}

function formatMinutesAsHours(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return '-';
  }

  const hours = Math.round((minutes / 60) * 10) / 10;
  return Number.isInteger(hours) ? `${hours} Std.` : `${hours.toString().replace('.', ',')} Std.`;
}
