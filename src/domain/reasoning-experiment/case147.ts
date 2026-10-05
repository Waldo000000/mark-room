import { CASE_BOOK_URL, FACTS, type FactKey, type FactPacket } from './facts';

// Agent transcription for research, not a verified corpus TrainingExample.
// Assessments are supplied by the decision, not reconstructed from its diagram.
export function case147Facts(): FactPacket {
  const episodeId = 's-pb-course-change';
  return {
    version: 'pairwise-facts-v1',
    episodeId,
    context: { discipline: 'general_rrs', ruleSet: '2025-2028' },
    boats: { starboard: 'S', port: 'PB' },
    facts: (Object.keys(FACTS) as FactKey[]).map((key) => ({
      key,
      value: true,
      episodeId,
      world: 'actual',
      basis:
        FACTS[key].kind === 'assessment' ? 'source-assessment' : 'source-fact',
      evidence:
        FACTS[key].kind === 'assessment'
          ? 'Supplied assessment from the official decision; this experiment does not derive it from geometry.'
          : 'Supplied event or relationship from the official case.',
      sourceUrl: `${CASE_BOOK_URL}#page=317`,
    })),
  };
}
