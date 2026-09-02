import { describe, expect, it } from 'vitest';

import portStarboardTrainingExample from '../../../corpus/training-examples/port-starboard.json';
import leewardMarkOverlapTrainingExample from '../../../corpus/training-examples/leeward-mark-overlap.json';
import { situationSchema, type Situation } from './schema';

const portStarboardSituation = portStarboardTrainingExample.situation;

describe('situationSchema', () => {
  it('validates a self-contained RRS-language situation', () => {
    const situation: Situation = situationSchema.parse(portStarboardSituation);

    expect(situation.scenarioId).toBe('development-port-starboard-crossing');
    expect(situation.moments[0].boatStates[0]).not.toHaveProperty('position');
    expect(situation.moments[0].boatStates[0]).not.toHaveProperty(
      'headingDegrees',
    );
  });

  it('rejects unknown boat references', () => {
    const situation = structuredClone(portStarboardSituation);
    situation.moments[0].boatStates[0].boatId = 'unknown-boat';

    const result = situationSchema.safeParse(situation);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes('Unknown boat ID'),
        ),
      ).toBe(true);
    }
  });

  it('rejects incomplete moments', () => {
    const situation = structuredClone(portStarboardSituation);
    situation.moments[0].boatStates.pop();

    const result = situationSchema.safeParse(situation);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.message === 'Missing boat state: yellow',
        ),
      ).toBe(true);
    }
  });

  it('validates inside and outside boats relative to a mark', () => {
    const situation = situationSchema.parse(
      leewardMarkOverlapTrainingExample.situation,
    );

    expect(situation.moments[0].relationships).toContainEqual({
      type: 'mark-position',
      markId: 'leeward-mark',
      insideBoatId: 'blue',
      outsideBoatId: 'yellow',
    });
  });

  it('rejects invalid mark-position references and identical boats', () => {
    const situation = structuredClone(
      leewardMarkOverlapTrainingExample.situation,
    );
    const relationship = situation.moments[0].relationships[2];
    if (relationship.type !== 'mark-position') {
      throw new Error('Expected mark-position relationship');
    }
    relationship.markId = 'unknown-mark';
    relationship.outsideBoatId = relationship.insideBoatId;

    const result = situationSchema.safeParse(situation);

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain('Unknown mark ID: unknown-mark');
      expect(messages).toContain('Inside and outside boats must be different');
    }
  });
});
