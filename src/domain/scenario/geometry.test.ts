import { describe, expect, it } from 'vitest';

import { formatCompassDirection, inferTackFromHeading } from './geometry';

describe('scenario geometry', () => {
  it('infers tack from heading and the direction wind comes from', () => {
    expect(inferTackFromHeading(315, 0)).toBe('starboard');
    expect(inferTackFromHeading(45, 0)).toBe('port');
  });

  it('does not infer tack when heading alone is ambiguous', () => {
    expect(inferTackFromHeading(0, 0)).toBeNull();
    expect(inferTackFromHeading(180, 0)).toBeNull();
  });

  it('formats cardinal and intercardinal wind directions', () => {
    expect(formatCompassDirection(0)).toBe('north');
    expect(formatCompassDirection(225)).toBe('south-west');
  });

  it('preserves explicit tack across the inclusive by-the-lee range for any wind direction', () => {
    for (const wind of [0, 45, 195, 350]) {
      for (const offset of [150, 160, 180, 200, 210]) {
        expect(inferTackFromHeading(wind + offset, wind)).toBeNull();
      }
      expect(inferTackFromHeading(wind + 149.99, wind)).toBe('port');
      expect(inferTackFromHeading(wind + 210.01, wind)).toBe('starboard');
    }
  });
});
