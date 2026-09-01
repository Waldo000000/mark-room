import portStarboardDocument from '@/corpus/scenarios/port-starboard.json';
import windwardLeewardDocument from '@/corpus/scenarios/windward-leeward.json';

import { scenarioSchema, type Scenario } from '../scenario/schema';

export type ScenarioEntry = {
  slug: string;
  scenario: Scenario;
};

export const scenarioEntries: ScenarioEntry[] = [
  {
    slug: 'port-starboard',
    scenario: scenarioSchema.parse(portStarboardDocument),
  },
  {
    slug: 'windward-leeward',
    scenario: scenarioSchema.parse(windwardLeewardDocument),
  },
];

export function getScenarioBySlug(slug: string): ScenarioEntry | undefined {
  return scenarioEntries.find((entry) => entry.slug === slug);
}
