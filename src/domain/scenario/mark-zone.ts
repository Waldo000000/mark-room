import type { Scenario } from './schema';

export type DerivedMarkZone = {
  center: { x: number; y: number };
  label: string;
  markId: string;
  radius: number;
};

export function markZoneRadiusHullLengths(
  discipline: Scenario['context']['discipline'],
): number {
  return discipline === 'radio_sailing' ? 4 : 3;
}

export function deriveMarkZones(
  scenario: Pick<Scenario, 'context' | 'courseFeatures'>,
): DerivedMarkZone[] {
  const radius = markZoneRadiusHullLengths(scenario.context.discipline);

  return scenario.courseFeatures.flatMap((feature) =>
    feature.type === 'mark'
      ? [
          {
            center: { ...feature.position },
            label: `${radius} hull length zone`,
            markId: feature.id,
            radius,
          },
        ]
      : [],
  );
}
