import type { SailState } from '@/src/domain/situation/schema';

export const BOAT_HULL_PATH =
  'M 0 -9 C 2.3 -6.8 3.2 -2.7 3.1 3.4 L 2.2 7.2 Q 0 8.2 -2.2 7.2 L -3.1 3.4 C -3.2 -2.7 -2.3 -6.8 0 -9 Z';
export const BOAT_GLYPH_INTERNAL_HULL_LENGTH = 16.7;
export const BOAT_GLYPH_SCALE = 1 / BOAT_GLYPH_INTERNAL_HULL_LENGTH;

export function getSailPath(luffing: boolean, side: SailState['side']): string {
  const sideSign = side === 'starboard' ? 1 : -1;

  if (luffing) {
    return `M 0 -3 C ${0.8 * sideSign} -1.6 ${-0.7 * sideSign} -0.2 0 1.2 C ${0.8 * sideSign} 2.6 ${-0.7 * sideSign} 4.2 0 6`;
  }

  return `M 0 -3 C ${0.45 * sideSign} -0.2 ${0.45 * sideSign} 3.4 0 6`;
}

type BoatGlyphProps = {
  color: string;
  sail: SailState;
};

export function BoatGlyph({ color, sail }: BoatGlyphProps) {
  const sailRotation =
    sail.side === 'port' ? sail.trimDegrees : -sail.trimDegrees;
  const sailPath = getSailPath(sail.luffing, sail.side);

  return (
    <g
      data-luffing={sail.luffing}
      data-sail-side={sail.side}
      data-testid="boat-glyph"
      data-trim-degrees={sail.trimDegrees}
      data-hull-length="1"
    >
      <g transform={`scale(${BOAT_GLYPH_SCALE})`}>
        <path
          d={BOAT_HULL_PATH}
          data-testid="boat-hull"
          fill={color}
          stroke="#0f172a"
          strokeLinejoin="round"
          strokeWidth="0.8"
        />
        <g data-testid="boat-sail" transform={`rotate(${sailRotation} 0 -3)`}>
          <path
            d={sailPath}
            fill="none"
            stroke="#0f172a"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.1"
          />
          <path
            d={sailPath}
            fill="none"
            stroke="#f8fafc"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.05"
          />
        </g>
        <circle cx="0" cy="-3" fill="#0f172a" r="0.75" />
      </g>
    </g>
  );
}
