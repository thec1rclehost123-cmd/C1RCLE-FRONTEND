/**
 * Shared angle math for approximating CSS `conic-gradient` bands as SVG pie
 * wedges — RN/SVG has no conic-gradient primitive. CSS conic-gradient
 * angles are clockwise from north (12 o'clock); this converts to
 * cartesian via x = cx + r*sin(a), y = cy - r*cos(a).
 */
export function polarPoint(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}
