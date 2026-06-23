export type CalculationPriceMode = 'WEIGHTED_AVERAGE' | 'PAID' | 'FIXED';

/**
 * Single purchase entry used by the pure domain engine to resolve price modes.
 */
export interface CalculationPurchase {
  priceEur: number;
  quantityKg: number;
  purchasedAt: string;
}

/**
 * One filament line used by the calculation engine.
 *
 * `gramsUsed` is the full job amount for this line (not per plate).
 */
export interface CalculationFilamentLineInput {
  gramsUsed: number;
  priceMode: CalculationPriceMode;
  purchases: CalculationPurchase[];
  fixedPriceEurG?: number;
}

/**
 * Pure input contract for domain calculation.
 *
 * All time and material values represent the total print job. Plate count only
 * controls optional extra-work fee activation and never multiplies base costs.
 */
export interface CalculationInput {
  filamentLines: CalculationFilamentLineInput[];
  printMinutes: number;
  printQuantity: number;
  partsPerPlate: number;
  extraWorkFeePercent: number;
  modelExists: boolean;
  modelingCostEur: number;
  profitMarginPercent: number;
  powerWatts: number;
  electricityPriceEurKwh: number;
  annualBaseFeeEur: number;
  purchasePriceEur: number;
  lifetimeHours: number;
}

/**
 * Stable output contract consumed by upcoming live-result and snapshot stories.
 */
export interface CalculationResult {
  plateCount: number;
  totalGrams: number;
  materialCostEur: number;
  electricityCostEur: number;
  depreciationCostEur: number;
  modelingCostEur: number;
  extraWorkFeeEur: number;
  subtotalEur: number;
  finalPriceEur: number;
  roundedFinalPriceEur: number;
}

export function calculate(input: CalculationInput): CalculationResult {
  const plateCount = Math.ceil(input.printQuantity / input.partsPerPlate);
  const totalGrams = input.filamentLines.reduce((sum, line) => sum + line.gramsUsed, 0);

  const materialCostEur = input.filamentLines.reduce((sum, line) => {
    return sum + line.gramsUsed * resolvePricePerGram(line);
  }, 0);

  const electricityPerMinute = (input.powerWatts / 1000) * input.electricityPriceEurKwh / 60;
  const baseFeePerMinute = input.annualBaseFeeEur / 365 / 24 / 60;
  const electricityCostEur = (electricityPerMinute + baseFeePerMinute) * input.printMinutes;

  const depreciationPerMinute = input.purchasePriceEur / (input.lifetimeHours * 60);
  const depreciationCostEur = depreciationPerMinute * input.printMinutes;

  const modelingCostEur = input.modelExists ? 0 : input.modelingCostEur;
  const subtotalBeforeFeeEur = materialCostEur + electricityCostEur + depreciationCostEur + modelingCostEur;

  // Extra-work is the only plate-dependent cost modifier in the corrected formula.
  const extraWorkFeeEur = plateCount > 1 ? subtotalBeforeFeeEur * input.extraWorkFeePercent / 100 : 0;
  const subtotalEur = subtotalBeforeFeeEur + extraWorkFeeEur;
  const finalPriceEur = subtotalEur * (1 + input.profitMarginPercent / 100);
  const roundedFinalPriceEur = Math.ceil(finalPriceEur);

  return {
    plateCount,
    totalGrams,
    materialCostEur,
    electricityCostEur,
    depreciationCostEur,
    modelingCostEur,
    extraWorkFeeEur,
    subtotalEur,
    finalPriceEur,
    roundedFinalPriceEur
  };
}

function resolvePricePerGram(line: CalculationFilamentLineInput): number {
  switch (line.priceMode) {
    case 'WEIGHTED_AVERAGE':
      return weightedAveragePricePerGram(line.purchases);
    case 'PAID':
      return latestPaidPricePerGram(line.purchases);
    case 'FIXED':
      if (line.fixedPriceEurG === undefined || line.fixedPriceEurG <= 0) {
        throw new Error('Fixed price mode requires fixedPriceEurG > 0');
      }
      return line.fixedPriceEurG;
  }
}

function weightedAveragePricePerGram(purchases: CalculationPurchase[]): number {
  const totalQuantityKg = purchases.reduce((sum, purchase) => sum + purchase.quantityKg, 0);
  if (totalQuantityKg <= 0) {
    throw new Error('At least one purchase with positive quantity is required');
  }

  const totalPrice = purchases.reduce((sum, purchase) => sum + purchase.priceEur * purchase.quantityKg, 0);
  return totalPrice / totalQuantityKg / 1000;
}

function latestPaidPricePerGram(purchases: CalculationPurchase[]): number {
  if (purchases.length === 0) {
    throw new Error('At least one purchase with positive quantity is required');
  }

  const latest = purchases.reduce((currentLatest, purchase) => {
    if (purchase.purchasedAt > currentLatest.purchasedAt || purchase.purchasedAt === currentLatest.purchasedAt) {
      return purchase;
    }
    return currentLatest;
  });

  return latest.priceEur / 1000;
}
