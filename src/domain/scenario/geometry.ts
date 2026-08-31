export type Tack = 'port' | 'starboard';

export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function inferTackFromHeading(
  headingDegrees: number,
  windFromDegrees: number,
): Tack | null {
  const relativeWind = normalizeDegrees(windFromDegrees - headingDegrees);

  // Heading alone cannot resolve tack when the wind is directly ahead or astern.
  if (relativeWind === 0 || relativeWind === 180) return null;

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
