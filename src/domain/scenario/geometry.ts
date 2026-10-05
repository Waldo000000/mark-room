export type Tack = 'port' | 'starboard';

// Supported by-the-lee range in this app, not a numerical limit in the RRS.
export const BY_THE_LEE_ALLOWANCE_DEGREES = 30;

export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function inferTackFromHeading(
  headingDegrees: number,
  windFromDegrees: number,
): Tack | null {
  const relativeWind = normalizeDegrees(windFromDegrees - headingDegrees);

  // Mainsail side can determine tack when sailing by the lee or running square.
  if (
    relativeWind === 0 ||
    Math.abs(relativeWind - 180) <= BY_THE_LEE_ALLOWANCE_DEGREES
  )
    return null;

  return relativeWind < 180 ? 'starboard' : 'port';
}

export function formatCompassDirection(degrees: number): string {
  const directions = [
    'north',
    'north-east',
    'east',
    'south-east',
    'south',
    'south-west',
    'west',
    'north-west',
  ];
  const index = Math.round(normalizeDegrees(degrees) / 45) % directions.length;

  return directions[index];
}
