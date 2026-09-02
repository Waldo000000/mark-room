import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import path from 'node:path';

import { TrainingExampleView } from '@/src/components/scenario/training-example-view';
import { validateCorpusDirectory } from '@/src/domain/corpus/validate';

type ScenarioPageProps = {
  params: Promise<{ slug: string }>;
};

async function findTrainingExample(slug: string) {
  const entries = await validateCorpusDirectory(
    path.resolve(process.cwd(), 'corpus'),
  );

  return entries.find((entry) => entry.slug === slug);
}

export async function generateStaticParams() {
  const entries = await validateCorpusDirectory(
    path.resolve(process.cwd(), 'corpus'),
  );

  return entries.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: ScenarioPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await findTrainingExample(slug);

  return entry
    ? {
        title: `${entry.trainingExample.scenario.title} | MarkRoom`,
        description: `An inspectable MarkRoom training example for ${entry.trainingExample.rulings.obligations[0]?.ruleRefs.join(', ') ?? 'the Racing Rules of Sailing'}.`,
      }
    : { title: 'Scenario not found | MarkRoom' };
}

export default async function ScenarioPage({ params }: ScenarioPageProps) {
  const { slug } = await params;
  const entry = await findTrainingExample(slug);

  if (!entry) notFound();

  return (
    <TrainingExampleView
      corpusMetadata={entry.metadata}
      trainingExample={entry.trainingExample}
    />
  );
}
