import type { Metadata } from 'next';
import Link from 'next/link';

import { scenarioEntries } from '@/src/domain/corpus/scenarios';

export const metadata: Metadata = {
  title: 'Scenarios | MarkRoom',
  description: 'Inspect the first validated MarkRoom sailing scenarios.',
};

export default function ScenariosPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-6 sm:py-12">
        <Link
          href="/"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Back to MarkRoom
        </Link>

        <header className="mt-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase text-muted-foreground">
            Scenario corpus
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Read the situation. Check the ruling.
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            These first examples are validated as structured data and grounded
            in the current Racing Rules of Sailing. Their MarkRoom
            transcriptions remain clearly unverified.
          </p>
        </header>

        <section
          className="mt-9 grid gap-4 sm:grid-cols-2"
          aria-label="Scenarios"
        >
          {scenarioEntries.map(({ slug, scenario }) => {
            const ruleRefs = [
              ...new Set(
                scenario.ruling.findings.flatMap((finding) => finding.ruleRefs),
              ),
            ];

            return (
              <article
                key={scenario.id}
                className="rounded-md border border-border bg-card p-5 text-card-foreground"
                data-testid={`scenario-card-${slug}`}
              >
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {ruleRefs.join(', ')}
                </p>
                <h2 className="mt-2 text-xl font-semibold">{scenario.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {scenario.prompt}
                </p>
                <Link
                  href={`/scenarios/${slug}`}
                  className="mt-5 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                  Open scenario
                </Link>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
