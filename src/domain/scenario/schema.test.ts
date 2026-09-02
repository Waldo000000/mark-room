import { describe, expect, it } from 'vitest';

import portStarboardEval from '../../../corpus/scenarios/port-starboard.json';
import { scenarioSchema, type Scenario } from './schema';

const cloneScenario = (): Scenario =>
  structuredClone(portStarboardEval.input) as Scenario;

describe('scenarioSchema', () => {
  it('contains only editor-controlled state and explicit tack', () => {
    const scenario = scenarioSchema.parse(portStarboardEval.input);

    expect(scenario.id).toBe('development-port-starboard-crossing');
    expect(scenario.lengthUnit).toBe('hull-length');
    expect(scenario.sailingArea).toEqual({ width: 6, height: 6 });
    expect(scenario.keyframes[0].boatStates[0].tack).toBe('starboard');
    expect(scenario).not.toHaveProperty('facts');
    expect(scenario).not.toHaveProperty('ruling');
    expect(scenario).not.toHaveProperty('provenance');
    expect(scenario.keyframes[0].boatStates[0]).not.toHaveProperty('sail');
  });

  it('allows either explicit tack while running square', () => {
    const scenario = cloneScenario();
    scenario.keyframes[0].boatStates[0].headingDegrees = 180;
    scenario.keyframes[0].boatStates[0].tack = 'port';
    expect(scenarioSchema.safeParse(scenario).success).toBe(true);

    scenario.keyframes[0].boatStates[0].tack = 'starboard';
    expect(scenarioSchema.safeParse(scenario).success).toBe(true);
  });

  it('rejects explicit tack that conflicts with unambiguous geometry', () => {
    const scenario = cloneScenario();
    scenario.keyframes[0].boatStates[0].headingDegrees = 45;

    const result = scenarioSchema.safeParse(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        'Tack conflicts with heading and wind: expected port',
      );
    }
  });

  it('rejects incomplete keyframes and out-of-bounds positions', () => {
    const scenario = cloneScenario();
    scenario.keyframes[0].boatStates.pop();
    scenario.keyframes[0].boatStates[0].position.x = 101;

    const result = scenarioSchema.safeParse(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain('Missing boat state: yellow');
      expect(messages).toContain('Coordinate exceeds sailing area width');
    }
  });

  it('rejects dangling boat references and unknown derived properties', () => {
    const dangling = cloneScenario();
    dangling.keyframes[0].boatStates[0].boatId = 'missing';
    expect(scenarioSchema.safeParse(dangling).success).toBe(false);

    const polluted = cloneScenario() as unknown as Record<string, unknown>;
    polluted.facts = [];
    expect(scenarioSchema.safeParse(polluted).success).toBe(false);
  });

  it('does not allow per-boat hull lengths in the equal-length first cut', () => {
    const scenario = cloneScenario();
    const boat = scenario.boats[0] as (typeof scenario.boats)[number] & {
      hullLength: number;
    };
    boat.hullLength = 1.2;

    expect(scenarioSchema.safeParse(scenario).success).toBe(false);
  });
});
