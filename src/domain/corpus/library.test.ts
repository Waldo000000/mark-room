import { describe, expect, it } from 'vitest';

import {
  buildRuleIndex,
  collectRuleReferences,
  filterCorpusEntriesByRule,
  searchCorpusEntries,
} from './library';

function entry(
  slug: string,
  obligationRuleRefs: string[][],
  outcomeRuleRefs: string[][] = [],
  teachingText = '',
) {
  return {
    slug,
    metadata: { teachingText },
    trainingExample: {
      scenario: { title: slug.replaceAll('-', ' ') },
      rulings: {
        obligations: obligationRuleRefs.map((ruleRefs) => ({ ruleRefs })),
        outcomes: outcomeRuleRefs.map((ruleRefs) => ({ ruleRefs })),
      },
    },
  };
}

const entries = [
  entry(
    'port-starboard',
    [['RRS 10']],
    [],
    'The port-tack boat must keep clear.',
  ),
  entry(
    'windward-leeward',
    [['RRS 11', 'RRS 14']],
    [],
    'The windward boat keeps clear.',
  ),
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

  it('builds a stable index of matching entries for each reference', () => {
    expect(
      buildRuleIndex(entries).map(({ ruleReference, entries: matches }) => ({
        ruleReference,
        slugs: matches.map((item) => item.slug),
      })),
    ).toEqual([
      { ruleReference: 'RRS 10', slugs: ['port-starboard'] },
      { ruleReference: 'RRS 11', slugs: ['windward-leeward'] },
      {
        ruleReference: 'RRS 14',
        slugs: ['windward-leeward', 'contact'],
      },
    ]);
  });

  it('searches titles and teaching text without case sensitivity', () => {
    expect(
      searchCorpusEntries(entries, 'STARBOARD').map((item) => item.slug),
    ).toEqual(['port-starboard']);
    expect(
      searchCorpusEntries(entries, 'PORT-TACK').map((item) => item.slug),
    ).toEqual(['port-starboard']);
  });

  it('normalizes whitespace and handles empty or unmatched searches', () => {
    expect(
      searchCorpusEntries(entries, '  windward   boat  ').map(
        (item) => item.slug,
      ),
    ).toEqual(['windward-leeward']);
    expect(searchCorpusEntries(entries, '   ')).toEqual(entries);
    expect(searchCorpusEntries(entries, 'iceberg')).toEqual([]);
  });
});
