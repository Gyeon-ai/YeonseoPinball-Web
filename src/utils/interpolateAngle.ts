/** Interpolate adjacent physics poses along the shortest angular distance. */
export function interpolateAngle(previous: number, current: number, alpha: number): number {
  if (previous === current) return current;
  const delta = current - previous;
  return previous + Math.atan2(Math.sin(delta), Math.cos(delta)) * Math.max(0, Math.min(1, alpha));
}
