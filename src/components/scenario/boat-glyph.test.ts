import { describe, expect, it } from 'vitest';

import {
  BOAT_GLYPH_INTERNAL_HULL_LENGTH,
  BOAT_GLYPH_SCALE,
  BOAT_HULL_PATH,
  deriveSailPresentation,
  getSailPath,
} from './boat-glyph';

describe('BoatGlyph geometry', () => {
  it('uses a curved plan-view hull rather than a polygonal diamond', () => {
    expect(BOAT_HULL_PATH).toContain('C');
    expect(BOAT_HULL_PATH).toContain('Q');
  });

  it('normalizes the rendered hull to one scenario hull length', () => {
    expect(BOAT_GLYPH_INTERNAL_HULL_LENGTH * BOAT_GLYPH_SCALE).toBe(1);
  });

  it('uses a smooth sail when drawing normally', () => {
    expect(getSailPath(false, 'starboard')).toBe(
      'M 0 -3 C 0.45 -0.2 0.45 3.4 0 6',
    );
  });

  it('uses alternating curves for a luffing sail', () => {
    const luffingPath = getSailPath(true, 'port');

    expect(luffingPath.match(/C/g)).toHaveLength(2);
    expect(luffingPath).toContain('-0.8');
    expect(luffingPath).toContain('0.7');
  });

  it('derives sail side from explicit tack', () => {
    expect(deriveSailPresentation(45, 0, 'port').side).toBe('starboard');
    expect(deriveSailPresentation(315, 0, 'starboard').side).toBe('port');
  });

  it('luffs head to wind and eases the sail as the boat bears away', () => {
    expect(deriveSailPresentation(0, 0, 'port')).toMatchObject({
      trimDegrees: 0,
      luffing: true,
    });
    expect(deriveSailPresentation(90, 0, 'port').trimDegrees).toBe(45);
    expect(deriveSailPresentation(180, 0, 'starboard').trimDegrees).toBe(75);
  });
});
