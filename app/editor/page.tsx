import type { Metadata } from 'next';
import Link from 'next/link';

import { ScenarioEditorSpike } from '@/src/components/editor/scenario-editor-spike';

export const metadata: Metadata = {
  title: 'Scenario editor spike | MarkRoom',
  description:
    'A mobile-first MarkRoom spike for editing Scenario geometry across keyframes.',
};

export default function EditorPage() {
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

        <ScenarioEditorSpike />
      </div>
    </main>
  );
}
