type RuleReferenceEntry = {
  trainingExample: {
    rulings: {
      obligations: { ruleRefs: string[] }[];
      outcomes: { ruleRefs: string[] }[];
    };
  };
};

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
