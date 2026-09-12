/**
 * AgriProfit — Geospatial & Location Intelligence Service
 * =========================================================
 * Provides:
 * 1. Reverse-geocoding of Lat/Lng coordinates into District, State & Agro-Climatic Zone
 * 2. Accurate geodesic distance calculations
 * 3. Browser-assisted "Use My Location" GPS resolution
 */

export type GeoDistrictInfo = {
  districtId: string;
  district: string;
  state: string;
  stateCode: string;
  latitude: number;
  longitude: number;
  agroClimaticZone: string;
  distanceKm: number;
};

// District Master reference compiled from reference/01_states_districts.csv
export const DISTRICT_MASTER = [
  { districtId: "DIST001", state: "Punjab", stateCode: "PB", district: "Bathinda", lat: 30.211, lng: 74.9455, zone: "Trans-Gangetic Plains" },
  { districtId: "DIST002", state: "Punjab", stateCode: "PB", district: "Ludhiana", lat: 30.901, lng: 75.8573, zone: "Trans-Gangetic Plains" },
  { districtId: "DIST003", state: "Punjab", stateCode: "PB", district: "Amritsar", lat: 31.634, lng: 74.8723, zone: "Trans-Gangetic Plains" },
  { districtId: "DIST004", state: "Haryana", stateCode: "HR", district: "Karnal", lat: 29.6857, lng: 76.9905, zone: "Trans-Gangetic Plains" },
  { districtId: "DIST005", state: "Haryana", stateCode: "HR", district: "Hisar", lat: 29.1492, lng: 75.7217, zone: "Trans-Gangetic Plains" },
  { districtId: "DIST006", state: "Haryana", stateCode: "HR", district: "Sirsa", lat: 29.5349, lng: 75.0294, zone: "Trans-Gangetic Plains" },
  { districtId: "DIST007", state: "Uttar Pradesh", stateCode: "UP", district: "Meerut", lat: 28.9845, lng: 77.7064, zone: "Upper Gangetic Plains" },
  { districtId: "DIST008", state: "Uttar Pradesh", stateCode: "UP", district: "Varanasi", lat: 25.3176, lng: 82.9739, zone: "Middle Gangetic Plains" },
  { districtId: "DIST009", state: "Uttar Pradesh", stateCode: "UP", district: "Agra", lat: 27.1767, lng: 78.0081, zone: "Upper Gangetic Plains" },
  { districtId: "DIST010", state: "Uttar Pradesh", stateCode: "UP", district: "Bareilly", lat: 28.367, lng: 79.4304, zone: "Upper Gangetic Plains" },
  { districtId: "DIST011", state: "Rajasthan", stateCode: "RJ", district: "Sri Ganganagar", lat: 29.9094, lng: 73.8799, zone: "Western Dry Region" },
  { districtId: "DIST012", state: "Rajasthan", stateCode: "RJ", district: "Kota", lat: 25.18, lng: 75.83, zone: "Southern Plateau and Hills" },
  { districtId: "DIST013", state: "Rajasthan", stateCode: "RJ", district: "Jaipur", lat: 26.9124, lng: 75.7873, zone: "Western Dry Region" },
  { districtId: "DIST014", state: "Madhya Pradesh", stateCode: "MP", district: "Indore", lat: 22.7196, lng: 75.8577, zone: "Central Plateau and Hills" },
  { districtId: "DIST015", state: "Madhya Pradesh", stateCode: "MP", district: "Ujjain", lat: 23.1765, lng: 75.7885, zone: "Central Plateau and Hills" },
  { districtId: "DIST016", state: "Madhya Pradesh", stateCode: "MP", district: "Bhopal", lat: 23.2599, lng: 77.4126, zone: "Central Plateau and Hills" },
  { districtId: "DIST017", state: "Maharashtra", stateCode: "MH", district: "Nashik", lat: 19.9975, lng: 73.7898, zone: "Western Plateau and Hills" },
  { districtId: "DIST018", state: "Maharashtra", stateCode: "MH", district: "Nagpur", lat: 21.1458, lng: 79.0882, zone: "Eastern Plateau and Hills" },
  { districtId: "DIST019", state: "Maharashtra", stateCode: "MH", district: "Pune", lat: 18.5204, lng: 73.8567, zone: "Western Plateau and Hills" },
  { districtId: "DIST020", state: "Maharashtra", stateCode: "MH", district: "Aurangabad", lat: 19.8762, lng: 75.3433, zone: "Western Plateau and Hills" },
  { districtId: "DIST021", state: "Gujarat", stateCode: "GJ", district: "Rajkot", lat: 22.3039, lng: 70.8022, zone: "Gujarat Plains and Hills" },
  { districtId: "DIST022", state: "Gujarat", stateCode: "GJ", district: "Surat", lat: 21.1702, lng: 72.8311, zone: "Gujarat Plains and Hills" },
  { districtId: "DIST023", state: "Gujarat", stateCode: "GJ", district: "Ahmedabad", lat: 23.0225, lng: 72.5714, zone: "Gujarat Plains and Hills" },
  { districtId: "DIST024", state: "Karnataka", stateCode: "KA", district: "Belagavi", lat: 15.8497, lng: 74.4977, zone: "Southern Plateau and Hills" },
  { districtId: "DIST025", state: "Karnataka", stateCode: "KA", district: "Dharwad", lat: 15.4589, lng: 75.0078, zone: "Southern Plateau and Hills" },
  { districtId: "DIST026", state: "Andhra Pradesh", stateCode: "AP", district: "Guntur", lat: 16.3067, lng: 80.4365, zone: "East Coast Plains and Hills" },
  { districtId: "DIST027", state: "Telangana", stateCode: "TS", district: "Warangal", lat: 17.9689, lng: 79.5941, zone: "Southern Plateau and Hills" },
  { districtId: "DIST028", state: "Bihar", stateCode: "BR", district: "Patna", lat: 25.5941, lng: 85.1376, zone: "Middle Gangetic Plains" },
];

/**
 * Calculates Great-Circle distance between two coordinates using Haversine formula (km)
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Resolves GPS coordinates to the nearest Indian District and Agro-Climatic Zone
 */
export function resolveDistrictFromCoords(lat: number, lng: number): GeoDistrictInfo {
  let closest = DISTRICT_MASTER[0];
  let minDistance = Infinity;

  for (const d of DISTRICT_MASTER) {
    const dist = calculateDistanceKm(lat, lng, d.lat, d.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = d;
    }
  }

  return {
    districtId: closest.districtId,
    district: closest.district,
    state: closest.state,
    stateCode: closest.stateCode,
    latitude: lat,
    longitude: lng,
    agroClimaticZone: closest.zone,
    distanceKm: minDistance,
  };
}

/**
 * Formats a clean location label from reverse-geocoded details
 */
export function formatLocationName(district: string, state: string, zone?: string): string {
  if (zone) {
    return `${district}, ${state} (${zone})`;
  }
  return `${district}, ${state}`;
}

