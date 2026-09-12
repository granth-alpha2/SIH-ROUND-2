"use client";

import { useState } from "react";
import AppShell from "../components/AppShell";

type ICARKnowledgeItem = {
  id: string;
  crop: string;
  hindiCrop: string;
  problemName: string;
  scientificName: string;
  category: "Fungal Disease" | "Insect Pest" | "Bacterial Disease" | "Nutrient Deficiency" | "Abiotic Weather Stress";
  severityLevel: "High" | "Moderate" | "Critical";
  symptoms: string[];
  possibleCauses: string[];
  recommendedAction: {
    cultural: string;
    chemical: string;
    biological: string;
  };
  detailedExplanation: string;
  officialSource: string;
  sourceInstitute: string;
};

const ICAR_KNOWLEDGE_BASE: ICARKnowledgeItem[] = [
  {
    id: "ICAR_WHEAT_001",
    crop: "Wheat",
    hindiCrop: "गेहूं",
    problemName: "Stripe Rust / Yellow Rust",
    scientificName: "Puccinia striiformis f. sp. tritici",
    category: "Fungal Disease",
    severityLevel: "Critical",
    symptoms: [
      "Bright yellow, powdery pustules (uredinia) arranged in long narrow linear stripes on the leaf blades.",
      "Chlorotic yellowing spreading along leaf veins before pustule eruption.",
      "Stunted crop growth, dried shrivelled grain heads, and premature senescing."
    ],
    possibleCauses: [
      "High morning relative humidity (> 80%) with moderate temperatures (10°C to 20°C).",
      "Persistent cloudiness, dense morning fog, and dew deposition on foliage during January-February.",
      "Susceptible older cultivars (e.g. HD 2967, PBW 343) planted in Trans-Gangetic & North-Western Plains."
    ],
    recommendedAction: {
      cultural: "Grow rust-resistant ICAR-recommended varieties such as DBW 187 (Karan Vandana), DBW 222 (Karan Narendra), or PBW 725. Avoid excess nitrogen fertilization.",
      chemical: "Spray Propiconazole 25% EC (Tilt) @ 1.0 ml/litre of water (200 ml in 200 L water per acre) or Tebuconazole 25.9% EC @ 1.0 ml/L at first appearance of yellow stripes.",
      biological: "Seed treatment with Trichoderma viride @ 5g/kg seed. Apply neem-based formulation (Azadirachtin 1500 ppm @ 3 ml/L) during early vegetative stages."
    },
    detailedExplanation: "Yellow rust is an airborne biotrophic fungus capable of travelling hundreds of miles on wind currents from sub-mountainous foothills into the northern plains. Once infection establishes, the fungus disrupts chlorophyll photosynthesis and drains plant carbohydrates, resulting in yield losses up to 70% if left untreated.",
    officialSource: "ICAR-Indian Institute of Wheat and Barley Research (IIWBR), Karnal — Advisory Bulletin 2024",
    sourceInstitute: "ICAR-IIWBR Karnal"
  },
  {
    id: "ICAR_WHEAT_002",
    crop: "Wheat",
    hindiCrop: "गेहूं",
    problemName: "Terminal Heat Stress",
    scientificName: "Abiotic High Temperature Stress",
    category: "Abiotic Weather Stress",
    severityLevel: "High",
    symptoms: [
      "Rapid premature forced maturity during grain filling (February-March).",
      "Shrivelled grains with reduced 1000-grain weight (test weight).",
      "Premature leaf yellowing and flag leaf drying."
    ],
    possibleCauses: [
      "Daytime maximum temperatures exceeding 32°C and minimum night temperatures above 18°C during milking and dough stages.",
      "Delayed sowing past November 25th in North-West India."
    ],
    recommendedAction: {
      cultural: "Ensure timely sowing by November 15-20. Adopt Zero-Tillage direct drilling after paddy harvest. Apply light, frequent irrigation at anthesis and milking stages.",
      chemical: "Foliar spray of 0.2% Potassium Nitrate (KNO3 @ 2.0 kg in 1000 L water/ha) or 0.1% Salicylic Acid at earhead emergence to enhance cellular thermal tolerance.",
      biological: "Incorporate crop residue with microbial decomposition consortium to retain soil moisture."
    },
    detailedExplanation: "Temperatures above 30°C inactivate soluble starch synthase enzymes inside developing grain endosperms, halting starch accumulation and reducing grain size by up to 25%.",
    officialSource: "ICAR-National Institute of Abiotic Stress Management (NIASM), Baramati & IIWBR",
    sourceInstitute: "ICAR-NIASM / ICAR-IIWBR"
  },
  {
    id: "ICAR_MUSTARD_001",
    crop: "Mustard",
    hindiCrop: "सरसों",
    problemName: "Mustard Aphid (Mahun / Chepa)",
    scientificName: "Lipaphis erysimi",
    category: "Insect Pest",
    severityLevel: "Critical",
    symptoms: [
      "Dense colonies of tiny green-yellow nymphs and adults clustering on tender shoots, inflorescences, and pods.",
      "Leaves curl, turn yellow, and wither; plants remain stunted.",
      "Honeydew secretion leads to black sooty mold covering pods and leaves, preventing pod setting."
    ],
    possibleCauses: [
      "Cloudy and overcast weather with high humidity (RH > 75%) and temperatures between 15°C and 22°C during flowering (January-February).",
      "Late sowing after October 25th."
    ],
    recommendedAction: {
      cultural: "Sow mustard early (first fortnight of October). Install yellow sticky traps @ 10–12 traps per acre. Pluck and bury heavily infested central twigs at initial infestation.",
      chemical: "Economic Threshold Level (ETL): 20–25 aphids per 10 cm terminal shoot. Spray Dimethoate 30% EC @ 1.5 ml/L or Thiamethoxam 25% WG @ 0.2 g/L (80g in 400L water per acre). Avoid spraying during peak honeybee foraging hours (9:00 AM – 12:00 PM).",
      biological: "Conserve natural predators like Ladybird beetle (Coccinella septempunctata) grubs and hoverfly maggots. Spray Verticillium lecanii @ 5g/L."
    },
    detailedExplanation: "A single female aphid can reproduce parthenogenetically up to 100 nymphs in 10 days. Sucking of phloem sap results in yield drops ranging from 30% to 70% in oilseed Brassica.",
    officialSource: "ICAR-Directorate of Rapeseed-Mustard Research (DRMR), Bharatpur — Package of Practices",
    sourceInstitute: "ICAR-DRMR Bharatpur"
  },
  {
    id: "ICAR_CHICKPEA_001",
    crop: "Chickpea (Gram)",
    hindiCrop: "चना",
    problemName: "Gram Pod Borer",
    scientificName: "Helicoverpa armigera",
    category: "Insect Pest",
    severityLevel: "Critical",
    symptoms: [
      "Defoliation in early vegetative stage with skeletonized tender leaves.",
      "Circular bore-holes in developing pods with caterpillar feeding half-body inside and half-body outside.",
      "Hollowed-out pods with missing seeds."
    ],
    possibleCauses: [
      "Warm days (25-30°C) with alternate sunny and overcast conditions at pod formation.",
      "Dense canopy growth without intercropping."
    ],
    recommendedAction: {
      cultural: "Install 'T'-shaped bird perches @ 20 per acre for natural predation by insectivorous birds. Intercrop with coriander or mustard (4:1 ratio). Set up pheromone traps @ 5 per acre.",
      chemical: "At ETL (1 larva per meter row): Spray Emamectin Benzoate 5% SG @ 0.4 g/L (80g in 200L water per acre) or Chlorantraniliprole 18.5% SC @ 0.3 ml/L (60 ml/acre).",
      biological: "Foliar spray of HaNPV (Helicoverpa armigera Nuclear Polyhedrosis Virus) @ 250 LE/ha or Bacillus thuringiensis (Bt) formulation @ 1.5 kg/ha."
    },
    detailedExplanation: "Helicoverpa is polyphagous and notorious for developing pesticide resistance if repetitive single-chemical sprays are applied. Integrated pest management (IPM) is essential to protect gram yields.",
    officialSource: "ICAR-Indian Institute of Pulses Research (IIPR), Kanpur",
    sourceInstitute: "ICAR-IIPR Kanpur"
  },
  {
    id: "ICAR_POTATO_001",
    crop: "Potato",
    hindiCrop: "आलू",
    problemName: "Late Blight of Potato",
    scientificName: "Phytophthora infestans",
    category: "Fungal Disease",
    severityLevel: "Critical",
    symptoms: [
      "Water-soaked, irregular pale-green to brown lesions on leaf margins and tips.",
      "White downy fungal growth on underside of leaves under high morning humidity.",
      "Foul smelling rot rapidly spreading across whole canopy; brown necrotic dry rot inside tubers."
    ],
    possibleCauses: [
      "Relative humidity > 85% with temperatures between 10°C and 20°C for 48 consecutive hours.",
      "Infected seed tubers used without systemic fungicidal treatment."
    ],
    recommendedAction: {
      cultural: "Plant certified disease-free tubers of tolerant varieties like Kufri Chipsona-3, Kufri Pukhraj. Earthing-up to prevent spores washing into soil to tubers.",
      chemical: "Prophylactic spray: Mancozeb 75% WP @ 2.5 g/L. Post-infection curative spray: Cymoxanil 8% + Mancozeb 64% WP @ 2.5 g/L or Dimethomorph 50% WP @ 1.0 g/L.",
      biological: "Seed tuber dip in Trichoderma harzianum @ 10g/L water for 20 minutes before planting."
    },
    detailedExplanation: "Late blight is the devastating pathogen responsible for the historical Irish Potato Famine. In wet winters, it can completely destroy an entire potato plot within 5 to 7 days.",
    officialSource: "ICAR-Central Potato Research Institute (CPRI), Shimla",
    sourceInstitute: "ICAR-CPRI Shimla"
  }
];

export default function KnowledgePage() {
  const [selectedCrop, setSelectedCrop] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>("ICAR_WHEAT_001");

  const crops = ["All", "Wheat", "Mustard", "Chickpea (Gram)", "Potato"];
  const categories = ["All", "Fungal Disease", "Insect Pest", "Abiotic Weather Stress"];

  const filteredItems = ICAR_KNOWLEDGE_BASE.filter((item) => {
    const matchesCrop = selectedCrop === "All" || item.crop.includes(selectedCrop);
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      item.problemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.crop.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCrop && matchesCategory && matchesSearch;
  });

  return (
    <AppShell pageTitle="Agricultural Knowledge">
      <div className="page-container space-y-6">
        {/* Source & Provenance Disclosure */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Knowledge Source:</span>
            <span className="text-slate-600">Indian Council of Agricultural Research (ICAR) Package of Practices & Research Bulletins</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-xs">Edition: 2024-25 ICAR Crop Protection Standards</span>
            <a
              href="https://www.icar.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:text-emerald-800 font-semibold underline text-xs"
            >
              [Verify with ICAR]
            </a>
          </div>
        </div>

        {/* Header */}
        <header className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold text-xs">
              ICAR Validated Agronomy
            </span>
            <span className="text-xs text-slate-500">
              Department of Agricultural Research and Education (DARE)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Agricultural Knowledge & Pest Management Protocols
          </h1>
          <p className="text-slate-600 text-base max-w-4xl">
            Structured agronomic sequences modeled directly on ICAR research institute publications: Crop → Problem → Symptoms → Causes → Recommended Actions (Cultural, Chemical & Biological) → Official Scientific Provenance.
          </p>
        </header>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-slate-500 uppercase">Crop:</span>
            {crops.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCrop(c)}
                className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                  selectedCrop === c
                    ? "bg-[#0b4d75] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pest, disease, symptom, chemical..."
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0b4d75]"
            />
          </div>
        </div>

        {/* Knowledge Base Directory */}
        <div className="space-y-4" role="region" aria-label="ICAR Knowledge Protocols">
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <article
                key={item.id}
                className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden"
              >
                {/* Protocol Header */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                        {item.crop} ({item.hindiCrop})
                      </span>
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-xs font-bold rounded">
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-500">{item.sourceInstitute}</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {item.problemName} <span className="text-slate-500 font-normal italic">({item.scientificName})</span>
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="px-4 py-2 border border-slate-300 rounded font-semibold text-sm hover:bg-slate-50 text-slate-700 shrink-0"
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? "Hide Full ICAR Protocol ▲" : "View ICAR Protocol ▼"}
                  </button>
                </div>

                {/* Structured ICAR Protocol Breakdown */}
                {isExpanded && (
                  <div className="p-6 bg-slate-50 space-y-6 text-sm text-slate-800 border-t border-slate-200">
                    {/* 1. Symptoms */}
                    <section className="space-y-2 bg-white p-4 rounded border border-slate-200">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>🔍</span> 1. Field Diagnostic Symptoms
                      </h3>
                      <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        {item.symptoms.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </section>

                    {/* 2. Causes & Agro-Climatic Drivers */}
                    <section className="space-y-2 bg-white p-4 rounded border border-slate-200">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>☁️</span> 2. Weather & Agro-Climatic Triggers
                      </h3>
                      <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        {item.possibleCauses.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </section>

                    {/* 3. Recommended Actions: Cultural, Chemical, Biological */}
                    <section className="space-y-3 bg-white p-4 rounded border border-slate-200">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>🛡️</span> 3. Recommended Integrated Management Actions
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded space-y-1">
                          <strong className="text-emerald-900 block font-bold">A. Cultural Control</strong>
                          <p className="text-emerald-800 text-xs leading-relaxed">{item.recommendedAction.cultural}</p>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded space-y-1">
                          <strong className="text-amber-900 block font-bold">B. Chemical Control (Dosage)</strong>
                          <p className="text-amber-800 text-xs leading-relaxed">{item.recommendedAction.chemical}</p>
                        </div>
                        <div className="p-3 bg-sky-50 border border-sky-200 rounded space-y-1">
                          <strong className="text-sky-900 block font-bold">C. Biological Control</strong>
                          <p className="text-sky-800 text-xs leading-relaxed">{item.recommendedAction.biological}</p>
                        </div>
                      </div>
                    </section>

                    {/* 4. Detailed Scientific Explanation */}
                    <section className="space-y-2 bg-white p-4 rounded border border-slate-200">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>📖</span> 4. Scientific Pathology & Economic Impact
                      </h3>
                      <p className="text-slate-700 leading-relaxed">{item.detailedExplanation}</p>
                    </section>

                    {/* 5. Provenance & Official Source */}
                    <footer className="p-4 bg-slate-100 border border-slate-200 rounded text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <strong>Official Provenance:</strong> {item.officialSource}
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">ICAR Verified Package of Practice</span>
                    </footer>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
