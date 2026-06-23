import { describe, expect, it } from 'vitest';

import { calculate, CalculationInput } from './calculate';

const baseInput = (): CalculationInput => ({
  filamentLines: [
    {
      gramsUsed: 100,
      priceMode: 'WEIGHTED_AVERAGE',
      purchases: [
        { priceEur: 20, quantityKg: 1, purchasedAt: '2026-06-20' },
        { priceEur: 30, quantityKg: 1, purchasedAt: '2026-06-22' }
      ]
    }
  ],
  printMinutes: 120,
  printQuantity: 10,
  partsPerPlate: 4,
  extraWorkFeePercent: 10,
  modelExists: false,
  modelingCostEur: 5,
  profitMarginPercent: 20,
  powerWatts: 60,
  electricityPriceEurKwh: 0.3,
  annualBaseFeeEur: 365,
  purchasePriceEur: 1200,
  lifetimeHours: 1000
});

describe('calculate', () => {
  it('returns the full deterministic output contract with corrected formula semantics', () => {
    const result = calculate(baseInput());

    expect(result.plateCount).toBe(3);
    expect(result.totalGrams).toBe(100);
    expect(result.materialCostEur).toBeCloseTo(2.5, 10);
    expect(result.electricityCostEur).toBeCloseTo(0.11933333333333335, 10);
    expect(result.depreciationCostEur).toBeCloseTo(2.4, 10);
    expect(result.modelingCostEur).toBeCloseTo(5, 10);
    expect(result.extraWorkFeeEur).toBeCloseTo(1.0019333333333333, 10);
    expect(result.subtotalEur).toBeCloseTo(11.021266666666667, 10);
    expect(result.finalPriceEur).toBeCloseTo(13.22552, 10);
    expect(result.roundedFinalPriceEur).toBe(14);
  });

  it('supports WEIGHTED_AVERAGE, PAID, and FIXED line pricing modes', () => {
    const weightedAverageResult = calculate({
      ...baseInput(),
      printMinutes: 0,
      modelExists: true,
      extraWorkFeePercent: 0,
      profitMarginPercent: 0
    });
    expect(weightedAverageResult.materialCostEur).toBeCloseTo(2.5, 10);

    const paidResult = calculate({
      ...baseInput(),
      filamentLines: [
        {
          gramsUsed: 100,
          priceMode: 'PAID',
          purchases: [
            { priceEur: 20, quantityKg: 1, purchasedAt: '2026-06-20' },
            { priceEur: 24, quantityKg: 1, purchasedAt: '2026-06-22' }
          ]
        }
      ],
      printMinutes: 0,
      modelExists: true,
      extraWorkFeePercent: 0,
      profitMarginPercent: 0
    });
    expect(paidResult.materialCostEur).toBeCloseTo(2.4, 10);

    const fixedResult = calculate({
      ...baseInput(),
      filamentLines: [
        {
          gramsUsed: 100,
          priceMode: 'FIXED',
          fixedPriceEurG: 0.03,
          purchases: [{ priceEur: 20, quantityKg: 1, purchasedAt: '2026-06-20' }]
        }
      ],
      printMinutes: 0,
      modelExists: true,
      extraWorkFeePercent: 0,
      profitMarginPercent: 0
    });
    expect(fixedResult.materialCostEur).toBeCloseTo(3, 10);
  });

  it('does not multiply cost components by plate count and only applies extra-work fee when plates > 1', () => {
    const manyPlateResult = calculate(baseInput());
    const singlePlateResult = calculate({
      ...baseInput(),
      printQuantity: 1,
      partsPerPlate: 2
    });

    expect(manyPlateResult.plateCount).toBe(3);
    expect(singlePlateResult.plateCount).toBe(1);
    expect(manyPlateResult.materialCostEur).toBe(singlePlateResult.materialCostEur);
    expect(manyPlateResult.electricityCostEur).toBe(singlePlateResult.electricityCostEur);
    expect(manyPlateResult.depreciationCostEur).toBe(singlePlateResult.depreciationCostEur);
    expect(singlePlateResult.extraWorkFeeEur).toBe(0);
  });

  it('applies profit margin and uses ceiling rounding for rounded final price', () => {
    const result = calculate({
      ...baseInput(),
      printQuantity: 1,
      partsPerPlate: 1,
      extraWorkFeePercent: 0,
      printMinutes: 0,
      modelExists: true,
      filamentLines: [
        {
          gramsUsed: 100,
          priceMode: 'FIXED',
          fixedPriceEurG: 0.02456,
          purchases: [{ priceEur: 20, quantityKg: 1, purchasedAt: '2026-06-20' }]
        }
      ],
      profitMarginPercent: 25
    });

    expect(result.finalPriceEur).toBeCloseTo(3.07, 10);
    expect(result.roundedFinalPriceEur).toBe(4);
  });

  it('does not mutate input objects while calculating', () => {
    const input = baseInput();
    const snapshot = JSON.parse(JSON.stringify(input));

    calculate(input);

    expect(input).toEqual(snapshot);
  });
});
