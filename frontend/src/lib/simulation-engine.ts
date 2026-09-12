/**
 * AgriProfit — Financial Simulation & Profit Engine
 * =================================================
 * Deterministic mathematical calculations for farm financial planning,
 * sensitivity analysis, and break-even estimations.
 */

export type SimulationInput = {
  areaAcres: number;
  expectedYieldQuintalsPerAcre: number;
  expectedSellingPricePerQuintal: number;
  inputCostPerAcre: number;
};

export type SimulationResult = {
  areaAcres: number;
  expectedGrossRevenue: number;
  totalEstimatedCost: number;
  expectedNetProfit: number;
  roiMultiplier: number;
  roiPercentage: number;
  breakEvenPricePerQuintal: number;
  breakEvenYieldQuintalsPerAcre: number;
  revenuePerAcre: number;
  costPerAcre: number;
  profitPerAcre: number;
  provenance: {
    isEstimated: boolean;
    label: string;
  };
};

/**
 * Calculate full financial simulation for a given crop allocation and farmer assumptions
 */
export function simulateCropFinancials(input: SimulationInput): SimulationResult {
  const area = Math.max(0.01, input.areaAcres);
  const yieldPerAcre = Math.max(0.1, input.expectedYieldQuintalsPerAcre);
  const pricePerQuintal = Math.max(1, input.expectedSellingPricePerQuintal);
  const costPerAcre = Math.max(100, input.inputCostPerAcre);

  const revenuePerAcre = yieldPerAcre * pricePerQuintal;
  const expectedGrossRevenue = Number((area * revenuePerAcre).toFixed(0));

  const totalEstimatedCost = Number((area * costPerAcre).toFixed(0));
  const expectedNetProfit = Number((expectedGrossRevenue - totalEstimatedCost).toFixed(0));

  const profitPerAcre = Number((revenuePerAcre - costPerAcre).toFixed(0));

  const roiMultiplier = Number((expectedGrossRevenue / totalEstimatedCost).toFixed(2));
  const roiPercentage = Number(((expectedNetProfit / totalEstimatedCost) * 100).toFixed(1));

  // Break-even price: Price per quintal needed to cover total cost at given yield
  const breakEvenPricePerQuintal = Number((costPerAcre / yieldPerAcre).toFixed(0));

  // Break-even yield: Quintals per acre needed to cover total cost at given price
  const breakEvenYieldQuintalsPerAcre = Number((costPerAcre / pricePerQuintal).toFixed(2));

  return {
    areaAcres: area,
    expectedGrossRevenue,
    totalEstimatedCost,
    expectedNetProfit,
    roiMultiplier,
    roiPercentage,
    breakEvenPricePerQuintal,
    breakEvenYieldQuintalsPerAcre,
    revenuePerAcre,
    costPerAcre,
    profitPerAcre,
    provenance: {
      isEstimated: true,
      label: "Estimated based on agronomic benchmarks & local market assumptions",
    },
  };
}

