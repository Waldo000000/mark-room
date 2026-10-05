import type { Scenario } from '@/src/domain/scenario/schema';
import { observeScenario } from '@/src/domain/reasoning-experiment/scenario-observations';
import { ScenarioObservationView } from '@/src/components/experiments/scenario-observation-view';

export function ScenarioFactsInspector({
  scenario,
  keyframeId,
}: {
  scenario: Scenario;
  keyframeId: string;
}) {
  // Recompute from the current draft on every render. No saved/cached analysis,
  // playback clock, assumptions or source-case assessments enter this preview.
  const observations = observeScenario(scenario, keyframeId);
  const frame = scenario.keyframes.find((item) => item.id === keyframeId)!;
  return (
    <details
      className="mt-5 rounded-lg border border-border bg-card p-4"
      data-testid="editor-fact-inspector"
      data-keyframe-id={keyframeId}
    >
      <summary className="min-h-11 cursor-pointer font-semibold">
        Live Situation preview
      </summary>
      <p className="mt-2 text-sm" data-testid="editor-fact-context">
        {frame.label} · Boats: {observations.boats.length} · Pairs:{' '}
        {observations.pairs.length}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        A partial, read-only preview from your current draft. Edits update these
        observations immediately; this is not a complete Situation or an
        automatic ruling.
      </p>
      <ScenarioObservationView observations={observations} />
      <section className="mt-4" aria-label="Unresolved analysis">
        <h3 className="font-semibold">Still unresolved</h3>
        <p className="mt-2 text-sm">
          Incident timing and response opportunity are unknown. Playback seconds
          are only animation timing. Legal overlap, room, rule applicability and
          rulings have not been derived.
        </p>
      </section>
      <details className="mt-4">
        <summary className="min-h-11 cursor-pointer text-sm">
          Inspect observation evidence
        </summary>
        <pre className="mt-2 max-h-64 overflow-auto text-xs">
          {JSON.stringify(observations, null, 2)}
        </pre>
      </details>
    </details>
  );
}
