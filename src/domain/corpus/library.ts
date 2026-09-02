type RuleReferenceEntry = {
  trainingExample: {
    rulings: {
      obligations: { ruleRefs: string[] }[];
      outcomes: { ruleRefs: string[] }[];
    };
  };
};

type SearchableCorpusEntry = {
  trainingExample: { scenario: { title: string } };
  metadata: { teachingText?: string };
};

function normalizeSearchText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function entryRuleReferences(entry: RuleReferenceEntry): string[] {
  return [
    ...entry.trainingExample.rulings.obligations,
    ...entry.trainingExample.rulings.outcomes,
  ].flatMap((statement) => statement.ruleRefs);
}

export function collectRuleReferences(
  entries: readonly RuleReferenceEntry[],
): string[] {
  return [...new Set(entries.flatMap(entryRuleReferences))].sort();
}

export function filterCorpusEntriesByRule<T extends RuleReferenceEntry>(
  entries: readonly T[],
  ruleReference?: string,
): T[] {
  if (!ruleReference) return [...entries];

  return entries.filter((entry) =>
    entryRuleReferences(entry).includes(ruleReference),
  );
}

export function buildRuleIndex<T extends RuleReferenceEntry>(
  entries: readonly T[],
): { ruleReference: string; entries: T[] }[] {
  return collectRuleReferences(entries).map((ruleReference) => ({
    ruleReference,
    entries: filterCorpusEntriesByRule(entries, ruleReference),
  }));
}

export function searchCorpusEntries<T extends SearchableCorpusEntry>(
  entries: readonly T[],
  query?: string,
): T[] {
  const normalizedQuery = normalizeSearchText(query ?? '');
  if (!normalizedQuery) return [...entries];

  return entries.filter((entry) =>
    [
      entry.trainingExample.scenario.title,
      entry.metadata.teachingText ?? '',
    ].some((value) => normalizeSearchText(value).includes(normalizedQuery)),
  );
}
