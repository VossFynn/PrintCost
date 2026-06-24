import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { BackupService } from '../../core/backup/backup.service';
import { CalculationService } from '../../core/calculations/calculation.service';
import { CustomerPayload, CustomerService } from '../../core/customers/customer.service';
import { FilamentService } from '../../core/filaments/filament.service';
import { PartService } from '../../core/inventory/part.service';
import { PrinterPayload, PrinterService } from '../../core/printers/printer.service';
import { SettingsService } from '../../core/settings/settings.service';
import { BackupFormat } from '../../domain/models/storage.models';

type PrinterFormFieldName = 'name' | 'powerWatts' | 'purchasePriceEur' | 'lifetimeHours' | 'note';

type CustomerFormFieldName = 'name' | 'contact' | 'note';

type SettingsFormFieldName =
  | 'defaultProfitMarginPercent'
  | 'defaultModelingCostEur'
  | 'defaultExtraWorkFeePercent'
  | 'electricityPriceEurKwh'
  | 'annualBaseFeeEur';

/**
 * Manages printer profile CRUD, customer CRUD, calculation defaults, and
 * local data export / import / delete in the "More" area.
 */
@Component({
  selector: 'app-more',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './more.component.html',
  styleUrl: './more.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoreComponent {
  readonly #printerService = inject(PrinterService);
  readonly #customerService = inject(CustomerService);
  readonly #settingsService = inject(SettingsService);
  readonly #backupService = inject(BackupService);
  readonly #filamentService = inject(FilamentService);
  readonly #calculationService = inject(CalculationService);
  readonly #partService = inject(PartService);
  readonly #formBuilder = inject(FormBuilder);

  // --- Printer form ---
  readonly form = this.#formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    powerWatts: [0, [Validators.required, Validators.min(0.0001)]],
    purchasePriceEur: [0, [Validators.required, Validators.min(0.0001)]],
    lifetimeHours: [0, [Validators.required, Validators.min(0.0001)]],
    note: ['', [Validators.maxLength(500)]]
  });

  readonly isSaving = signal(false);
  readonly isDialogOpen = signal(false);
  readonly serviceError = signal<string | null>(null);
  readonly editingPrinterId = signal<string | null>(null);

  readonly printers = this.#printerService.activePrinters;

  // --- Customer form ---
  readonly isSavingCustomer = signal(false);
  readonly isCustomerDialogOpen = signal(false);
  readonly customerServiceError = signal<string | null>(null);
  readonly editingCustomerId = signal<string | null>(null);
  readonly customers = this.#customerService.activeCustomers;

  readonly customerForm = this.#formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    contact: ['', [Validators.maxLength(160)]],
    note: ['', [Validators.maxLength(500)]]
  });

  // --- Settings form (5.1) ---
  readonly settingsForm = this.#formBuilder.nonNullable.group({
    defaultPriceMode: ['FIXED', [Validators.required]],
    defaultProfitMarginPercent: [0, [Validators.required, Validators.min(0), Validators.max(500)]],
    defaultModelingCostEur: [0, [Validators.required, Validators.min(0), Validators.max(9999)]],
    defaultExtraWorkFeePercent: [0, [Validators.required, Validators.min(0), Validators.max(200)]],
    electricityPriceEurKwh: [0.32, [Validators.required, Validators.min(0.0001)]],
    annualBaseFeeEur: [0, [Validators.required, Validators.min(0)]]
  });

  readonly isSavingSettings = signal(false);
  readonly settingsSaveError = signal<string | null>(null);
  readonly settingsSaveSuccess = signal(false);

  readonly priceModeOptions = [
    { value: 'WEIGHTED_AVERAGE', label: 'Ø Schnitt' },
    { value: 'PAID', label: 'Bezahlt' },
    { value: 'FIXED', label: 'Fester Preis' }
  ] as const;

  // --- Export (5.2) ---
  readonly isExporting = signal(false);
  readonly exportError = signal<string | null>(null);
  readonly exportSuccess = signal(false);

  // --- Import (5.3) ---
  readonly isImporting = signal(false);
  readonly importError = signal<string | null>(null);
  readonly importSuccess = signal(false);
  readonly pendingBackup = signal<BackupFormat | null>(null);
  readonly showImportConfirm = signal(false);

  // --- Delete all data (5.4) ---
  readonly isDeletingData = signal(false);
  readonly deleteDataError = signal<string | null>(null);
  readonly deleteDataSuccess = signal(false);
  readonly showDeleteConfirm = signal(false);

  constructor() {
    void Promise.all([
      this.#printerService.refresh(),
      this.#customerService.refresh(),
      this.#settingsService.refresh()
    ]);

    effect(() => {
      const settings = this.#settingsService.settings();
      if (!this.settingsForm.dirty) {
        this.settingsForm.patchValue(
          {
            defaultPriceMode: (settings['defaultPriceMode'] as string) || 'FIXED',
            defaultProfitMarginPercent: (settings['defaultProfitMarginPercent'] as number) ?? 0,
            defaultModelingCostEur: (settings['defaultModelingCostEur'] as number) ?? 0,
            defaultExtraWorkFeePercent: (settings['defaultExtraWorkFeePercent'] as number) ?? 0,
            electricityPriceEurKwh: (settings['electricityPriceEurKwh'] as number) ?? 0.32,
            annualBaseFeeEur: (settings['annualBaseFeeEur'] as number) ?? 0
          },
          { emitEvent: false }
        );
      }
    });
  }

  // --- Settings save ---

  async saveSettings(): Promise<void> {
    this.settingsForm.markAllAsTouched();
    this.settingsSaveError.set(null);

    if (this.settingsForm.invalid) {
      return;
    }

    this.isSavingSettings.set(true);
    try {
      const values = this.settingsForm.getRawValue();
      await Promise.all([
        this.#settingsService.setSetting('defaultPriceMode', values.defaultPriceMode),
        this.#settingsService.setSetting('defaultProfitMarginPercent', values.defaultProfitMarginPercent),
        this.#settingsService.setSetting('defaultModelingCostEur', values.defaultModelingCostEur),
        this.#settingsService.setSetting('defaultExtraWorkFeePercent', values.defaultExtraWorkFeePercent),
        this.#settingsService.setSetting('electricityPriceEurKwh', values.electricityPriceEurKwh),
        this.#settingsService.setSetting('annualBaseFeeEur', values.annualBaseFeeEur)
      ]);
      this.settingsSaveSuccess.set(true);
      this.settingsForm.markAsPristine();
      setTimeout(() => this.settingsSaveSuccess.set(false), 3000);
    } catch (error) {
      this.settingsSaveError.set(error instanceof Error ? error.message : 'Speichern fehlgeschlagen');
    } finally {
      this.isSavingSettings.set(false);
    }
  }

  getSettingsError(field: SettingsFormFieldName): string | null {
    const control = this.settingsForm.controls[field];
    if (!control.touched || !control.invalid) {
      return null;
    }

    if (control.hasError('min')) {
      switch (field) {
        case 'defaultProfitMarginPercent':
          return 'Gewinn darf nicht negativ sein';
        case 'defaultModelingCostEur':
          return 'Kosten dürfen nicht negativ sein';
        case 'defaultExtraWorkFeePercent':
          return 'Aufschlag darf nicht negativ sein';
        case 'electricityPriceEurKwh':
          return 'Strompreis muss größer als 0 sein';
        case 'annualBaseFeeEur':
          return 'Grundgebühr darf nicht negativ sein';
      }
    }

    if (control.hasError('max')) {
      switch (field) {
        case 'defaultProfitMarginPercent':
          return 'Gewinn darf höchstens 500 % sein';
        case 'defaultModelingCostEur':
          return 'Kosten dürfen höchstens 9.999 € sein';
        case 'defaultExtraWorkFeePercent':
          return 'Aufschlag darf höchstens 200 % sein';
      }
    }

    return null;
  }

  // --- Export ---

  async triggerExport(): Promise<void> {
    this.exportError.set(null);
    this.exportSuccess.set(false);
    this.isExporting.set(true);
    try {
      await this.#backupService.exportBackup();
      this.exportSuccess.set(true);
      setTimeout(() => this.exportSuccess.set(false), 4000);
    } catch (error) {
      this.exportError.set(error instanceof Error ? `Export fehlgeschlagen: ${error.message}` : 'Export fehlgeschlagen');
    } finally {
      this.isExporting.set(false);
    }
  }

  // --- Import ---

  async onImportFileChange(event: Event): Promise<void> {
    this.importError.set(null);
    this.importSuccess.set(false);

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    input.value = '';
    this.isImporting.set(true);

    try {
      const text = await this.readFileAsText(file);

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        this.importError.set('Ungültige JSON-Datei. Bitte eine gültige Backup-Datei auswählen.');
        return;
      }

      try {
        const validated = this.#backupService.validateBackup(parsed);
        this.pendingBackup.set(validated);
        this.showImportConfirm.set(true);
      } catch (validationError) {
        this.importError.set(
          validationError instanceof Error
            ? `Ungültiges Backup: ${validationError.message}`
            : 'Das Backup ist ungültig und kann nicht importiert werden.'
        );
      }
    } catch (readError) {
      this.importError.set(readError instanceof Error ? readError.message : 'Datei konnte nicht gelesen werden');
    } finally {
      this.isImporting.set(false);
    }
  }

  async confirmImport(): Promise<void> {
    const backup = this.pendingBackup();
    if (!backup) {
      return;
    }

    this.showImportConfirm.set(false);
    this.isImporting.set(true);
    try {
      await this.#backupService.importBackup(backup);
      await this.refreshAllServices();
      this.populateSettingsForm();
      this.pendingBackup.set(null);
      this.importSuccess.set(true);
      setTimeout(() => this.importSuccess.set(false), 4000);
    } catch (error) {
      this.importError.set(error instanceof Error ? `Import fehlgeschlagen: ${error.message}` : 'Import fehlgeschlagen');
    } finally {
      this.isImporting.set(false);
    }
  }

  cancelImport(): void {
    this.showImportConfirm.set(false);
    this.pendingBackup.set(null);
  }

  // --- Delete all data ---

  requestDeleteAllData(): void {
    this.deleteDataError.set(null);
    this.showDeleteConfirm.set(true);
  }

  async confirmDeleteAllData(): Promise<void> {
    this.showDeleteConfirm.set(false);
    this.isDeletingData.set(true);
    try {
      await this.#backupService.clearAllData();
      await this.refreshAllServices();
      this.populateSettingsForm();
      this.deleteDataSuccess.set(true);
      setTimeout(() => this.deleteDataSuccess.set(false), 5000);
    } catch (error) {
      this.deleteDataError.set(error instanceof Error ? `Löschen fehlgeschlagen: ${error.message}` : 'Löschen fehlgeschlagen');
    } finally {
      this.isDeletingData.set(false);
    }
  }

  cancelDeleteData(): void {
    this.showDeleteConfirm.set(false);
  }

  // --- Printer CRUD ---

  async savePrinter(): Promise<void> {
    this.form.markAllAsTouched();
    this.serviceError.set(null);

    if (this.form.invalid) {
      return;
    }

    this.isSaving.set(true);
    try {
      const payload = this.form.getRawValue() as PrinterPayload;
      const editId = this.editingPrinterId();
      // Reuse the same payload path for create and update so the form stays simple.
      if (editId) {
        await this.#printerService.updatePrinter(editId, payload);
      } else {
        await this.#printerService.createPrinter(payload);
      }
      this.resetForm();
      this.closeDialog();
    } catch (error) {
      this.serviceError.set(error instanceof Error ? error.message : 'Speichern fehlgeschlagen');
    } finally {
      this.isSaving.set(false);
    }
  }

  startEdit(printerId: string): void {
    const printer = this.printers().find((candidate) => candidate.id === printerId);
    if (!printer) {
      return;
    }

    this.editingPrinterId.set(printer.id);
    this.form.setValue({
      name: printer.name,
      powerWatts: printer.powerWatts,
      purchasePriceEur: printer.purchasePriceEur,
      lifetimeHours: printer.lifetimeHours,
      note: printer.note ?? ''
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.isDialogOpen.set(true);
  }

  cancelEdit(): void {
    this.resetForm();
    this.closeDialog();
  }

  async requestDelete(printerId: string): Promise<void> {
    // Printer deletion is confirm-first because historical calculations keep a reference to the record.
    const confirmed = window.confirm(
      'Willst du dieses Druckerprofil wirklich löschen? Es bleibt für gespeicherte Kalkulationen erhalten.'
    );

    if (!confirmed) {
      return;
    }

    this.serviceError.set(null);
    try {
      await this.#printerService.softDeletePrinter(printerId);
    } catch (error) {
      this.serviceError.set(error instanceof Error ? error.message : 'Löschen fehlgeschlagen');
    }
  }

  openCreateDialog(): void {
    // Reset edit mode before opening a fresh form so the dialog always starts clean.
    this.serviceError.set(null);
    this.editingPrinterId.set(null);
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.isDialogOpen.set(true);
  }

  closeDialog(): void {
    this.isDialogOpen.set(false);
  }

  // --- Customer CRUD ---

  async saveCustomer(): Promise<void> {
    this.customerForm.markAllAsTouched();
    this.customerServiceError.set(null);
    if (this.customerForm.invalid) {
      return;
    }

    this.isSavingCustomer.set(true);
    try {
      const payload = this.customerForm.getRawValue() as CustomerPayload;
      const editId = this.editingCustomerId();
      if (editId) {
        await this.#customerService.updateCustomer(editId, payload);
      } else {
        await this.#customerService.createCustomer(payload);
      }
      this.resetCustomerForm();
      this.closeCustomerDialog();
    } catch (error) {
      this.customerServiceError.set(error instanceof Error ? error.message : 'Speichern fehlgeschlagen');
    } finally {
      this.isSavingCustomer.set(false);
    }
  }

  openCreateCustomerDialog(): void {
    this.customerServiceError.set(null);
    this.editingCustomerId.set(null);
    this.customerForm.markAsPristine();
    this.customerForm.markAsUntouched();
    this.isCustomerDialogOpen.set(true);
  }

  startEditCustomer(customerId: string): void {
    const customer = this.customers().find((candidate) => candidate.id === customerId);
    if (!customer) {
      return;
    }

    this.editingCustomerId.set(customer.id);
    this.customerForm.setValue({
      name: customer.name,
      contact: customer.contact ?? '',
      note: customer.note ?? ''
    });
    this.customerForm.markAsPristine();
    this.customerForm.markAsUntouched();
    this.isCustomerDialogOpen.set(true);
  }

  cancelCustomerEdit(): void {
    this.resetCustomerForm();
    this.closeCustomerDialog();
  }

  closeCustomerDialog(): void {
    this.isCustomerDialogOpen.set(false);
  }

  async requestDeleteCustomer(customerId: string): Promise<void> {
    const confirmed = window.confirm(
      'Willst du diesen Kunden wirklich löschen? Bestehende Kalkulationen und Verkäufe bleiben lesbar.'
    );
    if (!confirmed) {
      return;
    }

    this.customerServiceError.set(null);
    try {
      await this.#customerService.softDeleteCustomer(customerId);
    } catch (error) {
      this.customerServiceError.set(error instanceof Error ? error.message : 'Löschen fehlgeschlagen');
    }
  }

  // --- Field error helpers ---

  getCustomerError(field: CustomerFormFieldName): string | null {
    const control = this.customerForm.controls[field];
    if (!control.touched || !control.invalid) {
      return null;
    }

    if (control.hasError('required') && field === 'name') {
      return 'Bitte Namen eingeben';
    }

    if (control.hasError('maxlength')) {
      if (field === 'name') {
        return 'Name ist zu lang';
      }
      if (field === 'contact') {
        return 'Kontakt ist zu lang';
      }
      return 'Notiz ist zu lang';
    }

    return null;
  }

  customerInitials(name: string): string {
    const words = name
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    if (words.length === 0) {
      return '??';
    }

    if (words.length === 1) {
      return words[0].slice(0, 1).toUpperCase();
    }

    return `${words[0].slice(0, 1)}${words[1].slice(0, 1)}`.toUpperCase();
  }

  customerPreview(contact: string | undefined, note: string | undefined): string {
    if (contact) {
      return contact;
    }

    if (note) {
      return note;
    }

    return 'Kein Kontakt oder Notiz';
  }

  getError(field: PrinterFormFieldName): string | null {
    const control = this.form.controls[field];
    if (!control.touched || !control.invalid) {
      return null;
    }

    if (control.hasError('required')) {
      return this.getRequiredError(field);
    }

    if (control.hasError('min')) {
      return this.getMinError(field);
    }

    if (control.hasError('maxlength')) {
      if (field === 'note') {
        return 'Notiz ist zu lang';
      }
      if (field === 'name') {
        return 'Name ist zu lang';
      }
    }

    return null;
  }

  private getRequiredError(field: PrinterFormFieldName): string {
    switch (field) {
      case 'name':
        return 'Bitte Name eingeben';
      case 'powerWatts':
        return 'Bitte Leistung eingeben';
      case 'purchasePriceEur':
        return 'Bitte Kaufpreis eingeben';
      case 'lifetimeHours':
        return 'Bitte Lebensdauer eingeben';
      case 'note':
        return 'Bitte Notiz prüfen';
    }
  }

  private getMinError(field: PrinterFormFieldName): string {
    switch (field) {
      case 'powerWatts':
        return 'Leistung muss größer als 0 sein';
      case 'purchasePriceEur':
        return 'Kaufpreis muss größer als 0 sein';
      case 'lifetimeHours':
        return 'Lebensdauer muss größer als 0 sein';
      default:
        return 'Ungültiger Wert';
    }
  }

  private resetForm(): void {
    this.editingPrinterId.set(null);
    this.form.reset({
      name: '',
      powerWatts: 250,
      purchasePriceEur: 0,
      lifetimeHours: 2000,
      note: ''
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private resetCustomerForm(): void {
    this.editingCustomerId.set(null);
    this.customerForm.reset({
      name: '',
      contact: '',
      note: ''
    });
    this.customerForm.markAsPristine();
    this.customerForm.markAsUntouched();
  }

  private populateSettingsForm(): void {
    const settings = this.#settingsService.settings();
    this.settingsForm.patchValue(
      {
        defaultPriceMode: (settings['defaultPriceMode'] as string) || 'FIXED',
        defaultProfitMarginPercent: (settings['defaultProfitMarginPercent'] as number) ?? 0,
        defaultModelingCostEur: (settings['defaultModelingCostEur'] as number) ?? 0,
        defaultExtraWorkFeePercent: (settings['defaultExtraWorkFeePercent'] as number) ?? 0,
        electricityPriceEurKwh: (settings['electricityPriceEurKwh'] as number) ?? 0.32,
        annualBaseFeeEur: (settings['annualBaseFeeEur'] as number) ?? 0
      },
      { emitEvent: false }
    );
    this.settingsForm.markAsPristine();
  }

  private async refreshAllServices(): Promise<void> {
    await Promise.all([
      this.#printerService.refresh(),
      this.#filamentService.refresh(),
      this.#calculationService.refresh(),
      this.#calculationService.refreshTemplates(),
      this.#customerService.refresh(),
      this.#settingsService.refresh(),
      this.#partService.refresh()
    ]);
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
      reader.readAsText(file);
    });
  }
}
