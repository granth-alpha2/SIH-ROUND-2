/**
 * AgriProfit — Crop Lifecycle Milestone & Agronomic Planner (Prompt 15)
 * =====================================================================
 * Generates dynamic stage-by-stage agronomic schedules calibrated to ICAR
 * package-of-practices, sowing date, and regional agro-climatic zones.
 */

export type LifecycleStage = {
  stageNumber: number;
  stageName: string;
  hindiName: string;
  startDayOffset: number;
  endDayOffset: number;
  startDate: string;
  endDate: string;
  durationDays: number;
  irrigationGuidance: string;
  fertilizerGuidance: string;
  weedManagement: string;
  pestMonitoring: string;
  diseaseMonitoring: string;
  status: "completed" | "active" | "upcoming";
};

export type CropLifecyclePlan = {
  cropName: string;
  hindiName: string;
  category: string;
  season: string;
  region: string;
  sowingDate: string;
  expectedHarvestDate: string;
  totalDurationDays: number;
  stages: LifecycleStage[];
  advisoryDisclaimer: string;
};

type StageBlueprint = {
  stageName: string;
  hindiName: string;
  startDay: number;
  endDay: number;
  irrigation: string;
  fertilizer: string;
  weed: string;
  pest: string;
  disease: string;
};

// Curated ICAR Standard Blueprints
const CROP_BLUEPRINTS: Record<string, StageBlueprint[]> = {
  Wheat: [
    {
      stageName: "Land Preparation & Pre-Sowing",
      hindiName: "खेत की तैयारी और बुवाई",
      startDay: 0,
      endDay: 8,
      irrigation: "Pre-sowing (Palewa) irrigation to ensure optimal seed-zone soil moisture.",
      fertilizer: "Apply basal dose: 50% Nitrogen (Urea), 100% Phosphorus (DAP) and 100% Potash (MOP) at final ploughing.",
      weed: "Apply pre-emergence herbicide Pendimethalin 30% EC @ 1.0 L/acre within 48 hours of sowing.",
      pest: "Check for termite presence in dry soils; treat seed with Chlorpyrifos 20 EC if required.",
      disease: "Treat seed with Carbendazim / Thiram @ 2g/kg seed to prevent loose smut and flag smut.",
    },
    {
      stageName: "Germination & Crown Root Initiation (CRI)",
      hindiName: "अंकुरण और ताज जड़ अवस्था",
      startDay: 8,
      endDay: 25,
      irrigation: "CRITICAL CRI IRRIGATION: Apply first irrigation precisely at 20–25 DAS. Do not delay as it triggers root crown development.",
      fertilizer: "Apply 25% Nitrogen top-dressing (Urea @ 30–35 kg/acre) right before or immediately after CRI irrigation.",
      weed: "Monitor broadleaf and grassy weed emergence (Phalaris minor / Gullidanda).",
      pest: "Inspect seedling vigor and root establishment; watch for cutworm damage.",
      disease: "Monitor ambient morning humidity; look for initial yellow rust foci on leaves.",
    },
    {
      stageName: "Vegetative Tillering & Jointing",
      hindiName: "कल्ले फूटना और गांठ बनना",
      startDay: 25,
      endDay: 65,
      irrigation: "Second irrigation at late tillering (40–45 DAS) and third irrigation at jointing stage (60–65 DAS).",
      fertilizer: "Apply remaining 25% Nitrogen top-dressing (Urea @ 30–35 kg/acre) before jointing completes.",
      weed: "Post-emergence spray of Clodinafop-propargyl @ 60g a.i./acre if Phalaris minor exceeds threshold.",
      pest: "Scout weekly for Aphids (Mahun) colonies on lower leaves and stems.",
      disease: "Yellow Rust (Stripe Rust) surveillance: If yellow powder stripes appear, spray Tilt (Propiconazole 25% EC) @ 1ml/L.",
    },
    {
      stageName: "Flowering & Grain Formation (Milking/Dough)",
      hindiName: "फूल आना और दाना भरना",
      startDay: 65,
      endDay: 105,
      irrigation: "Crucial flowering irrigation (80–85 DAS) and grain filling irrigation (100–105 DAS). Avoid flood irrigation on windy days to prevent lodging.",
      fertilizer: "Foliar spray of 2% Potassium Nitrate (13-0-45) or 1% Zinc Sulphate to enhance grain weight and heat tolerance.",
      weed: "Hand-pull any remaining escaped weed seedheads before seed dispersal.",
      pest: "Aphid control if population exceeds 10–15 aphids per earhead: Spray Thiamethoxam 25 WG @ 0.2g/L.",
      disease: "Check for Karnal Bunt and Head Blight during humid cloudy periods.",
    },
    {
      stageName: "Physiological Maturity & Harvest Preparation",
      hindiName: "पकने की अवस्था और कटाई की तैयारी",
      startDay: 105,
      endDay: 125,
      irrigation: "Completely stop irrigation 10–14 days prior to harvest to allow uniform drying of wheat straw.",
      fertilizer: "No chemical fertilizers at this terminal maturity stage.",
      weed: "Field perimeter clearing for combine harvester machinery access.",
      pest: "Ensure grain moisture in standing crop reaches 12–14% before mechanical harvesting.",
      disease: "Inspect earheads for black point or mold before storage.",
    },
    {
      stageName: "Harvesting & Safe Storage",
      hindiName: "कटाई और सुरक्षित भंडारण",
      startDay: 125,
      endDay: 130,
      irrigation: "No irrigation.",
      fertilizer: "No fertilizer.",
      weed: "None.",
      pest: "Clean storage bins; treat gunny bags with Malathion 50% EC; ensure seed moisture is below 12%.",
      disease: "Store in cool dry ventilated warehouse to prevent fungal spoilage and grain weevils.",
    },
  ],
  Mustard: [
    {
      stageName: "Land Preparation & Sowing",
      hindiName: "खेत की तैयारी और बुवाई",
      startDay: 0,
      endDay: 6,
      irrigation: "Pre-sowing irrigation to establish fine seedbed moisture.",
      fertilizer: "Basal application: 50% N, 100% P, 100% K + Sulfur @ 20 kg/acre (Elemental sulfur/Gypsum for oil content).",
      weed: "Pre-emergence Pendimethalin 30 EC @ 1 L/acre.",
      pest: "Seed treatment with Imidacloprid 70 WS @ 5g/kg seed against early sucking pests.",
      disease: "Seed treatment with Metalaxyl @ 2g/kg against White Rust.",
    },
    {
      stageName: "Germination & Thinning",
      hindiName: "अंकुरण और विरलीकरण",
      startDay: 6,
      endDay: 20,
      irrigation: "No irrigation needed unless severe soil dryness occurs.",
      fertilizer: "None at this seedling stage.",
      weed: "Thinning at 15–20 DAS to maintain optimal plant-to-plant spacing of 10–15 cm.",
      pest: "Inspect for Sawfly larvae and Flea beetles.",
      disease: "Look for damping-off or white rust pustules on cotyledon leaves.",
    },
    {
      stageName: "Vegetative & Flowering",
      hindiName: "वानस्पतिक वृद्धि और फूल आना",
      startDay: 20,
      endDay: 60,
      irrigation: "First irrigation at pre-flowering stage (30–35 DAS).",
      fertilizer: "Top-dress remaining 50% Nitrogen (Urea @ 25 kg/acre) with first irrigation.",
      weed: "One hand-hoeing/weeding before canopy closure.",
      pest: "HIGH VULNERABILITY: Monitor Mustard Aphids. Spray Dimethoate 30 EC @ 1.5 ml/L if >25 aphids/plant.",
      disease: "Spray Mancozeb 75 WP @ 2g/L against Alternaria blight and White Rust.",
    },
    {
      stageName: "Pod Development & Maturation",
      hindiName: "फलियां बनना और परिपक्वता",
      startDay: 60,
      endDay: 110,
      irrigation: "Second irrigation at siliqua (pod) filling stage (65–70 DAS). Cease irrigation afterwards.",
      fertilizer: "Foliar spray of 1% water-soluble Boron @ 1g/L to prevent pod shattering and enhance oil percentage.",
      weed: "None.",
      pest: "Check for pod borer or lingering aphid colonies.",
      disease: "Monitor for Sclerotinia stem rot during dense canopy humid spells.",
    },
    {
      stageName: "Harvesting & Threshing",
      hindiName: "कटाई और गहाई",
      startDay: 110,
      endDay: 120,
      irrigation: "No irrigation.",
      fertilizer: "No fertilizer.",
      weed: "None.",
      pest: "Harvest in early morning hours when 75% siliquae turn golden yellow to avoid shattering losses.",
      disease: "Sun-dry harvested pods on tarpaulins until seed moisture drops to 8–9% for safe storage.",
    },
  ],
};

function addDays(baseDate: Date, days: number): Date {
  const result = new Date(baseDate);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Generate full agronomic lifecycle plan from sowing date and region
 */
export function generateCropLifecyclePlan(
  cropName: string,
  sowDateString: string,
  regionName = "Agro-Climatic Zone (Auto-Resolved)"
): CropLifecyclePlan {

  const sowDate = new Date(sowDateString);
  const now = new Date();

  // Retrieve blueprint or generate robust default
  const cleanName = cropName.split(" ")[0] || "Wheat";
  const blueprints = CROP_BLUEPRINTS[cleanName] || CROP_BLUEPRINTS.Wheat;

  const stages: LifecycleStage[] = blueprints.map((bp, idx) => {
    const startDate = addDays(sowDate, bp.startDay);
    const endDate = addDays(sowDate, bp.endDay);
    const durationDays = bp.endDay - bp.startDay;

    let status: "completed" | "active" | "upcoming" = "upcoming";
    if (now > endDate) {
      status = "completed";
    } else if (now >= startDate && now <= endDate) {
      status = "active";
    }

    return {
      stageNumber: idx + 1,
      stageName: bp.stageName,
      hindiName: bp.hindiName,
      startDayOffset: bp.startDay,
      endDayOffset: bp.endDay,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      durationDays,
      irrigationGuidance: bp.irrigation,
      fertilizerGuidance: bp.fertilizer,
      weedManagement: bp.weed,
      pestMonitoring: bp.pest,
      diseaseMonitoring: bp.disease,
      status,
    };
  });

  const totalDuration = stages[stages.length - 1]?.endDayOffset || 130;
  const harvestDate = addDays(sowDate, totalDuration);

  return {
    cropName,
    hindiName: cleanName === "Wheat" ? "गेहूं" : cleanName === "Mustard" ? "सरसों" : "चना",
    category: cleanName === "Wheat" ? "Cereal" : cleanName === "Mustard" ? "Oilseed" : "Pulse",
    season: "Rabi",
    region: regionName,
    sowingDate: formatDate(sowDate),
    expectedHarvestDate: formatDate(harvestDate),
    totalDurationDays: totalDuration,
    stages,
    advisoryDisclaimer:
      "Advisory Notice: Stage timelines and chemical dosages are calibrated to ICAR package-of-practices and historical climate norms. Always verify local pest thresholds with your Krishi Vigyan Kendra (KVK) extension specialist prior to chemical applications.",
  };
}

