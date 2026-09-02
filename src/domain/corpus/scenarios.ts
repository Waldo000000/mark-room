import portStarboardMetadataDocument from '@/corpus/metadata/port-starboard.json';
import windwardLeewardMetadataDocument from '@/corpus/metadata/windward-leeward.json';
import portStarboardDocument from '@/corpus/scenarios/port-starboard.json';
import windwardLeewardDocument from '@/corpus/scenarios/windward-leeward.json';

import { scenarioEvalCaseSchema, type ScenarioEvalCase } from '../eval/schema';
import { corpusMetadataSchema, type CorpusMetadata } from './schema';

export type ScenarioEntry = {
  slug: string;
  evalCase: ScenarioEvalCase;
  metadata: CorpusMetadata;
};

export const scenarioEntries: ScenarioEntry[] = [
  {
    slug: 'port-starboard',
    evalCase: scenarioEvalCaseSchema.parse(portStarboardDocument),
    metadata: corpusMetadataSchema.parse(portStarboardMetadataDocument),
  },
  {
    slug: 'windward-leeward',
    evalCase: scenarioEvalCaseSchema.parse(windwardLeewardDocument),
    metadata: corpusMetadataSchema.parse(windwardLeewardMetadataDocument),
  },
];

export function getScenarioBySlug(slug: string): ScenarioEntry | undefined {
  return scenarioEntries.find((entry) => entry.slug === slug);
}
