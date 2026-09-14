import { NextResponse } from "next/server";
import {
  buildCostSensitivityScenarios,
  buildPriceSensitivityScenarios,
  buildYieldSensitivityScenarios,
  calculateProfitabilitySnapshot,
  compareProfitabilityStrategies,
  normalizeWeight,
} from "@/lib/profitability-service";
import { recordAuditEvent } from "@/lib/audit-trail";
import { canAccessOwner, getRequestUser } from "@/lib/request-auth";
import { getFarm } from "@/app/api/farms/repository";

function generateAnalysisId() {
  return `profit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(request: Request) {
  try {
    const user = await getRequestUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));

    if (body.farmId) {
      const farm = await getFarm(String(body.farmId));
      if (!farm) {
        return NextResponse.json({ success: false, error: { code: "FARM_NOT_FOUND", message: "Farm record not found." } }, { status: 404 });
      }
      if (!canAccessOwner(user, farm.ownerId)) {
        return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "You do not own this farm." } }, { status: 403 });
      }
    }

    const crop = body.crop || body.cropName || "Wheat";
    const quantity = Number(body.quantity ?? 250);
    const quantityUnit = body.quantityUnit ?? "kg";
    const sellingPricePerUnit = Number(body.sellingPricePerUnit ?? 24);
    const sellingPriceUnit = body.sellingPriceUnit ?? "kg";
    const fixedCost = Number(body.fixedCost ?? 1200);
    const variableCostPerUnit = Number(body.variableCostPerUnit ?? 15);
    const variableCostUnit = body.variableCostUnit ?? "kg";
    const totalCost = body.totalCost !== undefined ? Number(body.totalCost) : undefined;
    const analysisId = generateAnalysisId();

    const snapshot = calculateProfitabilitySnapshot({
      quantity,
      quantityUnit,
      sellingPricePerUnit,
      sellingPriceUnit,
      fixedCost,
      variableCostPerUnit,
      variableCostUnit,
      totalCost,
    });

    const quantityQuintals = Number(
      body.quantityQuintals ?? (normalizeWeight(quantity, quantityUnit) / 100).toFixed(4)
    );

    const strategyComparison = compareProfitabilityStrategies({
      quantity,
      quantityUnit,
      fixedCost,
      variableCostPerUnit,
      variableCostUnit,
      mspPricePerUnit: Number(body.mspPricePerUnit ?? 22),
      mspPriceUnit: body.mspPriceUnit ?? "kg",
      directMarketPricePerUnit: Number(body.directMarketPricePerUnit ?? 25),
      directMarketPriceUnit: body.directMarketPriceUnit ?? "kg",
      directMarketExtraCostPerUnit: Number(body.directMarketExtraCostPerUnit ?? 1.5),
      directMarketExtraCostUnit: body.directMarketExtraCostUnit ?? "kg",
      groupSellingPricePerUnit: Number(body.groupSellingPricePerUnit ?? 27),
      groupSellingPriceUnit: body.groupSellingPriceUnit ?? "kg",
      groupAggregationCostPerUnit: Number(body.groupAggregationCostPerUnit ?? 1.2),
      groupAggregationCostUnit: body.groupAggregationCostUnit ?? "kg",
      groupHandlingCostPerUnit: Number(body.groupHandlingCostPerUnit ?? 0.8),
      groupHandlingCostUnit: body.groupHandlingCostUnit ?? "kg",
      groupStorageCostPerUnit: Number(body.groupStorageCostPerUnit ?? 0.5),
      groupStorageCostUnit: body.groupStorageCostUnit ?? "kg",
      groupTransactionCost: Number(body.groupTransactionCost ?? 400),
      exportOfferPerUnit: Number(body.exportOfferPerUnit ?? 28),
      exportOfferUnit: body.exportOfferUnit ?? "kg",
      exportPackagingCostPerUnit: Number(body.exportPackagingCostPerUnit ?? 1.0),
      exportPackagingCostUnit: body.exportPackagingCostUnit ?? "kg",
      exportDocumentationCost: Number(body.exportDocumentationCost ?? 400),
      exportLogisticsCost: Number(body.exportLogisticsCost ?? 600),
      exportTransportCost: Number(body.exportTransportCost ?? 500),
      exportChargesPct: Number(body.exportChargesPct ?? 4),
    });

    const priceSensitivity = buildPriceSensitivityScenarios({
      expectedPricePerQuintal: Number(body.expectedPricePerQuintal ?? sellingPricePerUnit),
      quantityQuintals,
      totalCost: Number(body.totalCost ?? snapshot.totalCost),
      baseScenarioPrices: Array.isArray(body.baseScenarioPrices)
        ? body.baseScenarioPrices.map(Number)
        : [20, 22, 24, 26, 28].map((value) => Number(value)),
    });

    const yieldSensitivity = buildYieldSensitivityScenarios({
      expectedYieldQuintals: Number(body.expectedYieldQuintals ?? quantityQuintals),
      sellingPricePerQuintal: Number(body.expectedPricePerQuintal ?? sellingPricePerUnit),
      totalCost: Number(body.totalCost ?? snapshot.totalCost),
      baseScenarioYields: Array.isArray(body.baseScenarioYields)
        ? body.baseScenarioYields.map(Number)
        : [18, 21, 24, 27, 30].map((value) => Number(value)),
    });

    const costSensitivity = buildCostSensitivityScenarios({
      expectedYieldQuintals: Number(body.expectedYieldQuintals ?? quantityQuintals),
      sellingPricePerQuintal: Number(body.expectedPricePerQuintal ?? sellingPricePerUnit),
      baseTotalCost: Number(body.totalCost ?? snapshot.totalCost),
      inputCost: Number(body.inputCost ?? fixedCost),
      laborCost: Number(body.laborCost ?? fixedCost * 0.45),
      transportCost: Number(body.transportCost ?? fixedCost * 0.2),
      baseScenarioLabels: Array.isArray(body.baseScenarioLabels)
        ? body.baseScenarioLabels
        : [
            { label: "Base case", inputPct: 0, laborPct: 0, transportPct: 0 },
            { label: "+10% input cost", inputPct: 10, laborPct: 0, transportPct: 0 },
            { label: "+20% labor cost", inputPct: 0, laborPct: 20, transportPct: 0 },
            { label: "+15% transport cost", inputPct: 0, laborPct: 0, transportPct: 15 },
            { label: "Combined shock", inputPct: 10, laborPct: 15, transportPct: 20 },
          ],
    });

    const risk =
      snapshot.profit > 0 && snapshot.profitMargin >= 15
        ? "LOW"
        : snapshot.profit > 0
          ? "MODERATE"
          : snapshot.profit === 0
            ? "BREAK_EVEN"
            : "HIGH";

    const response = {
      success: true,
      analysis_id: analysisId,
      scenario: body.scenario || "base_case",
      farm_context: {
        farmId: body.farmId || null,
        district: body.district || null,
        state: body.state || null,
        season: body.season || "Rabi",
      },
      crop,
      quantity: {
        value: quantity,
        unit: quantityUnit,
        quintals: quantityQuintals,
      },
      cost_breakdown: {
        fixed_cost: snapshot.fixedCost,
        variable_cost: snapshot.variableCost,
        total_cost: snapshot.totalCost,
        variable_cost_per_unit: variableCostPerUnit,
        variable_cost_unit: variableCostUnit,
      },
      market_data: {
        selling_price_per_unit: sellingPricePerUnit,
        selling_price_unit: sellingPriceUnit,
        msp_price_per_unit: Number(body.mspPricePerUnit ?? 22),
        direct_market_price_per_unit: Number(body.directMarketPricePerUnit ?? 25),
        group_selling_price_per_unit: Number(body.groupSellingPricePerUnit ?? 27),
        export_offer_per_unit: Number(body.exportOfferPerUnit ?? 28),
      },
      ml_predictions: {
        predicted_price: snapshot.predictedPrice,
        predicted_quantity: snapshot.predictedQuantity,
        predicted_revenue: snapshot.predictedRevenue,
        predicted_profit: snapshot.predictedProfit,
        model_inputs: {
          yield_model_used: Boolean(body.useYieldModel ?? true),
          price_model_used: Boolean(body.usePriceModel ?? true),
        },
      },
      break_even: {
        quantity: snapshot.breakEvenQuantity,
        price: snapshot.breakEvenPrice,
      },
      revenue: snapshot.revenue,
      profit: snapshot.profit,
      margin: snapshot.profitMargin,
      roi: snapshot.roi,
      risk,
      sensitivity: {
        price: priceSensitivity,
        yield: yieldSensitivity,
        cost: costSensitivity,
      },
      strategy_comparison: strategyComparison,
      models_used: {
        yield: body.yieldModel || "internal-baseline",
        price: body.priceModel || "internal-baseline",
      },
      data_sources: [
        "AgriProfit benchmark dataset",
        "Market pricing inputs",
        "ML forecast service",
        "Farm context input",
      ],
      data_freshness: {
        as_of: new Date().toISOString(),
        status: "derived_from_submitted_and_benchmark_inputs",
      },
      assumptions: {
        fixed_cost_includes: ["land preparation", "equipment", "overheads"],
        variable_cost_includes: ["seed", "fertilizer", "labor", "irrigation"],
        export_price_is_indicative: true,
      },
      timestamp: new Date().toISOString(),
    };

    const actor = user.sub;
    await Promise.all([
      recordAuditEvent({
        event: "PROFITABILITY_ANALYSIS_CREATED",
        actor,
        analysisId,
        dataSource: "Farm context and profitability request",
        metadata: { crop: String(crop), scenario: String(response.scenario) },
      }),
      recordAuditEvent({
        event: "SCENARIO_CALCULATED",
        actor,
        analysisId,
        dataSource: "Deterministic profitability engine",
        metadata: { scenario: String(response.scenario), quantityUnit: String(quantityUnit) },
      }),
      recordAuditEvent({
        event: "PROFITABILITY_RESULT_GENERATED",
        actor,
        analysisId,
        dataSource: "Deterministic profitability engine",
        metadata: { risk: String(response.risk), model: "deterministic-financial-engine" },
      }),
      ...(response.ml_predictions.model_inputs.yield_model_used || response.ml_predictions.model_inputs.price_model_used
        ? [recordAuditEvent({
            event: "MODEL_PREDICTION_USED",
            actor,
            analysisId,
            modelVersion: String(body.yieldModel || body.priceModel || "configured-ML-model"),
            dataSource: "ML prediction service",
            metadata: {
              yieldModelUsed: response.ml_predictions.model_inputs.yield_model_used,
              priceModelUsed: response.ml_predictions.model_inputs.price_model_used,
            },
          })]
        : []),
      recordAuditEvent({
        event: "MARKET_DATA_USED",
        actor,
        analysisId,
        dataSource: "Market pricing inputs",
        metadata: { sellingPriceUnit: String(sellingPriceUnit) },
      }),
    ]);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PROFITABILITY_CALCULATION_FAILED",
          message: error instanceof Error ? error.message : "Unable to calculate profitability metrics.",
        },
      },
      { status: 500 }
    );
  }
}
