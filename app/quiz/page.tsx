import type { Metadata } from 'next';
import Link from 'next/link';
import path from 'node:path';

import { collectRuleReferences } from '@/src/domain/corpus/library';
import { validateCorpusDirectory } from '@/src/domain/corpus/validate';
import { listApplicableRulePractice } from '@/src/domain/quiz/applicable-rule';
import { listKeepClearPractice } from '@/src/domain/quiz/keep-clear';
import { listMarkRoomPractice } from '@/src/domain/quiz/mark-room';

export const metadata: Metadata = {
  title: 'Practice questions | MarkRoom',
  description:
    'Practice deterministic questions from MarkRoom training examples.',
};

const verificationLabels = {
  unverified: 'Unverified transcription',
  'agent-reviewed': 'Agent-reviewed transcription',
  'human-verified': 'Human-verified transcription',
} as const;

export default async function QuizPage() {
  const entries = await validateCorpusDirectory(
    path.resolve(process.cwd(), 'corpus'),
  );
  const practiceItems = listKeepClearPractice(entries);
  const markRoomPracticeItems = listMarkRoomPractice(entries);
  const ruleReferences = collectRuleReferences(entries);
  const rulePracticeItems = listApplicableRulePractice(entries, ruleReferences);
  const entriesBySlug = new Map(entries.map((entry) => [entry.slug, entry]));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
          href="/"
        >
          Back to MarkRoom
        </Link>

        <header className="mt-7 border-b border-border pb-6">
          <p className="text-sm font-semibold uppercase text-muted-foreground">
            Practice
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Practice questions
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Choose a position, inspect its diagram, and identify an obligation
            or its referenced rule. Verification labels apply to the underlying
            MarkRoom transcription.
          </p>
        </header>

        <section aria-labelledby="keep-clear-practice" className="mt-7">
          <h2 className="text-2xl font-semibold" id="keep-clear-practice">
            Who keeps clear?
          </h2>
          <section
            aria-label="Available keep-clear questions"
            className="mt-3 divide-y divide-border"
          >
            {practiceItems.map((item) => {
              const entry = entriesBySlug.get(item.slug);
              if (!entry) return null;

              return (
                <article
                  className="grid gap-5 py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  key={`${item.slug}:${item.momentId}`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                      <span className="rounded-sm border border-amber-600 bg-amber-50 px-2 py-1 text-amber-900">
                        {verificationLabels[entry.metadata.verification.status]}
                      </span>
                      <span className="text-muted-foreground">
                        {item.ruleRefs.join(', ')}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-semibold">
                      {item.scenarioTitle}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.momentLabel}
                    </p>
                  </div>
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2"
                    href={`/scenarios/${item.slug}?position=${encodeURIComponent(item.momentId)}&mode=quiz`}
                  >
                    Start question
                  </Link>
                </article>
              );
            })}
          </section>
        </section>

        <section
          aria-labelledby="mark-room-practice"
          className="mt-9 border-t border-border pt-7"
        >
          <h2 className="text-2xl font-semibold" id="mark-room-practice">
            Who is owed mark-room?
          </h2>
          <section
            aria-label="Available mark-room questions"
            className="mt-3 divide-y divide-border"
          >
            {markRoomPracticeItems.map((item) => {
              const entry = entriesBySlug.get(item.slug);
              if (!entry) return null;

              return (
                <article
                  className="grid gap-5 py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  key={`${item.slug}:${item.momentId}`}
                >
                  <div>
                    <span className="rounded-sm border border-amber-600 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
                      {verificationLabels[entry.metadata.verification.status]}
                    </span>
                    <h3 className="mt-3 text-xl font-semibold">
                      {item.scenarioTitle}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.momentLabel}
                    </p>
                  </div>
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2"
                    href={`/scenarios/${item.slug}?position=${encodeURIComponent(item.momentId)}&mode=quiz&question=mark-room`}
                  >
                    Start mark-room question
                  </Link>
                </article>
              );
            })}
          </section>
        </section>

        <section
          aria-labelledby="rule-practice"
          className="mt-9 border-t border-border pt-7"
        >
          <h2 className="text-2xl font-semibold" id="rule-practice">
            Which rule applies?
          </h2>
          <section
            aria-label="Available rule questions"
            className="mt-3 divide-y divide-border"
          >
            {rulePracticeItems.map((item) => {
              const entry = entriesBySlug.get(item.slug);
              if (!entry) return null;

              return (
                <article
                  className="grid gap-5 py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  key={`${item.slug}:${item.momentId}`}
                >
                  <div>
                    <span className="rounded-sm border border-amber-600 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
                      {verificationLabels[entry.metadata.verification.status]}
                    </span>
                    <h3 className="mt-3 text-xl font-semibold">
                      {item.scenarioTitle}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.momentLabel}
                    </p>
                  </div>
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2"
                    href={`/scenarios/${item.slug}?position=${encodeURIComponent(item.momentId)}&mode=quiz&question=rule`}
                  >
                    Start rule question
                  </Link>
                </article>
              );
            })}
          </section>
        </section>
      </div>
    </main>
  );
}
