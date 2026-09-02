import { describe, expect, it } from 'vitest';

import invalidDanglingBoatReference from './__fixtures__/invalid-dangling-boat-reference.json';
import invalidMissingProvenance from './__fixtures__/invalid-missing-provenance.json';
import validDevelopmentScenario from './__fixtures__/valid-development-scenario.json';
import validRichDevelopmentScenario from './__fixtures__/valid-rich-development-scenario.json';
import { scenarioSchema, type Scenario } from './schema';

const cloneValidFixture = (): unknown =>
  structuredClone(validDevelopmentScenario);

describe('scenarioSchema', () => {
  it('validates a provenance-aware development scenario', () => {
    const scenario: Scenario = scenarioSchema.parse(validDevelopmentScenario);

    expect(scenario.id).toBe('development-port-starboard-crossing');
    expect(scenario.verification.status).toBe('unverified');
  });

  it('validates representative features, facts, references, and reviewed metadata', () => {
    const scenario = scenarioSchema.parse(validRichDevelopmentScenario);

    expect(scenario.courseFeatures.map((feature) => feature.type)).toEqual([
      'mark',
      'zone',
      'line',
      'boundary',
      'layline',
    ]);
    expect(scenario.facts).toHaveLength(7);
    expect(scenario.verification.status).toBe('agent-reviewed');
  });

  it('rejects a scenario without provenance', () => {
    expect(scenarioSchema.safeParse(invalidMissingProvenance).success).toBe(
      false,
    );
  });

  it('rejects a dangling boat reference', () => {
    const result = scenarioSchema.safeParse(invalidDanglingBoatReference);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes('Unknown boat ID'),
        ),
      ).toBe(true);
    }
  });

  it('rejects duplicate entity IDs', () => {
    const scenario = cloneValidFixture() as typeof validDevelopmentScenario;
    scenario.boats[1].id = scenario.boats[0].id;

    const result = scenarioSchema.safeParse(scenario);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.message === 'Duplicate ID: blue',
        ),
      ).toBe(true);
    }
  });

  it('rejects incomplete keyframes and out-of-bounds positions', () => {
    const scenario = cloneValidFixture() as typeof validDevelopmentScenario;
    scenario.keyframes[0].boatStates.pop();
    scenario.keyframes[0].boatStates[0].position.x =
      scenario.sailingArea.width + 1;

    const result = scenarioSchema.safeParse(scenario);

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain('Missing boat state: yellow');
      expect(messages).toContain('Coordinate exceeds sailing area width');
    }
  });

  it('rejects verified records without reviewer metadata', () => {
    const scenario = cloneValidFixture() as Record<string, unknown>;
    scenario.verification = { status: 'human-verified' };

    expect(scenarioSchema.safeParse(scenario).success).toBe(false);
  });

  it('requires explanations for uncertain findings', () => {
    const scenario = cloneValidFixture() as typeof validDevelopmentScenario;
    const finding = scenario.ruling.findings[0] as unknown as Record<
      string,
      unknown
    >;
    finding.status = 'conditional';
    delete finding.explanation;

    const result = scenarioSchema.safeParse(scenario);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes('conditional findings require an explanation'),
        ),
      ).toBe(true);
    }
  });

  it('rejects unknown properties instead of silently accepting typos', () => {
    const scenario = cloneValidFixture() as Record<string, unknown>;
    scenario.canonical = true;

    expect(scenarioSchema.safeParse(scenario).success).toBe(false);
  });

  it('rejects a tack fact that conflicts with heading and wind', () => {
    const scenario = cloneValidFixture() as typeof validDevelopmentScenario;
    scenario.keyframes[0].boatStates[0].headingDegrees = 45;

    const result = scenarioSchema.safeParse(scenario);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) =>
            issue.message ===
            'Tack conflicts with heading and wind: expected port',
        ),
      ).toBe(true);
    }
  });

  it('rejects a sail drawn on the windward side for its tack', () => {
    const scenario = cloneValidFixture() as typeof validDevelopmentScenario;
    scenario.keyframes[0].boatStates[0].sail.side = 'starboard';

    const result = scenarioSchema.safeParse(scenario);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) =>
            issue.message ===
            'starboard tack requires the sail to lie on the port side',
        ),
      ).toBe(true);
    }
  });
});
