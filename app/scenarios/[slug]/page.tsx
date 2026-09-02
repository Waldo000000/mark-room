import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import path from 'node:path';

import { TrainingExampleView } from '@/src/components/scenario/training-example-view';
import { collectRuleReferences } from '@/src/domain/corpus/library';
import { validateCorpusDirectory } from '@/src/domain/corpus/validate';

type ScenarioPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    mode?: string | string[];
    position?: string | string[];
    question?: string | string[];
  }>;
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

export default async function ScenarioPage({
  params,
  searchParams,
}: ScenarioPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const entries = await validateCorpusDirectory(
    path.resolve(process.cwd(), 'corpus'),
  );
  const entry = entries.find((candidate) => candidate.slug === slug);

  if (!entry) notFound();

  const requestedPosition = Array.isArray(query.position)
    ? query.position[0]
    : query.position;
  const requestedMode = Array.isArray(query.mode) ? query.mode[0] : query.mode;
  const requestedQuestion = Array.isArray(query.question)
    ? query.question[0]
    : query.question;
  const selectedKeyframeId =
    requestedPosition &&
    entry.trainingExample.scenario.keyframes.some(
      (keyframe) => keyframe.id === requestedPosition,
    )
      ? requestedPosition
      : entry.trainingExample.scenario.keyframes[0].id;

  return (
    <TrainingExampleView
      corpusMetadata={entry.metadata}
      availableRuleReferences={collectRuleReferences(entries)}
      quizMode={requestedMode === 'quiz'}
      quizQuestionType={
        requestedQuestion === 'rule' ? 'applicable-rule' : 'keep-clear'
      }
      scenarioSlug={slug}
      selectedKeyframeId={selectedKeyframeId}
      trainingExample={entry.trainingExample}
    />
  );
}
