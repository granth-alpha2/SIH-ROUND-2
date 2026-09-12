"use client";

import { useState } from "react";
import AppShell from "../components/AppShell";

type GovernmentScheme = {
  id: string;
  name: string;
  hindiName: string;
  ministry: string;
  category: "Direct Income Support" | "Crop Insurance" | "Credit & Finance" | "Infrastructure" | "Soil & Inputs" | "Irrigation & Water";
  financialBenefit: string;
  purpose: string;
  whoCanApply: string;
  eligibility: string[];
  documentsRequired: string[];
  howToApply: string[];
  officialPortalUrl: string;
  portalName: string;
  lastUpdated: string;
};

const SCHEMES_DATABASE: GovernmentScheme[] = [
  {
    id: "SCHEME_001",
    name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    hindiName: "प्रधानमंत्री किसान सम्मान निधि",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    category: "Direct Income Support",
    financialBenefit: "₹6,000 per year in 3 equal four-monthly installments of ₹2,000 directly to Aadhaar-seeded bank account.",
    purpose: "To augment the income of all landholding farmers' families across India to procure agricultural inputs and manage domestic needs.",
    whoCanApply: "All landholding farmer families having cultivable land in their names, subject to standard exclusion criteria.",
    eligibility: [
      "Farmer family must own cultivable agricultural land registered in land revenue records.",
      "Aadhaar card must be linked to active bank account (Direct Benefit Transfer enabled).",
      "Mandatory eKYC completed via OTP, Biometric (CSC), or Facial Recognition on PM-KISAN app.",
      "Exclusion: Institutional landholders, constitutional post holders, serving/retired government employees, income tax payers in previous assessment year, professionals (doctors, engineers, lawyers)."
    ],
    documentsRequired: [
      "Aadhaar Card (UIDAI)",
      "Land Ownership Document (Khasra / Khatauni / Jamabandi / RoR)",
      "Aadhaar-seeded Bank Account Passbook / Statement",
      "Active Indian Mobile Number (10 digits)"
    ],
    howToApply: [
      "Step 1: Visit official PM-KISAN portal (pmkisan.gov.in) or nearest Common Service Centre (CSC).",
      "Step 2: Navigate to 'Farmers Corner' and select 'New Farmer Registration'.",
      "Step 3: Enter Aadhaar Number, Mobile Number, and select State.",
      "Step 4: Authenticate with Aadhaar OTP sent to registered mobile.",
      "Step 5: Fill land details (Survey/Khata number, Khasra number, Area in Hectares) and upload land record document.",
      "Step 6: Submit application; track verification status under 'Know Your Status' tab."
    ],
    officialPortalUrl: "https://pmkisan.gov.in/",
    portalName: "pmkisan.gov.in",
    lastUpdated: "June 2024 (23rd Installment Release Guidelines)"
  },
  {
    id: "SCHEME_002",
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    hindiName: "प्रधानमंत्री फसल बीमा योजना",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    category: "Crop Insurance",
    financialBenefit: "Comprehensive insurance cover for crop loss from non-preventable natural risks (drought, flood, unseasonal rain, pests) at nominal premium: 1.5% for Rabi, 2.0% for Kharif, and 5% for Annual Commercial/Horticultural crops.",
    purpose: "To provide financial support to farmers suffering crop loss/damage arising out of unforeseen natural calamities, stabilizing farm income and encouraging adoption of innovative practices.",
    whoCanApply: "All farmers growing notified crops in notified areas, including sharecroppers and tenant farmers.",
    eligibility: [
      "Cultivating notified crop within the notified insurance unit (village/block).",
      "Loanee farmers are automatically covered through bank branch (with opt-out option available 7 days prior to cut-off).",
      "Non-loanee farmers must submit land records or tenant agreement.",
      "Cut-off dates: July 31 for Kharif season; December 31 for Rabi season."
    ],
    documentsRequired: [
      "Aadhaar Card",
      "Land Possession Certificate (LPC) or Revenue Record (Jamabandi)",
      "Sowing Certificate issued by Patwari / Village Agriculture Extension Officer",
      "Bank Account details (Passbook copy with IFSC)",
      "Tenant / Sharecropper agreement (for non-landowners)"
    ],
    howToApply: [
      "Step 1: Visit National Crop Insurance Portal (pmfby.gov.in) or apply via local commercial/cooperative bank branch or CSC.",
      "Step 2: Calculate premium using official 'Insurance Premium Calculator'.",
      "Step 3: Fill farmer details, crop sown, sowing date, and insured acreage.",
      "Step 4: Upload sowing certificate and bank proof; pay the subsidized farmer premium share.",
      "Step 5: Receive policy acknowledgement number. In case of localized calamity (hailstorm, inundation), report within 72 hours via PMFBY Crop Insurance Mobile App."
    ],
    officialPortalUrl: "https://pmfby.gov.in/",
    portalName: "pmfby.gov.in",
    lastUpdated: "Operational Guidelines 2024-25"
  },
  {
    id: "SCHEME_003",
    name: "Kisan Credit Card (KCC) Scheme",
    hindiName: "किसान क्रेडिट कार्ड योजना",
    ministry: "Ministry of Finance & Ministry of Agriculture",
    category: "Credit & Finance",
    financialBenefit: "Institutional credit up to ₹3,00,000 at effective interest rate of 4% per annum (7% base rate minus 3% prompt repayment incentive). Collateral-free limit up to ₹1,60,000.",
    purpose: "To provide timely, adequate, and cost-effective institutional short-term credit to farmers for cultivation expenses, post-harvest needs, consumption requirements, and maintenance of farm assets.",
    whoCanApply: "Individual farmers, joint cultivators, tenant farmers, oral lessees, sharecroppers, and Self Help Groups (SHGs) of farmers.",
    eligibility: [
      "Age between 18 and 75 years (co-borrower mandatory for senior citizens above 60).",
      "Owner cultivators, tenant farmers, or joint liability group members.",
      "Good credit history with no willful default on prior agricultural advances.",
      "Extended to Animal Husbandry and Fisheries farmers up to ₹2,00,000."
    ],
    documentsRequired: [
      "Duly completed KCC Application Form",
      "Identity Proof (Aadhaar / Voter ID / PAN)",
      "Address Proof (Aadhaar / Ration Card)",
      "Land Revenue Records certified by Revenue Officer (Patwari / Tehsildar)",
      "Crop Sowing declaration for upcoming season"
    ],
    howToApply: [
      "Step 1: Download standard one-page KCC form from PM-KISAN portal or bank website.",
      "Step 2: Fill primary personal details and landholding schedule.",
      "Step 3: Submit application to local branch of Commercial Bank, Regional Rural Bank (RRB), or State Cooperative Bank.",
      "Step 4: Bank processes application within 14 working days without service charges up to ₹3 Lakh.",
      "Step 5: Bank issues RuPay Kisan Credit Card for ATM and PoS transactions."
    ],
    officialPortalUrl: "https://myscheme.gov.in/schemes/kcc",
    portalName: "myscheme.gov.in / rbi.org.in",
    lastUpdated: "RBI Circular on Revised KCC Guidelines 2024"
  },
  {
    id: "SCHEME_004",
    name: "Agriculture Infrastructure Fund (AIF)",
    hindiName: "कृषि अवसंरचना कोष",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    category: "Infrastructure",
    financialBenefit: "3% per annum interest subvention on loans up to ₹2 Crore for a maximum tenure of 7 years, plus Credit Guarantee coverage under CGTMSE without collateral.",
    purpose: "Medium-to-long term debt financing for post-harvest management infrastructure (cold storages, warehouses, pack houses, assaying units) and community farming assets.",
    whoCanApply: "Primary Agricultural Credit Societies (PACS), Marketing Cooperative Societies, Farmer Producer Organizations (FPOs), SHGs, Agri-entrepreneurs, and Startups.",
    eligibility: [
      "Project must qualify under Post-Harvest Management or Community Farming Assets.",
      "Loan sanctions must be routed through commercial banks, cooperative banks, or RRBs registered on AIF portal.",
      "Maximum loan ceiling eligible for 3% interest subvention is ₹2 Crore per project (multiple projects in different locations eligible)."
    ],
    documentsRequired: [
      "Detailed Project Report (DPR)",
      "Land ownership or long-term registered lease deed (minimum 10 years)",
      "Entity registration certificate (FPO/Cooperative/Sole Proprietorship/LLP)",
      "Audited financial statements (last 2-3 years, if existing enterprise)",
      "KYC documents of promoters/directors"
    ],
    howToApply: [
      "Step 1: Register on the Agriculture Infrastructure Fund online portal (agriinfra.dac.gov.in).",
      "Step 2: Select preferred lending bank and branch.",
      "Step 3: Upload DPR, cost estimates, and financial projections.",
      "Step 4: Project appraisal is completed online by Project Monitoring Unit (PMU).",
      "Step 5: Lending bank sanctions loan; interest subvention is credited directly to the loan account."
    ],
    officialPortalUrl: "https://agriinfra.dac.gov.in/",
    portalName: "agriinfra.dac.gov.in",
    lastUpdated: "AIF Operational Guidelines (Cabinet Committee on Economic Affairs)"
  },
  {
    id: "SCHEME_005",
    name: "Soil Health Card (SHC) Scheme",
    hindiName: "मृदा स्वास्थ्य कार्ड योजना",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    category: "Soil & Inputs",
    financialBenefit: "Free soil testing and customized crop-wise fertilizer dosage recommendations issued every 2 years.",
    purpose: "To assess current soil nutrient status (12 parameters: N, P, K, S, Zn, Fe, Cu, Mn, Bo, pH, EC, OC) and guide farmers on balanced chemical and organic fertilizer application to reduce input costs and improve soil fertility.",
    whoCanApply: "All agricultural landholders across India.",
    eligibility: [
      "Any farmer possessing agricultural land within surveyed village grid.",
      "Samples collected by State Agriculture Department officials from grid of 2.5 ha (irrigated) or 10 ha (rainfed)."
    ],
    documentsRequired: [
      "Aadhaar Card",
      "Land Revenue Details (Khata / Khasra number)",
      "Crop history of previous 2 seasons"
    ],
    howToApply: [
      "Step 1: Soil testing samples are drawn directly from farmer's plot by village agriculture officer.",
      "Step 2: Farmers can also self-submit soil samples at nearest Soil Testing Laboratory (STL) or Krishi Vigyan Kendra (KVK).",
      "Step 3: Track test progress and download digital Soil Health Card at soilhealth.dac.gov.in.",
      "Step 4: Adopt recommended N-P-K and micronutrient dosage for target crop yields."
    ],
    officialPortalUrl: "https://soilhealth.dac.gov.in/",
    portalName: "soilhealth.dac.gov.in",
    lastUpdated: "National Soil Health Portal 2024"
  },
  {
    id: "SCHEME_006",
    name: "Sub-Mission on Agricultural Mechanization (SMAM)",
    hindiName: "कृषि यंत्रीकरण उप-अभियान",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    category: "Infrastructure",
    financialBenefit: "40% to 50% capital subsidy on purchase of agricultural machinery (Tractors, Rotavators, Laser Land Levellers, Super Seeders, Drone Spraying units) and up to 80% subsidy for setting up Custom Hiring Centres (CHCs).",
    purpose: "To increase the reach of farm mechanization to small and marginal farmers and regions with low farm power availability, reducing drudgery and promoting timely agronomic operations.",
    whoCanApply: "Individual farmers (Small, Marginal, SC/ST, and Women farmers get higher 50% subsidy), FPOs, PACS, and Rural Entrepreneurs.",
    eligibility: [
      "Farmer must not have availed subsidy for the same machine category within previous 5 years.",
      "Must possess agricultural land registered in applicant's name.",
      "Pre-registration on DBT Agriculture mechanization portal mandatory before purchasing machine from authorized manufacturer/dealer."
    ],
    documentsRequired: [
      "Aadhaar Card",
      "Land Record (Jamabandi / RoR)",
      "Bank Account Passbook with IFSC",
      "Category Certificate (for SC/ST/Small/Marginal subsidy slab)",
      "Quotation / Proforma Invoice from authorized farm equipment dealer"
    ],
    howToApply: [
      "Step 1: Register on Central Mechanization DBT portal (agrimachinery.nic.in) or State DBT Agriculture portal.",
      "Step 2: Select machine model and authorized dealer from empanelled list.",
      "Step 3: Upload land record, caste certificate, and bank details.",
      "Step 4: Receive subsidy sanction order (Lottery/Priority system).",
      "Step 5: Purchase machine, upload tax invoice and physical verification photo; subsidy is deposited directly into bank account via DBT."
    ],
    officialPortalUrl: "https://agrimachinery.nic.in/",
    portalName: "agrimachinery.nic.in",
    lastUpdated: "SMAM Revised Guidelines 2024-25"
  }
];

export default function SchemesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedScheme, setExpandedScheme] = useState<string | null>("SCHEME_001");

  const categories = [
    "All",
    "Direct Income Support",
    "Crop Insurance",
    "Credit & Finance",
    "Infrastructure",
    "Soil & Inputs",
  ];

  const filteredSchemes = SCHEMES_DATABASE.filter((scheme) => {
    const matchesCategory = selectedCategory === "All" || scheme.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.hindiName.includes(searchQuery) ||
      scheme.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.whoCanApply.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AppShell pageTitle="Government Schemes">
      <div className="page-container space-y-6">
        {/* Source & Provenance Disclosure Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Source:</span>
            <span className="text-slate-600">Official Government Gazette & National Portals (pmkisan.gov.in, pmfby.gov.in, agrimachinery.nic.in)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-xs">Last Verified: 12-Sep-2026</span>
            <a
              href="https://agriculture.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:text-emerald-800 font-semibold underline text-xs"
            >
              [View Official Gazette]
            </a>
          </div>
        </div>

        {/* Header Row */}
        <header className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold text-xs">
              Direct Benefit Transfer (DBT) Schemes
            </span>
            <span className="text-xs text-slate-500">
              Ministry of Agriculture & Farmers Welfare, Government of India
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Government Agriculture Schemes Directory
          </h1>
          <p className="text-slate-600 text-base max-w-4xl">
            Structured guidelines, financial benefits, eligibility checklists, documentation requirements, and step-by-step application instructions for major central and state agricultural welfare schemes.
          </p>
        </header>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                  selectedCategory === cat
                    ? "bg-[#0b4d75] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative min-w-[260px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scheme by name, subsidy, keyword..."
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0b4d75]"
            />
          </div>
        </div>

        {/* Schemes List */}
        <div className="space-y-4" role="region" aria-label="Schemes Directory">
          {filteredSchemes.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-lg space-y-2">
              <p className="text-slate-600 font-semibold">No government schemes matched your filter criteria.</p>
              <button
                type="button"
                onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                className="px-4 py-2 bg-[#0b4d75] text-white rounded text-sm font-semibold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredSchemes.map((scheme) => {
              const isExpanded = expandedScheme === scheme.id;
              return (
                <article
                  key={scheme.id}
                  className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden transition-all"
                >
                  {/* Scheme Summary Card */}
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                          {scheme.category}
                        </span>
                        <span className="text-xs text-slate-500">{scheme.ministry}</span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {scheme.name} <span className="text-slate-500 font-normal">({scheme.hindiName})</span>
                      </h2>
                      <p className="text-sm font-semibold text-emerald-700">
                        💰 Benefit: {scheme.financialBenefit}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedScheme(isExpanded ? null : scheme.id)}
                        className="px-4 py-2 border border-slate-300 rounded font-semibold text-sm hover:bg-slate-50 text-slate-700"
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? "Collapse Details ▲" : "View Full Guidelines ▼"}
                      </button>
                      <a
                        href={scheme.officialPortalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-[#0b4d75] text-white font-semibold rounded text-sm hover:bg-[#083754] text-center"
                      >
                        Apply on Official Portal ↗
                      </a>
                    </div>
                  </div>

                  {/* Progressive Disclosure: Structured Scheme Details */}
                  {isExpanded && (
                    <div className="p-6 bg-slate-50 space-y-6 text-sm text-slate-800 border-t border-slate-200">
                      {/* 1. Purpose & Objective */}
                      <section className="space-y-2 bg-white p-4 rounded border border-slate-200">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <span>🎯</span> 1. Scheme Objective & Purpose
                        </h3>
                        <p className="text-slate-700 leading-relaxed">{scheme.purpose}</p>
                      </section>

                      {/* 2. Who Can Apply & Target Beneficiary */}
                      <section className="space-y-2 bg-white p-4 rounded border border-slate-200">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <span>👥</span> 2. Who Can Apply
                        </h3>
                        <p className="text-slate-700">{scheme.whoCanApply}</p>
                      </section>

                      {/* 3. Eligibility Criteria */}
                      <section className="space-y-2 bg-white p-4 rounded border border-slate-200">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <span>✅</span> 3. Mandatory Eligibility Criteria
                        </h3>
                        <ul className="list-disc pl-5 space-y-1 text-slate-700">
                          {scheme.eligibility.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </section>

                      {/* 4. Required Documentation */}
                      <section className="space-y-2 bg-white p-4 rounded border border-slate-200">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <span>📄</span> 4. Documents Required
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {scheme.documentsRequired.map((doc, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center gap-2">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span className="text-slate-800 font-medium">{doc}</span>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* 5. How to Apply Step-by-Step */}
                      <section className="space-y-2 bg-white p-4 rounded border border-slate-200">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <span>📝</span> 5. Step-by-Step Application Procedure
                        </h3>
                        <div className="space-y-2">
                          {scheme.howToApply.map((step, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 border-l-4 border-[#0b4d75] rounded-r text-slate-800">
                              {step}
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* 6. Provenance & Official Source */}
                      <section className="p-4 bg-emerald-50 border border-emerald-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
                        <div>
                          <strong>Official Source:</strong> {scheme.portalName} • <strong>Guideline Edition:</strong> {scheme.lastUpdated}
                        </div>
                        <a
                          href={scheme.officialPortalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold underline text-emerald-800"
                        >
                          Visit Official Portal ({scheme.portalName}) ↗
                        </a>
                      </section>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}

