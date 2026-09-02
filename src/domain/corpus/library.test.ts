import { describe, expect, it } from 'vitest';

import { collectRuleReferences, filterCorpusEntriesByRule } from './library';

function entry(
  slug: string,
  obligationRuleRefs: string[][],
  outcomeRuleRefs: string[][] = [],
) {
  return {
    slug,
    trainingExample: {
      rulings: {
        obligations: obligationRuleRefs.map((ruleRefs) => ({ ruleRefs })),
        outcomes: outcomeRuleRefs.map((ruleRefs) => ({ ruleRefs })),
      },
    },
  };
}

const entries = [
  entry('port-starboard', [['RRS 10']]),
  entry('windward-leeward', [['RRS 11', 'RRS 14']]),
  entry('contact', [], [['RRS 14']]),
];

describe('corpus library filters', () => {
  it('collects unique sorted references from obligations and outcomes', () => {
    expect(collectRuleReferences(entries)).toEqual([
      'RRS 10',
      'RRS 11',
      'RRS 14',
    ]);
  });

  it('filters entries by an exact rule reference', () => {
    expect(
      filterCorpusEntriesByRule(entries, 'RRS 14').map((item) => item.slug),
    ).toEqual(['windward-leeward', 'contact']);
    expect(filterCorpusEntriesByRule(entries, 'RRS 1')).toEqual([]);
  });

  it('returns every entry when no reference is selected', () => {
    expect(filterCorpusEntriesByRule(entries)).toEqual(entries);
  });
});
