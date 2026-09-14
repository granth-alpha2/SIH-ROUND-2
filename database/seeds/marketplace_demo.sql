-- =============================================================================
-- AgriProfit Seed: Marketplace Demonstration Data
-- =============================================================================

-- 1. Procurement Centers
INSERT INTO procurement_centers (id, name, agency, district, state, address, contact_phone, latitude, longitude)
VALUES
('PC-PB-LDH-01', 'FCI Central Grain Silo & Mandi Complex', 'Food Corporation of India (FCI)', 'Ludhiana', 'Punjab', 'GT Road, Grain Market, Ludhiana', '+91-161-2401928', 30.9010, 75.8573),
('PC-PB-LDH-02', 'PUNGRAIN Sub-Depot Doraha', 'PUNGRAIN', 'Ludhiana', 'Punjab', 'Near Doraha Mandi Yard, Ludhiana', '+91-161-2651433', 30.7981, 76.0354),
('PC-HR-KRN-01', 'HAFED Mega Procurement Complex', 'HAFED', 'Karnal', 'Haryana', 'Railway Road, Karnal Grain Market', '+91-184-2259102', 29.6857, 76.9905),
('PC-RJ-KOT-01', 'NAFED Mustard Procurement Hub', 'NAFED', 'Kota', 'Rajasthan', 'Bhamashah Mandi Yard, Kota', '+91-744-2490184', 25.1768, 75.8577),
('PC-MP-IND-01', 'MP State Civil Supplies Corporation', 'MPSCSC', 'Indore', 'Madhya Pradesh', 'Choithram Mandi Road, Indore', '+91-731-2703819', 22.7196, 75.8577)
ON CONFLICT (id) DO NOTHING;

-- 2. Registered Indian Exporters
INSERT INTO marketplace_exporters (id, company_name, contact_person, email, phone, location_city, location_state, crops_handled, destination_countries, min_order_quintals, is_verified, iec_code, apeda_registration)
VALUES
('EXP-001', 'Bharat Agro International Pvt. Ltd.', 'Vikramaditya Singhania', 'exports@bharatagro.in', '+91-9811002233', 'Mumbai', 'Maharashtra', ARRAY['Wheat', 'Rice (Paddy)', 'Mustard'], ARRAY['UAE', 'Saudi Arabia', 'Bangladesh', 'Malaysia'], 100, TRUE, '0398014521', 'APEDA/MUM/2022/984'),
('EXP-002', 'Indus Global Agri Commodities', 'Sunil Narang', 'trade@indusglobal.co.in', '+91-9872119944', 'New Delhi', 'Delhi', ARRAY['Wheat', 'Gram (Chickpea)', 'Barley (Jau)', 'Maize'], ARRAY['Bangladesh', 'Nepal', 'Vietnam', 'Indonesia'], 80, TRUE, '0501029481', 'APEDA/DEL/2021/412'),
('EXP-003', 'Satluj Harvests Exim Corp', 'Harpreet Singh Sandhu', 'info@satlujexim.com', '+91-9814055221', 'Ludhiana', 'Punjab', ARRAY['Wheat', 'Mustard', 'Lentil / Masoor'], ARRAY['United Kingdom', 'Singapore', 'UAE'], 50, TRUE, '0799018234', 'APEDA/LDH/2023/119'),
('EXP-004', 'Deccan Spice & Crop Linkers', 'K. Venkat Raman', 'venkat@deccanexports.com', '+91-9440182736', 'Hyderabad', 'Telangana', ARRAY['Cotton', 'Soybean', 'Pigeon Pea / Arhar (Tur)'], ARRAY['China', 'Vietnam', 'United States'], 120, TRUE, '0905012398', 'APEDA/HYD/2020/731')
ON CONFLICT (id) DO NOTHING;

