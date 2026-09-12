/**
 * @agriprofit/services/maps — Spatial GIS Calculation Service
 * ===========================================================
 */

export function calculatePolygonAreaAcres(points: { lat: number; lng: number }[]): { acres: number; hectares: number } {
  if (!points || points.length < 3) return { acres: 0, hectares: 0 };

  const earthRadius = 6378137; // WGS-84 radius in meters
  let area = 0;

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const p1 = points[i];
    const p2 = points[j];
    const lat1 = (p1.lat * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
    area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs((area * earthRadius * earthRadius) / 4.0);
  const sqMeters = area;
  const acres = Number((sqMeters / 4046.856).toFixed(2));
  const hectares = Number((sqMeters / 10000).toFixed(2));

  return { acres, hectares };
}

