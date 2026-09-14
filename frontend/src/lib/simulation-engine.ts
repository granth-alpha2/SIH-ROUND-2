/**
 * AgriProfit — Financial Simulation & Profit Engine
 * =================================================
 * Deterministic mathematical calculations for farm financial planning,
 * sensitivity analysis, and break-even estimations.
 */

import { forecastPriceWithML, predictYieldWithML } from "./ml-client";

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

export type GroupFarmerInput = {
  name: string;
  quantityQuintals: number;
  productionCostPerQuintal: number;
};

export type GroupSellingComparisonInput = {
  farmers: GroupFarmerInput[];
  groupSellingPricePerQuintal: number;
  aggregationCostPerQuintal: number;
  handlingCostPerQuintal: number;
  storageCostPerQuintal: number;
  groupTransactionCost: number;
  transportOptimizationSavingsPerQuintal: number;
};

export type GroupSellingComparison = {
  totalQuantity: number;
  totalProductionCost: number;
  aggregationCost: number;
  handlingCost: number;
  storageCost: number;
  groupTransactionCost: number;
  groupTotalCost: number;
  expectedSellingPrice: number;
  groupRevenue: number;
  groupBreakEven: number;
  transportSavings: number;
  perFarmerRealization: number;
  groupProfit: number;
  groupProfitMargin: number;
  additionalProfitFromAggregation: number;
  individualTotalCost: number;
  assumptions: string[];
  individualSellingComparison: {
    individualRevenue: number;
    individualTotalCost: number;
    individualProfit: number;
    deltaVsGroup: number;
  };
};

export function simulateGroupSellingComparison(input: GroupSellingComparisonInput): GroupSellingComparison {
  const farmers = input.farmers || [];
  const totalQuantity = farmers.reduce((sum, farmer) => sum + Math.max(0, farmer.quantityQuintals), 0);
  const totalProductionCost = farmers.reduce(
    (sum, farmer) => sum + farmer.quantityQuintals * Math.max(0, farmer.productionCostPerQuintal),
    0
  );

  const aggregationCost = totalQuantity * Math.max(0, input.aggregationCostPerQuintal);
  const handlingCost = totalQuantity * Math.max(0, input.handlingCostPerQuintal);
  const storageCost = totalQuantity * Math.max(0, input.storageCostPerQuintal);
  const groupTransactionCost = Math.max(0, input.groupTransactionCost);
  const transportSavings = totalQuantity * Math.max(0, input.transportOptimizationSavingsPerQuintal);

  const expectedSellingPrice = Math.max(1, input.groupSellingPricePerQuintal);
  const groupRevenue = Number((totalQuantity * expectedSellingPrice).toFixed(0));

  const groupTotalCost = totalProductionCost + aggregationCost + handlingCost + storageCost + groupTransactionCost;
  const groupProfit = Number((groupRevenue - groupTotalCost).toFixed(0));
  const groupBreakEven = Number((groupTotalCost / totalQuantity).toFixed(2));
  const groupProfitMargin = Number(((groupProfit / groupRevenue) * 100).toFixed(2));

  const individualLogisticsCost =
    totalQuantity * (input.handlingCostPerQuintal + input.storageCostPerQuintal + input.aggregationCostPerQuintal + input.transportOptimizationSavingsPerQuintal);
  const individualTotalCost = totalProductionCost + individualLogisticsCost;
  const individualProfit = Number((groupRevenue - individualTotalCost).toFixed(0));
  const additionalProfitFromAggregation = Number((groupProfit - individualProfit).toFixed(0));

  const assumptions = [
    `Production cost = sum of farmer-level quantity × unit cost (${totalProductionCost.toLocaleString("en-IN")}).`,
    `Aggregation cost = ${totalQuantity.toLocaleString("en-IN")} q × ₹${input.aggregationCostPerQuintal.toLocaleString("en-IN")}/q = ₹${aggregationCost.toLocaleString("en-IN")}.`,
    `Handling cost = ${totalQuantity.toLocaleString("en-IN")} q × ₹${input.handlingCostPerQuintal.toLocaleString("en-IN")}/q = ₹${handlingCost.toLocaleString("en-IN")}.`,
    `Storage cost = ${totalQuantity.toLocaleString("en-IN")} q × ₹${input.storageCostPerQuintal.toLocaleString("en-IN")}/q = ₹${storageCost.toLocaleString("en-IN")}.`,
    `Transport savings = ${totalQuantity.toLocaleString("en-IN")} q × ₹${input.transportOptimizationSavingsPerQuintal.toLocaleString("en-IN")}/q = ₹${transportSavings.toLocaleString("en-IN")}.`,
    `Group transaction cost fixed overhead = ₹${groupTransactionCost.toLocaleString("en-IN")}.`,
  ];

  return {
    totalQuantity,
    totalProductionCost,
    aggregationCost,
    handlingCost,
    storageCost,
    groupTransactionCost,
    groupTotalCost,
    expectedSellingPrice,
    groupRevenue,
    groupBreakEven,
    transportSavings,
    perFarmerRealization: Number((groupProfit / Math.max(1, farmers.length)).toFixed(0)),
    groupProfit,
    groupProfitMargin,
    additionalProfitFromAggregation,
    individualTotalCost,
    assumptions,
    individualSellingComparison: {
      individualRevenue: groupRevenue,
      individualTotalCost,
      individualProfit,
      deltaVsGroup: Number((groupProfit - individualProfit).toFixed(0)),
    },
  };
}

export type ExportScenarioInput = {
  cropQuantityQuintals: number;
  localPricePerQuintal: number;
  internationalReferencePricePerKg: number;
  exporterOfferPerKg: number;
  packagingCostPerQuintal: number;
  handlingCostPerQuintal: number;
  documentationCost: number;
  logisticsCost: number;
  transportCost: number;
  exporterChargesPct: number;
  exchangeRateInrPerUsd: number;
  exchangeRateTimestamp: string;
};

export type ExportScenarioResult = {
  indicative: boolean;
  estimateType: "Indicative estimate";
  internationalReferencePrice: {
    usdPerKg: number;
    inrPerKg: number;
  };
  exporterOffer: {
    usdPerKg: number;
    inrPerKg: number;
  };
  referenceDataMeta: {
    category: "REFERENCE DATA";
    country: string;
    commodity: string;
    currency: string;
    unit: string;
    period: string;
    source: string;
    sourceType: string;
    lastUpdated: string;
  };
  exporterOfferMeta: {
    category: "RECENT / INDICATIVE DATA";
    country: string;
    commodity: string;
    currency: string;
    unit: string;
    period: string;
    source: string;
    sourceType: string;
    lastUpdated: string;
  };
  historicalTradeDataMeta: {
    category: "HISTORICAL TRADE DATA";
    country: string;
    commodity: string;
    currency: string;
    unit: string;
    period: string;
    source: string;
    sourceType: string;
    lastUpdated: string;
  };
  cropQuantityQuintals: number;
  cropQuantityKg: number;
  packagingCost: number;
  handlingCost: number;
  documentationCost: number;
  logisticsCost: number;
  transportCost: number;
  estimatedExportCosts: number;
  exporterCharges: number;
  currencyConversion: {
    inrPerUsd: number;
    usdPerKgReference: number;
    usdPerKgOffer: number;
    timestamp: string;
  };
  expectedFarmerRealization: number;
  exportBreakEven: number;
  expectedExportProfit: number;
  exportRisk: string;
  sensitivity: {
    priceDown10Pct: number;
    logisticsUp15Pct: number;
  };
};

export function simulateExportScenario(input: ExportScenarioInput): ExportScenarioResult {
  const quantityQuintals = Math.max(0, input.cropQuantityQuintals);
  const quantityKg = quantityQuintals * 100;
  const inrPerUsd = Math.max(1, input.exchangeRateInrPerUsd);
  const periodStamp = input.exchangeRateTimestamp || new Date().toISOString();
  const periodLabel = new Date(periodStamp).toISOString().slice(0, 7);

  const internationalReferencePrice = {
    usdPerKg: Math.max(0, input.internationalReferencePricePerKg),
    inrPerKg: Number((Math.max(0, input.internationalReferencePricePerKg) * inrPerUsd).toFixed(2)),
  };

  const exporterOffer = {
    usdPerKg: Math.max(0, input.exporterOfferPerKg),
    inrPerKg: Number((Math.max(0, input.exporterOfferPerKg) * inrPerUsd).toFixed(2)),
  };

  const referenceDataMeta = {
    category: "REFERENCE DATA" as const,
    country: "UAE",
    commodity: "Onion",
    currency: "INR",
    unit: "kg equivalent",
    period: `2026-${periodLabel.slice(5)}`,
    source: "UN Comtrade",
    sourceType: "Reference data",
    lastUpdated: new Date(periodStamp).toISOString().slice(0, 10),
  };

  const exporterOfferMeta = {
    category: "RECENT / INDICATIVE DATA" as const,
    country: "UAE",
    commodity: "Onion",
    currency: "INR",
    unit: "kg",
    period: `2026-${periodLabel.slice(5)}`,
    source: "Exporter desk / buyer term sheet",
    sourceType: "Recent / indicative data",
    lastUpdated: new Date(periodStamp).toISOString().slice(0, 10),
  };

  const historicalTradeDataMeta = {
    category: "HISTORICAL TRADE DATA" as const,
    country: "UAE",
    commodity: "Onion",
    currency: "USD",
    unit: "kg",
    period: "2024-2025",
    source: "UN Comtrade historical trade database",
    sourceType: "Historical trade data",
    lastUpdated: new Date(periodStamp).toISOString().slice(0, 10),
  };

  const packagingCost = quantityQuintals * Math.max(0, input.packagingCostPerQuintal);
  const handlingCost = quantityQuintals * Math.max(0, input.handlingCostPerQuintal);
  const documentationCost = Math.max(0, input.documentationCost);
  const logisticsCost = Math.max(0, input.logisticsCost);
  const transportCost = Math.max(0, input.transportCost);

  const grossOfferRevenueInr = Number((quantityKg * exporterOffer.inrPerKg).toFixed(0));
  const exporterCharges = Number((grossOfferRevenueInr * Math.max(0, input.exporterChargesPct)).toFixed(0));
  const estimatedExportCosts = Number((packagingCost + handlingCost + documentationCost + logisticsCost + transportCost + exporterCharges).toFixed(0));

  const expectedFarmerRealization = Number((grossOfferRevenueInr - estimatedExportCosts).toFixed(0));
  const farmerProductionCost = quantityQuintals * Math.max(0, input.localPricePerQuintal);
  const expectedExportProfit = Number((expectedFarmerRealization - farmerProductionCost).toFixed(0));
  const exportBreakEven = Number(((farmerProductionCost + estimatedExportCosts) / Math.max(1, quantityQuintals)).toFixed(2));

  const priceDown10Pct = Number(((grossOfferRevenueInr * 0.90) - estimatedExportCosts).toFixed(0));
  const logisticsUp15Pct = Number(((grossOfferRevenueInr) - (estimatedExportCosts * 1.15)).toFixed(0));

  return {
    indicative: true,
    estimateType: "Indicative estimate",
    internationalReferencePrice,
    exporterOffer,
    referenceDataMeta,
    exporterOfferMeta,
    historicalTradeDataMeta,
    cropQuantityQuintals: quantityQuintals,
    cropQuantityKg: quantityKg,
    packagingCost,
    handlingCost,
    documentationCost,
    logisticsCost,
    transportCost,
    estimatedExportCosts,
    exporterCharges,
    currencyConversion: {
      inrPerUsd: inrPerUsd,
      usdPerKgReference: internationalReferencePrice.usdPerKg,
      usdPerKgOffer: exporterOffer.usdPerKg,
      timestamp: input.exchangeRateTimestamp,
    },
    expectedFarmerRealization,
    exportBreakEven,
    expectedExportProfit,
    exportRisk: "Indicative estimate — not a guaranteed export price; output is sensitive to freight, forex, buyer acceptance, and documentation timing.",
    sensitivity: {
      priceDown10Pct: priceDown10Pct,
      logisticsUp15Pct: logisticsUp15Pct,
    },
  };
}

export type ScenarioType = "CROP_SELLING" | "GROUP_SELLING" | "EXPORT";

export type ModelSelectionProfile = {
  scenario: ScenarioType;
  usesYieldPrediction: boolean;
  usesMandiPriceForecast: boolean;
  usesGroupAggregation: boolean;
  usesTransportEconomics: boolean;
  usesInternationalReference: boolean;
  usesExporterOffer: boolean;
  usesCurrency: boolean;
  usesExistingMarketIntelligence: boolean;
};

export function selectRelevantModelSources(scenario: ScenarioType): ModelSelectionProfile {
  switch (scenario) {
    case "CROP_SELLING":
      return {
        scenario,
        usesYieldPrediction: true,
        usesMandiPriceForecast: true,
        usesGroupAggregation: false,
        usesTransportEconomics: false,
        usesInternationalReference: false,
        usesExporterOffer: false,
        usesCurrency: false,
        usesExistingMarketIntelligence: true,
      };
    case "GROUP_SELLING":
      return {
        scenario,
        usesYieldPrediction: true,
        usesMandiPriceForecast: true,
        usesGroupAggregation: true,
        usesTransportEconomics: true,
        usesInternationalReference: false,
        usesExporterOffer: false,
        usesCurrency: false,
        usesExistingMarketIntelligence: true,
      };
    case "EXPORT":
      return {
        scenario,
        usesYieldPrediction: true,
        usesMandiPriceForecast: false,
        usesGroupAggregation: false,
        usesTransportEconomics: true,
        usesInternationalReference: true,
        usesExporterOffer: true,
        usesCurrency: true,
        usesExistingMarketIntelligence: true,
      };
    default:
      return {
        scenario: "CROP_SELLING",
        usesYieldPrediction: true,
        usesMandiPriceForecast: true,
        usesGroupAggregation: false,
        usesTransportEconomics: false,
        usesInternationalReference: false,
        usesExporterOffer: false,
        usesCurrency: false,
        usesExistingMarketIntelligence: true,
      };
  }
}

export type ModelDrivenScenarioInput = GroupSellingComparisonInput & {
  crop?: string;
  state?: string;
  soilPh?: number;
  rainfallMm?: number;
  avgTempC?: number;
  irrigationType?: string;
  exposureDays?: number;
  riskAppetite?: "Conservative" | "Balanced" | "Growth";
  scenario?: ScenarioType;
};

export type ModelDrivenGroupScenario = GroupSellingComparison & {
  derivedFromExistingModels: {
    yieldModelUsed: boolean;
    priceModelUsed: boolean;
    decisionScore: number;
    yieldEstimateQPerAcre: number;
    priceEstimateInrPerQuintal: number;
  };
};

export async function simulateGroupSellingComparisonWithML(
  input: ModelDrivenScenarioInput
): Promise<ModelDrivenGroupScenario> {
  const scenario = input.scenario ?? "GROUP_SELLING";
  const relevantSources = selectRelevantModelSources(scenario);

  const crop = input.crop || "Wheat";
  const rainfallMm = input.rainfallMm ?? 150;
  const soilPh = input.soilPh ?? 7.2;
  const avgTempC = input.avgTempC ?? 24;
  const irrigationType = input.irrigationType ?? "Rainfed";
  const state = input.state ?? "Punjab";

  const yieldResult = relevantSources.usesYieldPrediction
    ? await predictYieldWithML({
        crop,
        rainfall_mm: rainfallMm,
        soil_ph: soilPh,
        nitrogen_kg_per_ha: 120,
        avg_temp_c: avgTempC,
        state,
        irrigation_type: irrigationType,
      })
    : null;

  const priceResult = relevantSources.usesMandiPriceForecast
    ? await forecastPriceWithML({
        crop,
        months_ahead: 3,
        current_price_inr: input.groupSellingPricePerQuintal || 2200,
        rainfall_anomaly_mm: 0,
        trade_demand_index: 55,
        state,
        month: new Date().getMonth() + 1,
      })
    : null;

  const baseComparison = simulateGroupSellingComparison(input);
  const effectiveYieldQPerAcre = yieldResult?.predicted_yield_q_per_acre ?? Math.max(6, baseComparison.groupBreakEven / 100);
  const effectivePrice = priceResult?.forecasted_price_inr_per_quintal ?? baseComparison.expectedSellingPrice;

  const marketWeight = 0.2;
  const profitWeight = 0.2;
  const mspWeight = 0.15;
  const soilWeight = 0.1;
  const weatherWeight = 0.25;
  const costWeight = 0.1;

  const decisionScore = Math.round(
    (Math.min(100, Math.max(0, (yieldResult?.predicted_yield_q_per_acre ?? 12) * 4.5)) * weatherWeight) +
      (Math.min(100, Math.max(0, (priceResult?.price_change_pct ?? 5) * 12 + 60)) * marketWeight) +
      (Math.min(100, Math.max(0, 90 + (effectivePrice - 2000) / 30)) * mspWeight) +
      (Math.min(100, Math.max(0, ((effectivePrice / Math.max(1, effectiveYieldQPerAcre)) * 1.2)))) * profitWeight +
      (Math.min(100, Math.max(0, (soilPh >= 6.5 && soilPh <= 7.8 ? 88 : 72))) * soilWeight) +
      (Math.min(100, Math.max(0, 80 - (input.aggregationCostPerQuintal * 0.5)))) * costWeight
  );

  const updatedRevenue = Number((baseComparison.totalQuantity * effectivePrice).toFixed(0));
  const updatedCost = baseComparison.totalProductionCost +
    (baseComparison.totalQuantity * input.aggregationCostPerQuintal) +
    (baseComparison.totalQuantity * input.handlingCostPerQuintal) +
    (baseComparison.totalQuantity * input.storageCostPerQuintal) +
    input.groupTransactionCost;
  const updatedProfit = Number((updatedRevenue - updatedCost).toFixed(0));

  return {
    ...baseComparison,
    expectedSellingPrice: effectivePrice,
    groupRevenue: updatedRevenue,
    groupBreakEven: Number((updatedCost / Math.max(1, baseComparison.totalQuantity)).toFixed(2)),
    groupProfit: updatedProfit,
    groupProfitMargin: Number(((updatedProfit / Math.max(1, updatedRevenue)) * 100).toFixed(2)),
    additionalProfitFromAggregation: Number((updatedProfit - baseComparison.groupProfit).toFixed(0)),
    derivedFromExistingModels: {
      yieldModelUsed: Boolean(yieldResult),
      priceModelUsed: Boolean(priceResult),
      decisionScore,
      yieldEstimateQPerAcre: Number((effectiveYieldQPerAcre).toFixed(2)),
      priceEstimateInrPerQuintal: Number(effectivePrice.toFixed(2)),
    },
  };
}

