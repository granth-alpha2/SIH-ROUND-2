/**
 * AgriProfit — Soil & Fertilizer Persistence Repository
 * =====================================================
 * Supports PostgreSQL with PostGIS storage when DATABASE_URL is available,
 * and seamlessly falls back to global in-memory persistence for local/demo runtime.
 */

import { Pool } from "pg";
import {
  SoilReportRecord,
  SoilLayerRecord,
  analyzeSoilProfile,
  createDemoThreeLayerReport,
} from "./soil-service";
import { FertilizerPlanResult } from "./fertilizer-engine";

const globalStore = globalThis as typeof globalThis & {
  agriprofitSoilReports?: Map<string, SoilReportRecord>;
  agriprofitFertilizerPlans?: Map<string, FertilizerPlanResult>;
  agriprofitPool?: Pool;
};

const memorySoilReports =
  globalStore.agriprofitSoilReports ?? (globalStore.agriprofitSoilReports = new Map<string, SoilReportRecord>());
const memoryFertilizerPlans =
  globalStore.agriprofitFertilizerPlans ?? (globalStore.agriprofitFertilizerPlans = new Map<string, FertilizerPlanResult>());

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  return globalStore.agriprofitPool ?? (globalStore.agriprofitPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  }));
}

/**
 * Save or update a 3-layer soil test report
 */
export async function saveSoilReport(report: SoilReportRecord): Promise<SoilReportRecord> {
  const pool = getPool();
  if (!pool) {
    memorySoilReports.set(report.farmId, report);
    return report;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert or update soil_reports
    await client.query(
      `INSERT INTO soil_reports (
        id, farm_id, report_date, laboratory_name, sample_id, file_name,
        total_layers_analyzed, verification_status, overall_health_rating,
        limitations_detected, strengths_detected, cross_layer_summary, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (id) DO UPDATE SET
        verification_status = EXCLUDED.verification_status,
        overall_health_rating = EXCLUDED.overall_health_rating,
        limitations_detected = EXCLUDED.limitations_detected,
        strengths_detected = EXCLUDED.strengths_detected,
        cross_layer_summary = EXCLUDED.cross_layer_summary,
        updated_at = NOW()`,
      [
        report.id,
        report.farmId,
        report.reportDate,
        report.laboratoryName || null,
        report.sampleId || null,
        report.fileName || null,
        report.layers.length,
        report.verificationStatus,
        report.analysis.overallHealthRating,
        JSON.stringify(report.analysis.limitations),
        JSON.stringify(report.analysis.strengths),
        report.analysis.verticalSummary,
      ]
    );

    // Insert layers
    for (const layer of report.layers) {
      const layerRes = await client.query(
        `INSERT INTO soil_layers (
          soil_report_id, layer_number, depth_start_cm, depth_end_cm,
          layer_condition, limitation_notes
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (soil_report_id, layer_number) DO UPDATE SET
          depth_start_cm = EXCLUDED.depth_start_cm,
          depth_end_cm = EXCLUDED.depth_end_cm,
          layer_condition = EXCLUDED.layer_condition,
          limitation_notes = EXCLUDED.limitation_notes
        RETURNING id`,
        [
          report.id,
          layer.layerNumber,
          layer.depthStartCm,
          layer.depthEndCm,
          layer.condition,
          layer.limitations.join("; ") || null,
        ]
      );
      const layerId = layerRes.rows[0].id;

      // Insert parameters
      for (const [pName, param] of Object.entries(layer.parameters)) {
        await client.query(
          `INSERT INTO soil_parameters (
            soil_layer_id, parameter_name, parameter_category, original_value,
            original_unit, normalized_value, normalized_unit, confidence,
            source, status_rating
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (soil_layer_id, parameter_name) DO UPDATE SET
            original_value = EXCLUDED.original_value,
            normalized_value = EXCLUDED.normalized_value,
            confidence = EXCLUDED.confidence,
            status_rating = EXCLUDED.status_rating`,
          [
            layerId,
            pName,
            param.category,
            param.originalValue,
            param.originalUnit,
            param.normalizedValue,
            param.normalizedUnit,
            param.confidence,
            param.source,
            param.statusRating,
          ]
        );
      }
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    // Fall back to in-memory on error
    memorySoilReports.set(report.farmId, report);
  } finally {
    client.release();
  }

  return report;
}

/**
 * Get active soil report for a farm (with automatic demo report fallback)
 */
export async function getSoilReportByFarmId(farmId: string): Promise<SoilReportRecord> {
  const pool = getPool();
  if (!pool) {
    const existing = memorySoilReports.get(farmId);
    if (existing) return existing;
    const demo = createDemoThreeLayerReport(farmId);
    memorySoilReports.set(farmId, demo);
    return demo;
  }

  try {
    const repRes = await pool.query(
      `SELECT id, farm_id, report_date, laboratory_name, sample_id, file_name,
              verification_status, overall_health_rating, limitations_detected,
              strengths_detected, cross_layer_summary, created_at, updated_at
       FROM soil_reports WHERE farm_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [farmId]
    );

    if (repRes.rows.length === 0) {
      const demo = createDemoThreeLayerReport(farmId);
      await saveSoilReport(demo);
      return demo;
    }

    const r = repRes.rows[0];
    const layersRes = await pool.query(
      `SELECT id, layer_number, depth_start_cm, depth_end_cm, layer_condition, limitation_notes
       FROM soil_layers WHERE soil_report_id = $1 ORDER BY layer_number ASC`,
      [r.id]
    );

    const layers: SoilLayerRecord[] = [];
    for (const lRow of layersRes.rows) {
      const pRes = await pool.query(
        `SELECT parameter_name, parameter_category, original_value, original_unit,
                normalized_value, normalized_unit, confidence, source, status_rating
         FROM soil_parameters WHERE soil_layer_id = $1`,
        [lRow.id]
      );

      const params: SoilLayerRecord["parameters"] = {};
      for (const p of pRes.rows) {
        params[p.parameter_name] = {
          parameterName: p.parameter_name,
          category: p.parameter_category,
          originalValue: p.original_value !== null ? Number(p.original_value) : null,
          originalUnit: p.original_unit,
          normalizedValue: p.normalized_value !== null ? Number(p.normalized_value) : null,
          normalizedUnit: p.normalized_unit,
          confidence: Number(p.confidence),
          source: p.source,
          statusRating: p.status_rating,
          validationStatus: "valid",
        };
      }

      layers.push({
        layerNumber: lRow.layer_number as 1 | 2 | 3,
        depthStartCm: Number(lRow.depth_start_cm),
        depthEndCm: Number(lRow.depth_end_cm),
        parameters: params,
        condition: lRow.layer_condition,
        limitations: lRow.limitation_notes ? lRow.limitation_notes.split("; ") : [],
        strengths: [],
      });
    }

    const analysis = analyzeSoilProfile(layers);

    return {
      id: r.id,
      farmId: r.farm_id,
      reportDate: r.report_date.toISOString().slice(0, 10),
      laboratoryName: r.laboratory_name || undefined,
      sampleId: r.sample_id || undefined,
      fileName: r.file_name || undefined,
      verificationStatus: r.verification_status,
      layers,
      analysis,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    };
  } catch {
    const existing = memorySoilReports.get(farmId);
    if (existing) return existing;
    const demo = createDemoThreeLayerReport(farmId);
    memorySoilReports.set(farmId, demo);
    return demo;
  }
}

/**
 * Save fertilizer recommendation plan
 */
export async function saveFertilizerPlan(farmId: string, plan: FertilizerPlanResult): Promise<void> {
  const pool = getPool();
  memoryFertilizerPlans.set(`${farmId}_${plan.cropSlug}`, plan);

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO fertilizer_recommendations (
          farm_id, crop_slug, crop_name, target_yield_q_per_acre,
          n_requirement_kg_acre, p_requirement_kg_acre, k_requirement_kg_acre,
          recommended_sources, split_schedule, ph_advisory, ec_advisory,
          texture_advisory, weather_advisory, estimated_cost_inr,
          confidence_level, explainability_summary
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          farmId,
          plan.cropSlug,
          plan.cropName,
          15.0,
          plan.netNutrientRequirementKgPerAcre.nitrogen,
          plan.netNutrientRequirementKgPerAcre.phosphorus,
          plan.netNutrientRequirementKgPerAcre.potassium,
          JSON.stringify(plan.recommendedFertilizerSources),
          JSON.stringify(plan.stageWiseSplitSchedule),
          plan.phSalinityAdvisory,
          plan.phSalinityAdvisory,
          plan.soilConditionSummary.texture,
          plan.weatherAdvisory,
          plan.estimatedTotalCostInr,
          plan.confidenceRating,
          plan.explainability.whySourceSelected,
        ]
      );
    } catch {
      // Graceful fallback to memory
    }
  }
}
