export interface PrinterRecord {
  id: string;
  name: string;
  powerWatts: number;
  purchasePriceEur: number;
  lifetimeHours: number;
  electricityPriceEurKwh: number;
  annualBaseFeeEur: number;
  note?: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FilamentRecord {
  id: string;
  name: string;
  type: string;
  deleted: boolean;
  updatedAt: string;
}

export interface CalculationRecord {
  id: string;
  customerId?: string;
  deleted: boolean;
  updatedAt: string;
}

export interface SaleRecord {
  id: string;
  calculationId: string;
  customerId?: string;
  date: string;
}

export interface CustomerRecord {
  id: string;
  deleted: boolean;
}

export interface TemplateRecord {
  id: string;
  updatedAt: string;
}

export interface PartRecord {
  id: string;
  calculationId?: string;
}

export interface SettingRecord {
  key: string;
  value: unknown;
}

export const DEFAULT_SETTINGS: Record<string, unknown> = {
  defaultCurrency: 'EUR',
  locale: 'de-DE'
};

