/**
 * @agriprofit/ui — Shared UI Primitives & Badges
 * ===============================================
 */

export function formatINR(val: number): string {
  return "₹" + Math.round(val).toLocaleString("en-IN");
}

export function convertAcresToHectares(acres: number): number {
  return Number((acres / 2.47105).toFixed(2));
}

export function convertHectaresToAcres(hectares: number): number {
  return Number((hectares * 2.47105).toFixed(2));
}

