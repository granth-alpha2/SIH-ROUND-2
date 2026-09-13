-- =============================================================================
-- AgriProfit Migration 005 — Secondary Marketplace & Direct Farm-to-Market
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Extend user role check if table exists
DO $$
BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('farmer', 'fpo_admin', 'platform_admin', 'government_buyer', 'private_buyer', 'exporter', 'admin'));
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

-- 2. Procurement Centers Master
CREATE TABLE IF NOT EXISTS procurement_centers (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    agency VARCHAR(50) NOT NULL, -- 'FCI', 'NAFED', 'HAFED', 'MARKFED', etc.
    district VARCHAR(60) NOT NULL,
    state VARCHAR(60) NOT NULL,
    address TEXT,
    contact_phone VARCHAR(20),
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. MSP Procurement Requests (Mode A: Farmer -> Government)
CREATE TABLE IF NOT EXISTS msp_procurement_requests (
    id VARCHAR(36) PRIMARY KEY,
    farmer_id VARCHAR(32) NOT NULL,
    farmer_name VARCHAR(100) NOT NULL,
    farmer_phone VARCHAR(20) NOT NULL,
    farm_id VARCHAR(36),
    farm_name VARCHAR(100),
    crop_id VARCHAR(32) NOT NULL,
    crop_name VARCHAR(80) NOT NULL,
    crop_slug VARCHAR(50) NOT NULL,
    season VARCHAR(20) NOT NULL, -- Kharif, Rabi, Commercial
    requested_quantity_quintals NUMERIC(10,2) NOT NULL CHECK (requested_quantity_quintals > 0),
    original_unit VARCHAR(10) NOT NULL DEFAULT 'quintal', -- 'kg', 'quintal', 'tonne'
    original_quantity NUMERIC(10,2) NOT NULL,
    crop_grade VARCHAR(20) NOT NULL DEFAULT 'Grade-A',
    expected_harvest_date DATE,
    procurement_center_id VARCHAR(32) REFERENCES procurement_centers(id),
    procurement_center_name VARCHAR(100),
    official_msp_rate_inr NUMERIC(10,2) NOT NULL CHECK (official_msp_rate_inr > 0),
    msp_source_reference TEXT NOT NULL,
    msp_last_verified_at TIMESTAMPTZ NOT NULL,
    mandi_modal_reference_inr NUMERIC(10,2),
    ml_expected_price_inr NUMERIC(10,2),
    estimated_gross_payout_inr NUMERIC(14,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'UNDER_REVIEW', 'APPROVED', 'CODE_GENERATED', 'ARRIVED',
        'CODE_VERIFIED', 'BIOMETRIC_VERIFIED', 'WEIGHED', 'COMPLETED',
        'PAYMENT_INITIATED', 'PAID', 'REJECTED', 'EXPIRED', 'CANCELLED'
    )),
    rejection_reason TEXT,
    reviewed_by_officer_id VARCHAR(36),
    reviewed_by_officer_name VARCHAR(100),
    reviewed_at TIMESTAMPTZ,
    actual_weighed_quantity_quintals NUMERIC(10,2),
    final_payout_inr NUMERIC(14,2),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAYMENT_INITIATED', 'PROCESSING', 'PAID')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msp_req_farmer ON msp_procurement_requests(farmer_id, status);
CREATE INDEX IF NOT EXISTS idx_msp_req_status ON msp_procurement_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_msp_req_center ON msp_procurement_requests(procurement_center_id);

-- 4. MSP 12-Digit Authorization Codes
CREATE TABLE IF NOT EXISTS msp_authorization_codes (
    code VARCHAR(12) PRIMARY KEY, -- exactly 12 numeric digits
    request_id VARCHAR(36) NOT NULL REFERENCES msp_procurement_requests(id) ON DELETE CASCADE,
    farmer_id VARCHAR(32) NOT NULL,
    crop_slug VARCHAR(50) NOT NULL,
    approved_quantity_quintals NUMERIC(10,2) NOT NULL,
    procurement_center_id VARCHAR(32) NOT NULL REFERENCES procurement_centers(id),
    expires_at TIMESTAMPTZ NOT NULL,
    is_consumed BOOLEAN NOT NULL DEFAULT FALSE,
    consumed_at TIMESTAMPTZ,
    consumed_by_officer_id VARCHAR(36),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_12_digits CHECK (code ~ '^[0-9]{12}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_code_request ON msp_authorization_codes(request_id);

-- 5. Biometric & Verification Audit Events
CREATE TABLE IF NOT EXISTS msp_verification_events (
    id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(36) NOT NULL REFERENCES msp_procurement_requests(id) ON DELETE CASCADE,
    farmer_id VARCHAR(32) NOT NULL,
    officer_id VARCHAR(36) NOT NULL,
    verification_method VARCHAR(40) NOT NULL DEFAULT 'EYE_BIOMETRIC_DEMO', -- 'EYE_BIOMETRIC_DEMO', 'AADHAAR_OTP_DEMO'
    provider_name VARCHAR(60) NOT NULL DEFAULT 'DemoBiometricProvider',
    provider_reference_id VARCHAR(64) NOT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS', -- 'SUCCESS', 'FAILED'
    verification_note TEXT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Direct Marketplace Listings (Mode B: Farmer -> Private Buyer)
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id VARCHAR(36) PRIMARY KEY,
    farmer_id VARCHAR(32) NOT NULL,
    farmer_name VARCHAR(100) NOT NULL,
    farmer_phone VARCHAR(20) NOT NULL,
    farm_id VARCHAR(36),
    crop_id VARCHAR(32) NOT NULL,
    crop_name VARCHAR(80) NOT NULL,
    crop_slug VARCHAR(50) NOT NULL,
    variety VARCHAR(60),
    quantity_quintals NUMERIC(10,2) NOT NULL CHECK (quantity_quintals > 0),
    available_quantity_quintals NUMERIC(10,2) NOT NULL CHECK (available_quantity_quintals >= 0),
    asking_price_inr_per_quintal NUMERIC(10,2) NOT NULL CHECK (asking_price_inr_per_quintal > 0),
    min_acceptable_price_inr NUMERIC(10,2) NOT NULL CHECK (min_acceptable_price_inr > 0),
    quality_grade VARCHAR(20) NOT NULL DEFAULT 'Standard',
    harvest_date DATE,
    available_date DATE NOT NULL,
    district VARCHAR(60) NOT NULL,
    state VARCHAR(60) NOT NULL,
    delivery_terms VARCHAR(40) NOT NULL DEFAULT 'FARM_PICKUP', -- 'FARM_PICKUP', 'MANDI_DELIVERY', 'BUYER_LOGISTICS'
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN (
        'DRAFT', 'ACTIVE', 'OFFER_RECEIVED', 'NEGOTIATING', 'ACCEPTED',
        'FULFILLMENT_PENDING', 'DELIVERED', 'PAYMENT_PENDING', 'COMPLETED', 'CANCELLED'
    )),
    msp_reference_inr NUMERIC(10,2),
    mandi_modal_reference_inr NUMERIC(10,2),
    ml_expected_price_inr NUMERIC(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_crop ON marketplace_listings(crop_slug, status);
CREATE INDEX IF NOT EXISTS idx_listings_farmer ON marketplace_listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_listings_location ON marketplace_listings(state, district);

-- 7. Direct Market Buyer Offers
CREATE TABLE IF NOT EXISTS marketplace_offers (
    id VARCHAR(36) PRIMARY KEY,
    listing_id VARCHAR(36) NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    buyer_id VARCHAR(36) NOT NULL,
    buyer_name VARCHAR(100) NOT NULL,
    buyer_phone VARCHAR(20) NOT NULL,
    buyer_company VARCHAR(100),
    offered_quantity_quintals NUMERIC(10,2) NOT NULL CHECK (offered_quantity_quintals > 0),
    offered_price_inr_per_quintal NUMERIC(10,2) NOT NULL CHECK (offered_price_inr_per_quintal > 0),
    counter_price_inr_per_quintal NUMERIC(10,2),
    message TEXT,
    delivery_location VARCHAR(120),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_listing ON marketplace_offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON marketplace_offers(buyer_id);

-- 8. Group Selling Entities
CREATE TABLE IF NOT EXISTS marketplace_groups (
    id VARCHAR(36) PRIMARY KEY,
    group_code VARCHAR(32) NOT NULL UNIQUE, -- e.g. GRP-WHEAT-2026-001
    crop_name VARCHAR(80) NOT NULL,
    crop_slug VARCHAR(50) NOT NULL,
    target_quantity_quintals NUMERIC(10,2) NOT NULL CHECK (target_quantity_quintals > 0),
    pooled_quantity_quintals NUMERIC(10,2) NOT NULL DEFAULT 0,
    member_count INT NOT NULL DEFAULT 0,
    district VARCHAR(60) NOT NULL,
    state VARCHAR(60) NOT NULL,
    min_acceptable_price_inr NUMERIC(10,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN (
        'OPEN', 'TARGET_REACHED', 'OFFER_RECEIVED', 'ACCEPTED', 'FULFILLED', 'CANCELLED'
    )),
    compatibility_score NUMERIC(5,2) DEFAULT 92.0,
    created_by_farmer_id VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_group_members (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) NOT NULL REFERENCES marketplace_groups(id) ON DELETE CASCADE,
    farmer_id VARCHAR(32) NOT NULL,
    farmer_name VARCHAR(100) NOT NULL,
    farmer_phone VARCHAR(20) NOT NULL,
    contributed_quantity_quintals NUMERIC(10,2) NOT NULL CHECK (contributed_quantity_quintals > 0),
    agreed_price_inr_per_quintal NUMERIC(10,2) NOT NULL,
    village VARCHAR(60),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (group_id, farmer_id)
);

-- 9. Exporters Directory & Export Matches
CREATE TABLE IF NOT EXISTS marketplace_exporters (
    id VARCHAR(36) PRIMARY KEY,
    company_name VARCHAR(120) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    location_city VARCHAR(60) NOT NULL,
    location_state VARCHAR(60) NOT NULL,
    crops_handled TEXT[] NOT NULL DEFAULT '{}',
    destination_countries TEXT[] NOT NULL DEFAULT '{}',
    min_order_quintals NUMERIC(10,2) NOT NULL DEFAULT 50,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    iec_code VARCHAR(30), -- Import Export Code reference
    apeda_registration VARCHAR(40),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_export_matches (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) REFERENCES marketplace_groups(id) ON DELETE SET NULL,
    farmer_id VARCHAR(32),
    exporter_id VARCHAR(36) NOT NULL REFERENCES marketplace_exporters(id),
    crop_name VARCHAR(80) NOT NULL,
    destination_country VARCHAR(60) NOT NULL,
    total_quantity_quintals NUMERIC(10,2) NOT NULL,
    offered_price_inr_per_quintal NUMERIC(10,2) NOT NULL,
    international_reference_price_inr_per_quintal NUMERIC(10,2) NOT NULL,
    estimated_logistics_cost_inr NUMERIC(10,2) NOT NULL,
    exporter_margin_inr NUMERIC(10,2) NOT NULL,
    indicative_farmer_realization_inr NUMERIC(10,2) NOT NULL,
    match_score NUMERIC(5,2) NOT NULL DEFAULT 94.0,
    status VARCHAR(30) NOT NULL DEFAULT 'GROUP_OPEN' CHECK (status IN (
        'GROUP_OPEN', 'GROUP_FILLED', 'EXPORTER_MATCHED', 'OFFER_RECEIVED',
        'OFFER_ACCEPTED', 'LOGISTICS_PENDING', 'FULFILLMENT', 'COMPLETED'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Platform Ledger / Transactions & Demo Payment Records
CREATE TABLE IF NOT EXISTS marketplace_transactions (
    id VARCHAR(36) PRIMARY KEY,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('MSP_PROCUREMENT', 'DIRECT_MARKET', 'GROUP_SALE', 'EXPORT')),
    reference_id VARCHAR(36) NOT NULL, -- msp request ID, listing offer ID, or export match ID
    farmer_id VARCHAR(32) NOT NULL,
    farmer_name VARCHAR(100) NOT NULL,
    buyer_id VARCHAR(36) NOT NULL,
    buyer_name VARCHAR(100) NOT NULL,
    crop_name VARCHAR(80) NOT NULL,
    quantity_quintals NUMERIC(10,2) NOT NULL,
    rate_inr_per_quintal NUMERIC(10,2) NOT NULL,
    gross_amount_inr NUMERIC(14,2) NOT NULL,
    net_payout_inr NUMERIC(14,2) NOT NULL,
    payment_id VARCHAR(36) NOT NULL,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PAID_DEMO' CHECK (payment_status IN ('PAYMENT_INITIATED', 'PROCESSING', 'PAID_DEMO', 'FAILED')),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'GOVT_DIRECT_BENEFIT_DEMO',
    procurement_receipt_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_farmer ON marketplace_transactions(farmer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_type ON marketplace_transactions(transaction_type);

-- 11. Immutable Audit Log
CREATE TABLE IF NOT EXISTS marketplace_audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    actor_id VARCHAR(36) NOT NULL,
    actor_name VARCHAR(100) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    entity_type VARCHAR(40) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON marketplace_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_time ON marketplace_audit_logs(created_at DESC);

COMMIT;

