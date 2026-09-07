import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import path from 'node:path';

import { ScenarioEditorSpike } from '@/src/components/editor/scenario-editor-spike';
import { validateCorpusDirectory } from '@/src/domain/corpus/validate';

export const metadata: Metadata = {
  title: 'Scenario editor spike | MarkRoom',
  description:
    'A mobile-first MarkRoom spike for editing Scenario geometry across keyframes.',
};

type EditorPageProps = {
  searchParams: Promise<{
    position?: string | string[];
    scenario?: string | string[];
  }>;
};

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const query = await searchParams;
  const requestedSlug = Array.isArray(query.scenario)
    ? query.scenario[0]
    : query.scenario;
  const requestedPosition = Array.isArray(query.position)
    ? query.position[0]
    : query.position;

  let incomingScenario;
  let incomingKeyframeId;

  if (requestedSlug) {
    const entries = await validateCorpusDirectory(
      path.resolve(process.cwd(), 'corpus'),
    );
    const entry = entries.find((candidate) => candidate.slug === requestedSlug);
    if (!entry) notFound();

    incomingScenario = entry.trainingExample.scenario;
    incomingKeyframeId =
      incomingScenario.keyframes.find(
        (keyframe) => keyframe.id === requestedPosition,
      )?.id ?? incomingScenario.keyframes[0].id;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Back to MarkRoom
        </Link>

        <header className="mt-7 border-b border-border pb-6">
          <p className="text-sm font-semibold uppercase text-muted-foreground">
            Scenario editor
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Edit scenario geometry
          </h1>
        </header>

        <ScenarioEditorSpike
          key={
            requestedSlug
              ? `${requestedSlug}:${incomingKeyframeId}`
              : 'saved-editor-draft'
          }
          incomingKeyframeId={incomingKeyframeId}
          incomingScenario={incomingScenario}
        />
      </div>
    </main>
  );
}
