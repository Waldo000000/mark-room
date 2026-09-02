import type { Metadata } from 'next';
import Link from 'next/link';
import path from 'node:path';

import { buildRuleIndex } from '@/src/domain/corpus/library';
import type { Provenance } from '@/src/domain/corpus/schema';
import { validateCorpusDirectory } from '@/src/domain/corpus/validate';

export const metadata: Metadata = {
  title: 'Referenced rules | MarkRoom',
  description:
    'Browse Racing Rules of Sailing references used by MarkRoom training examples.',
};

const verificationLabels = {
  unverified: 'Unverified transcription',
  'agent-reviewed': 'Agent-reviewed transcription',
  'human-verified': 'Human-verified transcription',
} as const;

function findAuthoritativeSource(provenance: Provenance[]) {
  return provenance.find((source) =>
    [
      'world_sailing_rule',
      'world_sailing_case',
      'official_interpretation',
    ].includes(source.sourceType),
  );
}

export default async function RulesPage() {
  const entries = await validateCorpusDirectory(
    path.resolve(process.cwd(), 'corpus'),
  );
  const ruleIndex = buildRuleIndex(entries);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
          href="/scenarios"
        >
          Back to scenarios
        </Link>

        <header className="mt-7 border-b border-border pb-6">
          <p className="text-sm font-semibold uppercase text-muted-foreground">
            Rule index
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Rules referenced by MarkRoom
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            These references come from MarkRoom training records. The linked
            World Sailing material is authoritative; MarkRoom examples are not
            official interpretations.
          </p>
        </header>

        <section
          aria-label="Referenced rules"
          className="divide-y divide-border"
        >
          {ruleIndex.map(({ entries: matchingEntries, ruleReference }) => (
            <section
              className="py-7"
              data-rule-reference={ruleReference}
              key={ruleReference}
            >
              <h2 className="text-2xl font-semibold">{ruleReference}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {matchingEntries.length}{' '}
                {matchingEntries.length === 1 ? 'example' : 'examples'} in the
                current corpus
              </p>

              <div className="mt-5 divide-y divide-border border-y border-border">
                {matchingEntries.map(({ metadata, slug, trainingExample }) => {
                  const source = findAuthoritativeSource(metadata.provenance);

                  return (
                    <article className="py-5" key={slug}>
                      <span className="inline-block rounded-sm border border-amber-600 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
                        {verificationLabels[metadata.verification.status]}
                      </span>
                      <h3 className="mt-3 text-lg font-semibold">
                        <Link
                          className="text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
                          href={`/scenarios/${slug}`}
                        >
                          {trainingExample.scenario.title}
                        </Link>
                      </h3>
                      {source ? (
                        <div className="mt-2 text-sm leading-6 text-muted-foreground">
                          <p>
                            {source.publisher ?? source.title}
                            {source.pageOrSection
                              ? `, ${source.pageOrSection}`
                              : ''}
                          </p>
                          {source.url ? (
                            <a
                              className="mt-1 inline-block font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
                              href={source.url}
                              rel="noreferrer"
                              target="_blank"
                            >
                              Open authoritative source
                            </a>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          No authoritative source link recorded.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </section>
      </div>
    </main>
  );
}
