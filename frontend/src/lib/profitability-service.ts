export type WeightUnit = "kg" | "quintal" | "tonne" | "g";
export type PriceUnit = "kg" | "quintal" | "tonne";

export type ProfitabilityInput = {
  quantity: number;
  quantityUnit?: WeightUnit;
  sellingPricePerUnit: number;
  sellingPriceUnit?: PriceUnit;
  fixedCost?: number;
  variableCostPerUnit?: number;
  variableCostUnit?: PriceUnit;
  totalCost?: number;
};

export type ProfitabilityOutcomeFeedback = {
  predictedRevenue: number;
  actualRevenue: number | null;
  predictedProfit: number;
  actualProfit: number | null;
  predictedQuantity: number;
  actualQuantity: number | null;
  predictedPrice: number;
  actualPrice: number | null;
};

export type ProfitabilitySnapshot = ProfitabilityOutcomeFeedback & {
  quantity: number;
  quantityInKg: number;
  fixedCost: number;
  variableCost: number;
  revenue: number;
  totalCost: number;
  profit: number;
  loss: number;
  breakEvenQuantity: number;
  breakEvenPrice: number;
  profitMargin: number;
  roi: number;
};

export type ProfitabilityStrategy = "MSP" | "DIRECT_MARKET" | "GROUP_SELLING" | "EXPORT";

export type StrategyComparisonInput = {
  quantity: number;
  quantityUnit?: WeightUnit;
  fixedCost?: number;
  variableCostPerUnit?: number;
  variableCostUnit?: PriceUnit;
  mspPricePerUnit?: number;
  mspPriceUnit?: PriceUnit;
  directMarketPricePerUnit?: number;
  directMarketPriceUnit?: PriceUnit;
  directMarketExtraCostPerUnit?: number;
  directMarketExtraCostUnit?: PriceUnit;
  groupSellingPricePerUnit?: number;
  groupSellingPriceUnit?: PriceUnit;
  groupAggregationCostPerUnit?: number;
  groupAggregationCostUnit?: PriceUnit;
  groupHandlingCostPerUnit?: number;
  groupHandlingCostUnit?: PriceUnit;
  groupStorageCostPerUnit?: number;
  groupStorageCostUnit?: PriceUnit;
  groupTransactionCost?: number;
  exportOfferPerUnit?: number;
  exportOfferUnit?: PriceUnit;
  exportPackagingCostPerUnit?: number;
  exportPackagingCostUnit?: PriceUnit;
  exportDocumentationCost?: number;
  exportLogisticsCost?: number;
  exportTransportCost?: number;
  exportChargesPct?: number;
};

export type StrategyComparisonRow = {
  strategy: ProfitabilityStrategy;
  label: string;
  expectedPrice: number;
  cost: number;
  revenue: number;
  profit: number;
  margin: number;
  breakEvenQuantity: number;
  breakEvenPrice: number;
  eligible: boolean;
  note: string;
};

export type PriceSensitivityScenario = {
  price: number;
  revenue: number;
  profit: number;
  margin: number;
  status: "PROFITABLE" | "BREAK-EVEN" | "LOSS RISK" | "HIGH PROFIT POTENTIAL";
};

export type YieldSensitivityScenario = {
  yieldQuintals: number;
  revenue: number;
  profit: number;
  margin: number;
  status: "PROFITABLE" | "BREAK-EVEN" | "LOSS RISK" | "HIGH PROFIT POTENTIAL";
};

export type CostSensitivityScenario = {
  label: string;
  totalCost: number;
  breakEvenPrice: number;
  profit: number;
  margin: number;
  status: "PROFITABLE" | "BREAK-EVEN" | "LOSS RISK" | "HIGH PROFIT POTENTIAL";
};

const UNIT_TO_KG: Record<WeightUnit, number> = {
  g: 0.001,
  kg: 1,
  quintal: 100,
  tonne: 1000,
};

const PRICE_TO_KG: Record<PriceUnit, number> = {
  kg: 1,
  quintal: 100,
  tonne: 1000,
};

export function toCanonicalWeight(value: number, unit: WeightUnit = "kg"): number {
  const normalized = Number.isFinite(value) ? value : 0;
  return Number((normalized * UNIT_TO_KG[unit]).toFixed(6));
}

export function normalizeWeight(value: number, unit: WeightUnit = "kg"): number {
  return toCanonicalWeight(value, unit);
}

function convertPricePerKg(value: number, unit: PriceUnit = "kg"): number {
  const normalized = Number.isFinite(value) ? value : 0;
  return Number((normalized / PRICE_TO_KG[unit]).toFixed(6));
}

export function calculateProfitabilitySnapshot(input: ProfitabilityInput): ProfitabilitySnapshot {
  const quantityInKg = normalizeWeight(input.quantity, input.quantityUnit ?? "kg");
  const sellingPricePerKg = convertPricePerKg(input.sellingPricePerUnit, input.sellingPriceUnit ?? "kg");
  const fixedCost = Math.max(0, Number(input.fixedCost ?? 0));
  const variableCostPerKg = convertPricePerKg(input.variableCostPerUnit ?? 0, input.variableCostUnit ?? "kg");
  const variableCost = Number((quantityInKg * variableCostPerKg).toFixed(2));
  const totalCost = Number((Math.max(0, Number(input.totalCost ?? 0)) || fixedCost + variableCost).toFixed(2));
  const revenue = Number((quantityInKg * sellingPricePerKg).toFixed(2));
  const profit = Number((revenue - totalCost).toFixed(2));
  const loss = profit < 0 ? Math.abs(profit) : 0;

  const breakEvenQuantity =
    fixedCost > 0 && sellingPricePerKg > variableCostPerKg
      ? Number((fixedCost / (sellingPricePerKg - variableCostPerKg)).toFixed(2))
      : 0;

  const breakEvenPrice =
    quantityInKg > 0 ? Number(((fixedCost + variableCost) / quantityInKg).toFixed(2)) : 0;

  const profitMargin = revenue > 0 ? Number(((profit / revenue) * 100).toFixed(2)) : 0;
  const roi = totalCost > 0 ? Number(((profit / totalCost) * 100).toFixed(2)) : 0;

  return {
    predictedRevenue: revenue,
    actualRevenue: null,
    predictedProfit: profit > 0 ? profit : 0,
    actualProfit: null,
    predictedQuantity: quantityInKg,
    actualQuantity: null,
    predictedPrice: sellingPricePerKg,
    actualPrice: null,
    quantity: input.quantity,
    quantityInKg,
    fixedCost,
    variableCost,
    revenue,
    totalCost,
    profit: profit > 0 ? profit : 0,
    loss,
    breakEvenQuantity,
    breakEvenPrice,
    profitMargin,
    roi,
  };
}

export function recordCompletedProfitabilityOutcome(
  predicted: ProfitabilitySnapshot,
  actual: {
    revenue?: number | null;
    profit?: number | null;
    quantity?: number | null;
    price?: number | null;
  }
): ProfitabilitySnapshot {
  return {
    ...predicted,
    actualRevenue: actual.revenue ?? null,
    actualProfit: actual.profit ?? null,
    actualQuantity: actual.quantity ?? null,
    actualPrice: actual.price ?? null,
  };
}

export function compareProfitabilityStrategies(input: StrategyComparisonInput): StrategyComparisonRow[] {
  const quantityInKg = normalizeWeight(input.quantity, input.quantityUnit ?? "kg");
  const fixedCost = Math.max(0, Number(input.fixedCost ?? 0));
  const variableCostPerKg = convertPricePerKg(input.variableCostPerUnit ?? 0, input.variableCostUnit ?? "kg");
  const variableCost = Number((quantityInKg * variableCostPerKg).toFixed(2));
  const baseCost = Number((fixedCost + variableCost).toFixed(2));

  const rows: StrategyComparisonRow[] = [];

  const addRow = (
    strategy: ProfitabilityStrategy,
    label: string,
    expectedPricePerUnit: number | undefined,
    priceUnit: PriceUnit | undefined,
    additionalCostPerUnit: number | undefined,
    additionalCostUnit: PriceUnit | undefined,
    note: string,
    eligible = true
  ) => {
    if (!eligible || expectedPricePerUnit === undefined || expectedPricePerUnit === null) {
      return;
    }

    const expectedPricePerKg = convertPricePerKg(expectedPricePerUnit, priceUnit ?? "kg");
    const extraCostPerKg = additionalCostPerUnit !== undefined
      ? convertPricePerKg(additionalCostPerUnit, additionalCostUnit ?? "kg")
      : 0;

    const additionalCost = Number((quantityInKg * extraCostPerKg).toFixed(2));
    const totalCost = Number((baseCost + additionalCost).toFixed(2));
    const revenue = Number((quantityInKg * expectedPricePerKg).toFixed(2));
    const profit = Number((revenue - totalCost).toFixed(2));
    const margin = revenue > 0 ? Number(((profit / revenue) * 100).toFixed(2)) : 0;
    const breakEvenPrice = quantityInKg > 0 ? Number(((baseCost + additionalCost) / quantityInKg).toFixed(2)) : 0;
    const breakEvenQuantity =
      fixedCost > 0 && expectedPricePerKg > variableCostPerKg + extraCostPerKg
        ? Number((fixedCost / (expectedPricePerKg - (variableCostPerKg + extraCostPerKg))).toFixed(2))
        : 0;

    rows.push({
      strategy,
      label,
      expectedPrice: Number(expectedPricePerKg.toFixed(2)),
      cost: totalCost,
      revenue,
      profit,
      margin,
      breakEvenQuantity,
      breakEvenPrice,
      eligible: true,
      note,
    });
  };

  addRow(
    "MSP",
    "Sell at MSP",
    input.mspPricePerUnit,
    input.mspPriceUnit ?? "quintal",
    0,
    "kg",
    "Government MSP benchmark applied as procurement floor.",
    typeof input.mspPricePerUnit === "number"
  );

  addRow(
    "DIRECT_MARKET",
    "Direct Market",
    input.directMarketPricePerUnit,
    input.directMarketPriceUnit ?? "quintal",
    input.directMarketExtraCostPerUnit,
    input.directMarketExtraCostUnit ?? "quintal",
    "Local mandi or direct channel sale, net of channel-specific handling cost.",
    typeof input.directMarketPricePerUnit === "number"
  );

  addRow(
    "GROUP_SELLING",
    "Group Selling",
    input.groupSellingPricePerUnit,
    input.groupSellingPriceUnit ?? "quintal",
    (input.groupAggregationCostPerUnit ?? 0) + (input.groupHandlingCostPerUnit ?? 0) + (input.groupStorageCostPerUnit ?? 0),
    input.groupAggregationCostUnit ?? "quintal",
    "Volume aggregation reduces per-unit transport and handling cost while consolidating sales.",
    typeof input.groupSellingPricePerUnit === "number"
  );

  addRow(
    "EXPORT",
    "Export",
    input.exportOfferPerUnit,
    input.exportOfferUnit ?? "kg",
    (input.exportPackagingCostPerUnit ?? 0) + ((input.exportDocumentationCost ?? 0) + (input.exportLogisticsCost ?? 0) + (input.exportTransportCost ?? 0)) / Math.max(1, quantityInKg),
    input.exportPackagingCostUnit ?? "kg",
    "Indicative export estimate only; not a guaranteed export price.",
    typeof input.exportOfferPerUnit === "number"
  );

  return rows;
}

export function buildPriceSensitivityScenarios({
  expectedPricePerQuintal,
  quantityQuintals,
  totalCost,
  baseScenarioPrices,
}: {
  expectedPricePerQuintal: number;
  quantityQuintals: number;
  totalCost: number;
  baseScenarioPrices?: number[];
}): PriceSensitivityScenario[] {
  const referencePrice = Number.isFinite(expectedPricePerQuintal) ? expectedPricePerQuintal : 0;
  const quantity = Number.isFinite(quantityQuintals) ? Math.max(0, quantityQuintals) : 0;
  const cost = Number.isFinite(totalCost) ? Math.max(0, totalCost) : 0;

  const prices = baseScenarioPrices && baseScenarioPrices.length > 0
    ? baseScenarioPrices
    : [referencePrice - 400, referencePrice - 200, referencePrice, referencePrice + 200, referencePrice + 400];

  return prices.map((price) => {
    const normalizedPrice = Math.max(0, Number(price) || 0);
    const revenue = Number((quantity * normalizedPrice).toFixed(2));
    const profit = Number((revenue - cost).toFixed(2));
    const margin = revenue > 0 ? Number(((profit / revenue) * 100).toFixed(2)) : 0;
    const status =
      profit > 0 && margin >= 15 ? "HIGH PROFIT POTENTIAL" :
      profit > 0 ? "PROFITABLE" :
      Math.abs(profit) <= 0.01 ? "BREAK-EVEN" :
      "LOSS RISK";

    return {
      price: normalizedPrice,
      revenue,
      profit,
      margin,
      status,
    };
  });
}

export function buildYieldSensitivityScenarios({
  expectedYieldQuintals,
  sellingPricePerQuintal,
  totalCost,
  baseScenarioYields,
}: {
  expectedYieldQuintals: number;
  sellingPricePerQuintal: number;
  totalCost: number;
  baseScenarioYields?: number[];
}): YieldSensitivityScenario[] {
  const referenceYield = Number.isFinite(expectedYieldQuintals) ? Math.max(0, expectedYieldQuintals) : 0;
  const sellingPrice = Number.isFinite(sellingPricePerQuintal) ? Math.max(0, sellingPricePerQuintal) : 0;
  const cost = Number.isFinite(totalCost) ? Math.max(0, totalCost) : 0;

  const yields = baseScenarioYields && baseScenarioYields.length > 0
    ? baseScenarioYields
    : [referenceYield - 10, referenceYield - 5, referenceYield, referenceYield + 5, referenceYield + 10];

  return yields.map((yieldQuintals) => {
    const normalizedYield = Math.max(0, Number(yieldQuintals) || 0);
    const revenue = Number((normalizedYield * sellingPrice).toFixed(2));
    const profit = Number((revenue - cost).toFixed(2));
    const margin = revenue > 0 ? Number(((profit / revenue) * 100).toFixed(2)) : 0;
    const status =
      profit > 0 && margin >= 15 ? "HIGH PROFIT POTENTIAL" :
      profit > 0 ? "PROFITABLE" :
      Math.abs(profit) <= 0.01 ? "BREAK-EVEN" :
      "LOSS RISK";

    return {
      yieldQuintals: normalizedYield,
      revenue,
      profit,
      margin,
      status,
    };
  });
}

export function buildCostSensitivityScenarios({
  expectedYieldQuintals,
  sellingPricePerQuintal,
  baseTotalCost,
  inputCost,
  laborCost,
  transportCost,
  baseScenarioLabels,
}: {
  expectedYieldQuintals: number;
  sellingPricePerQuintal: number;
  baseTotalCost: number;
  inputCost: number;
  laborCost: number;
  transportCost: number;
  baseScenarioLabels?: Array<{ label: string; inputPct: number; laborPct: number; transportPct: number }>;
}): CostSensitivityScenario[] {
  const quantity = Number.isFinite(expectedYieldQuintals) ? Math.max(0, expectedYieldQuintals) : 0;
  const sellingPrice = Number.isFinite(sellingPricePerQuintal) ? Math.max(0, sellingPricePerQuintal) : 0;
  const baseCost = Number.isFinite(baseTotalCost) ? Math.max(0, baseTotalCost) : 0;
  const baseInput = Number.isFinite(inputCost) ? Math.max(0, inputCost) : 0;
  const baseLabor = Number.isFinite(laborCost) ? Math.max(0, laborCost) : 0;
  const baseTransport = Number.isFinite(transportCost) ? Math.max(0, transportCost) : 0;

  const scenarios = baseScenarioLabels && baseScenarioLabels.length > 0
    ? baseScenarioLabels
    : [
        { label: "Base", inputPct: 0, laborPct: 0, transportPct: 0 },
        { label: "+10% input cost", inputPct: 0.10, laborPct: 0, transportPct: 0 },
        { label: "+20% labor cost", inputPct: 0, laborPct: 0.20, transportPct: 0 },
        { label: "+15% transport cost", inputPct: 0, laborPct: 0, transportPct: 0.15 },
        { label: "+10% input + 20% labor + 15% transport", inputPct: 0.10, laborPct: 0.20, transportPct: 0.15 },
      ];

  const revenue = Number((quantity * sellingPrice).toFixed(2));

  return scenarios.map((scenario) => {
    const adjustedInputCost = baseInput * (1 + (Number(scenario.inputPct) || 0));
    const adjustedLaborCost = baseLabor * (1 + (Number(scenario.laborPct) || 0));
    const adjustedTransportCost = baseTransport * (1 + (Number(scenario.transportPct) || 0));
    const adjustedTotalCost = Number((baseCost - baseInput - baseLabor - baseTransport + adjustedInputCost + adjustedLaborCost + adjustedTransportCost).toFixed(2));
    const profit = Number((revenue - adjustedTotalCost).toFixed(2));
    const margin = revenue > 0 ? Number(((profit / revenue) * 100).toFixed(2)) : 0;
    const breakEvenPrice = quantity > 0 ? Number((adjustedTotalCost / quantity).toFixed(2)) : 0;
    const status =
      profit > 0 && margin >= 15 ? "HIGH PROFIT POTENTIAL" :
      profit > 0 ? "PROFITABLE" :
      Math.abs(profit) <= 0.01 ? "BREAK-EVEN" :
      "LOSS RISK";

    return {
      label: scenario.label,
      totalCost: adjustedTotalCost,
      breakEvenPrice,
      profit,
      margin,
      status,
    };
  });
}
