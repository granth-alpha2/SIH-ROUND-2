-- Migration 004: Add Farmer Wish Crop & Comparison Snapshot Columns
-- Tracks when farmers test their own crop choices vs the AI recommendation

ALTER TABLE farm_plans
  ADD COLUMN IF NOT EXISTS farmer_wish_crop_slug TEXT,
  ADD COLUMN IF NOT EXISTS farmer_wish_comparison_snapshot JSONB;

COMMENT ON COLUMN farm_plans.farmer_wish_crop_slug IS 'Slug of the crop the farmer wished/inquired to grow instead of AI plan';
COMMENT ON COLUMN farm_plans.farmer_wish_comparison_snapshot IS 'Full side-by-side comparison snapshot for SIH persuasion & adoption telemetry';

