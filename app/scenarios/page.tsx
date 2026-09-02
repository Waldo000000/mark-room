import type { Metadata } from 'next';
import Link from 'next/link';
import path from 'node:path';

import {
  collectRuleReferences,
  filterCorpusEntriesByRule,
  searchCorpusEntries,
} from '@/src/domain/corpus/library';
import { validateCorpusDirectory } from '@/src/domain/corpus/validate';

export const metadata: Metadata = {
  title: 'Scenarios | MarkRoom',
  description: 'Browse inspectable Racing Rules of Sailing scenarios.',
};

const verificationLabels = {
  unverified: 'Unverified transcription',
  'agent-reviewed': 'Agent-reviewed transcription',
  'human-verified': 'Human-verified transcription',
} as const;

type ScenariosPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    rule?: string | string[];
  }>;
};

export default async function ScenariosPage({
  searchParams,
}: ScenariosPageProps) {
  const [entries, query] = await Promise.all([
    validateCorpusDirectory(path.resolve(process.cwd(), 'corpus')),
    searchParams,
  ]);
  const ruleReferences = collectRuleReferences(entries);
  const requestedSearch = Array.isArray(query.q) ? query.q[0] : query.q;
  const searchQuery = requestedSearch?.trim() || undefined;
  const requestedRule = Array.isArray(query.rule) ? query.rule[0] : query.rule;
  const selectedRule =
    !searchQuery && ruleReferences.includes(requestedRule ?? '')
      ? requestedRule
      : undefined;
  const filteredEntries = searchQuery
    ? searchCorpusEntries(entries, searchQuery)
    : filterCorpusEntriesByRule(entries, selectedRule);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Back to MarkRoom
        </Link>

        <header className="mt-7 border-b border-border pb-6">
          <p className="text-sm font-semibold uppercase text-muted-foreground">
            Scenario library
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Racing rules scenarios
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Inspect the geometry, situation, rulings, and source record for each
            worked example.
          </p>
          <Link
            className="mt-4 inline-block text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
            href="/rules"
          >
            Explore referenced rules
          </Link>
        </header>

        <section
          className="border-b border-border py-6"
          aria-label="Scenario filters"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <form action="/scenarios" className="grid gap-3" method="get">
              <label
                className="grid gap-2 text-sm font-semibold"
                htmlFor="scenario-search"
              >
                Search scenarios
                <input
                  className="min-h-11 rounded-md border border-input bg-background px-3 text-base font-normal text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-sm"
                  defaultValue={searchQuery ?? ''}
                  id="scenario-search"
                  key={searchQuery ?? 'empty-search'}
                  name="q"
                  placeholder="Title or teaching note"
                  type="search"
                />
              </label>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2"
                type="submit"
              >
                Search
              </button>
            </form>

            <form action="/scenarios" className="grid gap-3" method="get">
              <label
                className="grid gap-2 text-sm font-semibold"
                htmlFor="rule-filter"
              >
                Filter by rule
                <select
                  className="min-h-11 rounded-md border border-input bg-background px-3 text-base font-normal text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-sm"
                  defaultValue={selectedRule ?? ''}
                  id="rule-filter"
                  key={selectedRule ?? 'all-rules'}
                  name="rule"
                >
                  <option value="">All rules</option>
                  {ruleReferences.map((ruleReference) => (
                    <option key={ruleReference} value={ruleReference}>
                      {ruleReference}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2"
                type="submit"
              >
                Apply filter
              </button>
            </form>
          </div>

          {searchQuery || selectedRule ? (
            <Link
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
              href="/scenarios"
            >
              {searchQuery ? 'Clear search' : 'Clear filter'}
            </Link>
          ) : null}
          <p
            className="mt-4 text-sm text-muted-foreground"
            data-testid="scenario-count"
          >
            {filteredEntries.length}{' '}
            {filteredEntries.length === 1 ? 'scenario' : 'scenarios'}
            {searchQuery ? ` matching "${searchQuery}"` : ''}
            {selectedRule ? ` citing ${selectedRule}` : ''}
          </p>
        </section>

        <section
          aria-label="Available scenarios"
          className="divide-y divide-border"
        >
          {filteredEntries.map(
            ({ metadata: corpusMetadata, slug, trainingExample }) => {
              const ruleRefs = [
                ...new Set(
                  [
                    ...trainingExample.rulings.obligations,
                    ...trainingExample.rulings.outcomes,
                  ].flatMap((statement) => statement.ruleRefs),
                ),
              ];
              const source = corpusMetadata.provenance[0];

              return (
                <article
                  className="grid gap-5 py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  key={slug}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                      <span className="rounded-sm border border-amber-600 bg-amber-50 px-2 py-1 text-amber-900">
                        {verificationLabels[corpusMetadata.verification.status]}
                      </span>
                      <span className="text-muted-foreground">
                        {ruleRefs.join(', ')}
                      </span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold">
                      {trainingExample.scenario.title}
                    </h2>
                    {corpusMetadata.teachingText ? (
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        {corpusMetadata.teachingText}
                      </p>
                    ) : null}
                    <p className="mt-3 text-xs text-muted-foreground">
                      {source.publisher ?? source.title}
                      {source.pageOrSection ? `, ${source.pageOrSection}` : ''}
                    </p>
                  </div>

                  <Link
                    href={`/scenarios/${slug}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    Open scenario
                  </Link>
                </article>
              );
            },
          )}
          {filteredEntries.length === 0 && searchQuery ? (
            <div className="py-8">
              <p className="text-base font-semibold">
                No scenarios match &quot;{searchQuery}&quot;.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Try a title or a phrase from a teaching note.
              </p>
              <Link
                className="mt-3 inline-block text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
                href="/scenarios"
              >
                Show all scenarios
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
