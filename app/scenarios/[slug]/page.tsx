import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ScenarioDetail } from '@/src/components/scenario/scenario-detail';
import {
  getScenarioBySlug,
  scenarioEntries,
} from '@/src/domain/corpus/scenarios';

type ScenarioPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return scenarioEntries.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ScenarioPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getScenarioBySlug(slug);

  if (!entry) return {};

  return {
    title: `${entry.evalCase.input.title} | MarkRoom`,
    description: entry.evalCase.input.prompt,
  };
}

export default async function ScenarioPage({ params }: ScenarioPageProps) {
  const { slug } = await params;
  const entry = getScenarioBySlug(slug);

  if (!entry) notFound();

  return <ScenarioDetail evalCase={entry.evalCase} metadata={entry.metadata} />;
}
