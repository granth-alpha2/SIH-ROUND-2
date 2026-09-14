import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-auth";
import { canAccessOwner } from "@/lib/request-auth";
import { getFarm } from "@/app/api/farms/repository";
import { recordAuditEvent } from "@/lib/audit-trail";
import { Pool } from "pg";

const globalStore = globalThis as typeof globalThis & {
  agriprofitOutcomePool?: Pool;
  agriprofitOutcomes?: Array<Record<string, unknown>>;
};
const memoryOutcomes = globalStore.agriprofitOutcomes ?? (globalStore.agriprofitOutcomes = []);

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  return globalStore.agriprofitOutcomePool ?? (globalStore.agriprofitOutcomePool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }));
}

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.analysisId !== "string" || !Number.isFinite(Number(body.actualQuantity)) || !Number.isFinite(Number(body.actualPriceInr))) {
    return NextResponse.json({ success: false, error: { code: "INVALID_OUTCOME", message: "analysisId, actualQuantity, and actualPriceInr are required finite values." } }, { status: 400 });
  }

  if (body.farmId) {
    const farm = await getFarm(String(body.farmId));
    if (!farm) return NextResponse.json({ success: false, error: { code: "FARM_NOT_FOUND", message: "Farm record not found." } }, { status: 404 });
    if (!canAccessOwner(user, farm.ownerId)) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "You do not own this farm." } }, { status: 403 });
  }

  const actualQuantity = Number(body.actualQuantity);
  const actualPriceInr = Number(body.actualPriceInr);
  const actualRevenueInr = Number((actualQuantity * actualPriceInr).toFixed(2));
  const actualCostInr = Number(body.actualCostInr ?? 0);
  const actualProfitInr = Number((actualRevenueInr - actualCostInr).toFixed(2));
  const outcome = {
    analysisId: body.analysisId,
    scenario: body.scenario ?? "DIRECT_MARKET",
    actorId: user.sub,
    farmId: body.farmId ?? null,
    actualQuantity,
    actualPriceInr,
    actualRevenueInr,
    actualCostInr,
    actualProfitInr,
    observedAt: new Date().toISOString(),
  };

  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO actual_outcomes
          (analysis_id, actual_quantity, quantity_unit, actual_price_inr, actual_revenue_inr, actual_cost_inr, actual_profit_inr, predicted_quantity, predicted_price_inr, predicted_revenue_inr, predicted_profit_inr, observed_at, source, notes)
         VALUES ($1, $2, 'quintal', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [outcome.analysisId, actualQuantity, actualPriceInr, actualRevenueInr, actualCostInr, actualProfitInr, body.predicted?.quantity ?? null, body.predicted?.price ?? null, body.predicted?.revenue ?? null, body.predicted?.profit ?? null, outcome.observedAt, "farmer-confirmed-marketplace-transaction", "Prediction-versus-actual outcome recorded by authenticated farmer."],
      );
    } catch (error) {
      console.warn("[Outcome] Database persistence failed; retaining outcome in memory:", error);
      memoryOutcomes.push(outcome);
    }
  } else {
    memoryOutcomes.push(outcome);
  }

  await recordAuditEvent({
    event: "ACTUAL_OUTCOME_RECORDED",
    actor: user.sub,
    analysisId: outcome.analysisId,
    dataSource: "Farmer-confirmed marketplace transaction",
    metadata: { scenario: String(outcome.scenario), actualQuantity, actualPriceInr, actualProfitInr },
  });

  return NextResponse.json({ success: true, outcome, predictionActual: { predicted: body.predicted ?? null, actual: outcome } }, { status: 201 });
}
