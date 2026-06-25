import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

import { CalculationDetailView, CalculationService } from '../../core/calculations/calculation.service';
import { CustomerService } from '../../core/customers/customer.service';
import { CalculationRecord } from '../../domain/models/storage.models';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

type InventoryArea = 'projekte' | 'teile';
type DruckeFilter = 'Alle' | 'Auf Lager' | 'Vollständig' | 'Verschenkt';
type InventoryCardStatus = 'in-stock' | 'complete' | 'gifted';

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
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent],
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
  readonly inventoryAreas: InventoryArea[] = ['projekte', 'teile'];
  readonly druckeFilters: DruckeFilter[] = ['Alle', 'Auf Lager', 'Vollständig', 'Verschenkt'];
  readonly activeArea = signal<InventoryArea>('projekte');
  readonly activeDruckeFilter = signal<DruckeFilter>('Alle');
  /** Preset increments offered as dezente Aktionskreise on each card. */
  readonly recordSteps = [1, 5, 10] as const;
  /** Card currently animating after a record (slides to the front). */
  readonly recordedCardId = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly actionFeedback = signal<string | null>(null);
  readonly detailError = signal<string | null>(null);
  readonly #routeDetailId = signal<string | null>(null);
  readonly #localDetailId = signal<string | null>(null);
  readonly selectedDetail = signal<CalculationDetailView | null>(null);
  readonly druckeCards = computed(() => this.savedCalculations().map((record) => mapInventoryCard(record)));
  /** Kalkulationen, die mindestens einmal gedruckt wurden → erscheinen als Teile. */
  readonly printedCards = computed(() =>
    this.druckeCards().filter((card) => card.timesPrinted > 0)
  );
  readonly visibleDruckeCards = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    return this.druckeCards().filter(
      (card) =>
        matchesDruckeFilter(card, this.activeDruckeFilter()) &&
        (!term || card.projectName.toLowerCase().includes(term))
    );
  });
  readonly headerSubtitle = computed(() => {
    const count = this.savedCalculations().length;
    return `${count} Druck${count !== 1 ? 'e' : ''}`;
  });
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

  async recordPrintOccurrence(calculationId: string, amount = 1): Promise<void> {
    // Recording a print increments the count directly — no modal. The action
    // only bumps a counter (and deducts stock), so a confirmation adds friction
    // without protecting anything irreversible.
    const count = Math.max(1, Math.floor(amount));
    this.actionFeedback.set(null);
    try {
      let warning: string | undefined;
      for (let i = 0; i < count; i += 1) {
        const result = await this.#calculationService.recordPrintOccurrence(calculationId);
        warning = result.warning ?? warning;
      }
      // Highlight the just-recorded card; the service re-sorts newest-first so it
      // also slides to the front of the list (animated via the .recorded class).
      this.flagRecorded(calculationId);
      this.actionFeedback.set(warning ?? (count === 1 ? 'Druck verbucht.' : `${count} Drucke verbucht.`));
    } catch (error) {
      if (error instanceof Error) {
        this.actionFeedback.set(error.message);
      } else {
        this.actionFeedback.set('Druck konnte nicht verbucht werden.');
      }
    }
  }

  /** Records a specific step amount from a card action circle. */
  onCardStep(event: MouseEvent, calculationId: string, amount: number): void {
    event.stopPropagation();
    void this.recordPrintOccurrence(calculationId, amount);
  }

  /** Opens a lightweight number prompt for a custom print quantity. */
  recordCustomQuantity(event: MouseEvent, calculationId: string): void {
    event.stopPropagation();
    const input = window.prompt('Wie viele Drucke verbuchen?', '1');
    if (input === null) {
      return;
    }

    const amount = Math.floor(Number(input.replace(',', '.')));
    if (!Number.isFinite(amount) || amount <= 0) {
      this.actionFeedback.set('Bitte eine gültige Anzahl eingeben.');
      return;
    }

    void this.recordPrintOccurrence(calculationId, amount);
  }

  private flagRecorded(calculationId: string): void {
    this.recordedCardId.set(calculationId);
    setTimeout(() => {
      if (this.recordedCardId() === calculationId) {
        this.recordedCardId.set(null);
      }
    }, 600);
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
  // Partially distributed prints still have remaining stock — treat them as
  // "Auf Lager" rather than a separate "Teilweise" status.
  return 'in-stock';
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
