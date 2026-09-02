import type { Metadata } from 'next';
import Link from 'next/link';
import path from 'node:path';

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

export default async function ScenariosPage() {
  const entries = await validateCorpusDirectory(
    path.resolve(process.cwd(), 'corpus'),
  );

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
        </header>

        <section
          aria-label="Available scenarios"
          className="divide-y divide-border"
        >
          {entries.map(
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
        </section>
      </div>
    </main>
  );
}
