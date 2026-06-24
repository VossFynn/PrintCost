/**
 * Persistent printer record as stored in IndexedDB.
 *
 * The soft-delete flag allows historical calculations and references to remain
 * valid while hiding removed printers from default lists.
 */
export interface PrinterRecord {
  id: string;
  name: string;
  powerWatts: number;
  purchasePriceEur: number;
  lifetimeHours: number;
  electricityPriceEurKwh?: number;
  annualBaseFeeEur?: number;
  bedType?: string;
  compatibleMaterials?: string[];
  note?: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Persistent filament record, including purchase history and price metadata.
 *
 * `purchases` keeps the full local history so price-basis calculations remain
 * deterministic after later edits.
 */
export interface FilamentRecord {
  id: string;
  name: string;
  type: string;
  colorHex?: string;
  manufacturer?: string;
  rollWeightG?: number;
  remainingG?: number;
  purchases?: FilamentPurchaseRecord[];
  multiColorSurchargeEurKg?: number;
  fixedPriceEurG?: number;
  deleted: boolean;
  createdAt?: string;
  updatedAt: string;
}

/**
 * Single purchase entry used to calculate price-per-gram modes.
 */
export interface FilamentPurchaseRecord {
  priceEur: number;
  quantityKg: number;
  purchasedAt: string;
}

export interface CalculationPrinterSnapshot {
  id: string;
  name: string;
  powerWatts: number;
  purchasePriceEur: number;
  lifetimeHours: number;
  electricityPriceEurKwh: number;
  annualBaseFeeEur: number;
  note?: string;
}

export interface CalculationFilamentSnapshot {
  id: string;
  name: string;
  type: string;
  colorHex?: string;
  manufacturer?: string;
  rollWeightG?: number;
  remainingG?: number;
  purchases?: FilamentPurchaseRecord[];
  multiColorSurchargeEurKg?: number;
  fixedPriceEurG?: number;
}

export interface CalculationFilamentLineSnapshot {
  filamentId: string;
  filamentName: string;
  gramsUsed: number;
  selectedPriceMode: CalculationPriceMode;
  selectedPricePerGramEur: number;
  filamentSnapshot: CalculationFilamentSnapshot;
}

/**
 * Saved calculation snapshot record for historical inventory reproducibility.
 */
export interface CalculationRecord {
  id: string;
  projectName: string;
  customerId?: string;
  printerSnapshot: CalculationPrinterSnapshot;
  filamentSnapshots: CalculationFilamentLineSnapshot[];
  calculationInput: CalculationInput;
  calculationResult: CalculationResult;
  timesPrinted: number;
  timesSold?: number;
  timesGifted?: number;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Minimal sale record stored for inventory history.
 */
export interface SaleRecord {
  id: string;
  calculationId: string;
  customerId?: string;
  date: string;
  quantity?: number;
  priceEur?: number;
  gifted?: boolean;
  isGift?: boolean;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Customer record stored in IndexedDB.
 */
export type CustomerPaymentMethod = 'cash' | 'transfer' | 'invoice';
export type CustomerType = 'private' | 'business';

export interface CustomerRecord {
  id: string;
  name: string;
  contact?: string;
  note?: string;
  paymentMethod?: CustomerPaymentMethod;
  customerType?: CustomerType;
  discountPercent?: number;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Template metadata stored alongside saved calculation templates.
 */
export interface TemplateRecord {
  id: string;
  templateName: string;
  templateInput: TemplateCalculationInputRecord;
  createdAt: string;
  updatedAt: string;
}

/**
 * Persisted calculation fields reused when prefilling a new calculation from a template.
 */
export interface TemplateCalculationInputRecord {
  projectName: string;
  printerId: string;
  printHours: number;
  printQuantity: number;
  partsPerPlate: number;
  modelExists: boolean;
  /** Effective modelling cost for the job (hourly rate × hours). Kept for back-compat. */
  modelingCostEur: number;
  /** Modelling hourly rate (€/h). Optional for templates saved before the rate/hours split. */
  modelingHourlyRateEur?: number;
  /** Modelling hours. Optional for templates saved before the rate/hours split. */
  modelingHours?: number;
  extraWorkFeePercent: number;
  profitMarginPercent: number;
  filamentLines: TemplateFilamentLineRecord[];
}

/**
 * Persisted filament line configuration within a saved calculation template.
 */
export interface TemplateFilamentLineRecord {
  filamentId: string;
  grams: number;
  priceMode: CalculationPriceMode;
  fixedPriceEurG: number;
}

/**
 * Manual part record stored in the inventory subsystem.
 */
export interface PartRecord {
  id: string;
  name: string;
  quantity: number;
  calculationId?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Generic key/value settings record used by the settings store.
 */
export interface SettingRecord {
  key: string;
  value: unknown;
}

/**
 * Default local settings seeded on first database open.
 *
 * These values intentionally mirror the German UI/local formatting defaults.
 */
export const DEFAULT_SETTINGS: Record<string, unknown> = {
  defaultCurrency: 'EUR',
  locale: 'de-DE',
  defaultPriceMode: 'FIXED',
  defaultProfitMarginPercent: 0,
  defaultModelingCostEur: 0,
  defaultExtraWorkFeePercent: 0,
  electricityPriceEurKwh: 0.32,
  annualBaseFeeEur: 0
};

/**
 * Full backup payload shape. Version must equal DB_VERSION for valid imports.
 */
export interface BackupFormat {
  version: number;
  exportedAt: string;
  printers: PrinterRecord[];
  filaments: FilamentRecord[];
  calculations: CalculationRecord[];
  sales: SaleRecord[];
  customers: CustomerRecord[];
  templates: TemplateRecord[];
  parts: PartRecord[];
  settings: SettingRecord[];
}

import { CalculationInput, CalculationPriceMode, CalculationResult } from '../calculation/calculate';
