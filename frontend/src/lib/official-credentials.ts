/**
 * AgriProfit Official Credentials Registry
 * ========================================
 * Authoritative credential store for Government Procurement Officers (FCI / State Civil Supplies)
 * and APEDA / DGFT Licensed Agricultural Exporters.
 *
 * Implements strict ID & Password verification for restricted bilateral consoles.
 */

import { MarketplaceUserRole } from "./marketplace-types";

export interface OfficialOfficerRecord {
  id: string; // Official Officer ID / Employee Code
  aliases: string[]; // Alternate case-insensitive matching IDs
  password: string; // Official secure password
  name: string;
  department: string;
  designation: string;
  badge: string;
  stationId: string;
  stationName: string;
  jurisdiction: string;
  phone: string;
  role: MarketplaceUserRole;
}

export interface OfficialExporterRecord {
  id: string; // DGFT Import-Export Code (IEC) or APEDA License
  aliases: string[];
  password: string; // Corporate Trade Desk password
  name: string;
  organization: string;
  designation: string;
  badge: string;
  tradeDesk: string;
  port: string;
  phone: string;
  role: MarketplaceUserRole;
}

export const REGISTERED_GOVERNMENT_OFFICERS: OfficialOfficerRecord[] = [
  {
    id: "FCI-PB-994",
    aliases: ["PB-LDH-01", "FCI994", "FCI-OFFICER-1"],
    password: "FCI@Govt#2026",
    name: "Officer S. Sharma",
    department: "Food Corporation of India (FCI)",
    designation: "Mandi In-Charge & Procurement Superintendent",
    badge: "FCI-PB-994",
    stationId: "PB-LDH-01",
    stationName: "Khanna Grain Hub / Doraha Silo Mandi Terminal",
    jurisdiction: "Ludhiana District, Punjab",
    phone: "9876500001",
    role: "government_buyer",
  },
  {
    id: "PUNG-LDH-042",
    aliases: ["PB-LDH-02", "PUNG042", "INSPECTOR-VERMA"],
    password: "Pungrain@2026",
    name: "Inspector R. K. Verma",
    department: "Punjab State Civil Supplies Corporation (PUNGRAIN)",
    designation: "Chief Weighbridge Inspector & DBT Verifier",
    badge: "PUNG-LDH-042",
    stationId: "PB-LDH-02",
    stationName: "Ludhiana Central Mandi Yard Terminal",
    jurisdiction: "Ludhiana Central, Punjab",
    phone: "9876500002",
    role: "government_buyer",
  },
  {
    id: "FCI-HR-108",
    aliases: ["HR-KRN-01", "FCI108", "AMIT-DESHMUKH"],
    password: "Haryana@FCI#2026",
    name: "Officer Amit Deshmukh",
    department: "Food Corporation of India (FCI)",
    designation: "Regional Quality Control & Silo Intake Officer",
    badge: "FCI-HR-108",
    stationId: "HR-KRN-01",
    stationName: "Karnal Grain Silo Intake Center",
    jurisdiction: "Karnal Agro-Belt, Haryana",
    phone: "9876500007",
    role: "government_buyer",
  },
];

export const REGISTERED_EXPORTERS: OfficialExporterRecord[] = [
  {
    id: "IEC-0519928341",
    aliases: ["APEDA-DEL-9981", "SUN-AGRI", "0519928341"],
    password: "Export@Sun#2026",
    name: "Sun Agri Exports Pvt Ltd",
    organization: "Sun Agri Exports Private Limited",
    designation: "APEDA Verified Agricultural Export Desk (Category-A)",
    badge: "APEDA/2023/DEL/9981",
    tradeDesk: "Middle East, Gulf & EU Trade Desk",
    port: "Jawaharlal Nehru Port (JNPT) / Nhava Sheva",
    phone: "9876500005",
    role: "exporter",
  },
  {
    id: "IEC-0308817290",
    aliases: ["DGFT-MUM-4421", "BHARAT-GLOBAL", "0308817290"],
    password: "BharatTrade@2026",
    name: "Bharat Global Trade Hub",
    organization: "Bharat Global Trade Logistics Consortium",
    designation: "Directorate General of Foreign Trade (DGFT) Licensed Exporter",
    badge: "IEC: 0308817290",
    tradeDesk: "South-East Asia & African Sourcing Corridor",
    port: "Mundra Port Agro Terminal, Gujarat",
    phone: "9876500006",
    role: "exporter",
  },
  {
    id: "IEC-0714490123",
    aliases: ["INDO-GULF", "0714490123"],
    password: "IndoGulf@2026",
    name: "Indo-Gulf Commodity Exporters",
    organization: "Indo-Gulf Agri Commodities Ltd",
    designation: "APEDA Certified Basmati, Pulses & Oilseeds House",
    badge: "APEDA/2024/MUM/7712",
    tradeDesk: "UAE, Saudi Arabia & ASEAN Trade Window",
    port: "Kandla Maritime Freight Gateway",
    phone: "9876500008",
    role: "exporter",
  },
];

/**
 * Validates Government Procurement Officer credentials by Officer ID and Password.
 */
export function verifyOfficerCredentials(
  identifier: string,
  password: string
): OfficialOfficerRecord | null {
  if (!identifier || !password) return null;
  const cleanId = identifier.trim().toUpperCase();
  const cleanPass = password.trim();

  const found = REGISTERED_GOVERNMENT_OFFICERS.find((officer) => {
    const idMatches =
      officer.id.toUpperCase() === cleanId ||
      officer.stationId.toUpperCase() === cleanId ||
      officer.aliases.some((a) => a.toUpperCase() === cleanId);
    return idMatches && officer.password === cleanPass;
  });

  return found || null;
}

/**
 * Validates Exporter credentials by IEC Code or APEDA Registration and Password.
 */
export function verifyExporterCredentials(
  identifier: string,
  password: string
): OfficialExporterRecord | null {
  if (!identifier || !password) return null;
  const cleanId = identifier.trim().toUpperCase();
  const cleanPass = password.trim();

  const found = REGISTERED_EXPORTERS.find((exp) => {
    const idMatches =
      exp.id.toUpperCase() === cleanId ||
      exp.badge.toUpperCase().includes(cleanId) ||
      exp.aliases.some((a) => a.toUpperCase() === cleanId);
    return idMatches && exp.password === cleanPass;
  });

  return found || null;
}
