/**
 * Domain Service: Geospatial Area & Boundary Calculation
 * ========================================================
 * Accurate spherical geodesic calculations for farm boundaries.
 */

export function computePolygonAreaSqMeters(coordinates: { lat: number; lng: number }[]): number {
  if (!coordinates || coordinates.length < 3) return 0;
  
  const R = 6378137; // Earth's radius in meters (WGS84)
  let area = 0;
  const len = coordinates.length;

  for (let i = 0; i < len; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[(i + 1) % len];

    const lat1 = (p1.lat * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;

    area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs((area * R * R) / 4);
  return Number(area.toFixed(2));
}

export function convertSqMetersToAcres(sqMeters: number): number {
  return Number((sqMeters / 4046.8564224).toFixed(2));
}

export function convertSqMetersToHectares(sqMeters: number): number {
  return Number((sqMeters / 10000).toFixed(2));
}

