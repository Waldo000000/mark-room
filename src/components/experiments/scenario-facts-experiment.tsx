'use client';

import Link from 'next/link';
import { useState } from 'react';
import { analyzeFacts } from '@/src/domain/reasoning-experiment/analyze';
import {
  observeScenario,
  prerequisiteInventory,
  scenarioPairFacts,
} from '@/src/domain/reasoning-experiment/scenario-observations';
import { syntheticScenario } from '@/src/domain/reasoning-experiment/synthetic-scenario';
import { ScenarioObservationView } from './scenario-observation-view';

const sketch = syntheticScenario();
const selectClass =
  'mt-2 min-h-11 w-full rounded-md border border-border bg-card px-3 py-2';

export function ScenarioFactsExperiment() {
  const [keyframeId, setKeyframeId] = useState('middle');
  const [timing, setTiming] = useState('none');
  const [assumeRules, setAssumeRules] = useState(false);
  const observations = observeScenario(
    sketch,
    keyframeId,
    timing === 'none' ? undefined : Number(timing),
  );
  const packet = scenarioPairFacts(sketch, keyframeId, ['s', 'p'], assumeRules);
  const report = analyzeFacts(JSON.parse(JSON.stringify(packet)));
  const inventory = prerequisiteInventory(packet);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <Link
        href="/experiments/reasoning"
        className="text-primary underline underline-offset-4"
      >
        Back to source-fact reasoning
      </Link>
      <header className="my-6 border-b border-border pb-5">
        <p className="text-sm font-semibold uppercase text-muted-foreground">
          Research experiment · independently authored synthetic sketch
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Which facts can Scenario supply?
        </h1>
        <p className="mt-3">
          Use the same rule consumer with facts from a Scenario, without
          substituting the official case’s assessments. This sketch is not a
          reconstruction of Case 147.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="font-semibold">
          Keyframe
          <select
            className={selectClass}
            value={keyframeId}
            onChange={(event) => setKeyframeId(event.target.value)}
          >
            {sketch.keyframes.map((frame) => (
              <option value={frame.id} key={frame.id}>
                {frame.label}
              </option>
            ))}
          </select>
        </label>
        <label className="font-semibold">
          Experimental timing
          <select
            className={selectClass}
            value={timing}
            onChange={(event) => setTiming(event.target.value)}
          >
            <option value="none">No incident timing</option>
            <option value="1">Assume 1 second per interval</option>
            <option value="4">Assume 4 seconds per interval</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Timing changes this research calculation only. It does not edit Scenario
        or reuse animation playback seconds.
      </p>
      <ScenarioObservationView observations={observations} />

      <section className="mt-6" aria-label="Same rule consumer">
        <h2 className="text-2xl font-semibold">
          What reaches the rule consumer?
        </h2>
        <label className="my-3 flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            checked={assumeRules}
            onChange={(event) => setAssumeRules(event.target.checked)}
            className="h-5 w-5"
          />
          For this research check, assume Part 2 Section A applies.
        </label>
        <p className="text-sm text-muted-foreground">
          This is an explicit research assumption, not a fact derived from
          geometry. All tack observations apply only at the selected keyframe.
        </p>
        <ul className="mt-4 space-y-3">
          {report.findings.map((finding) => (
            <li
              key={finding.id}
              data-testid={`derived-${finding.id}`}
              className="rounded-lg border border-border p-3"
            >
              <p className="font-semibold">
                {finding.status === 'supported'
                  ? 'Conditional on the applicability assumption'
                  : 'Unresolved'}
                : {finding.label}
              </p>
              {finding.missing.length > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Still needs {finding.missing.length} prerequisite
                  {finding.missing.length === 1 ? '' : 's'} from the inventory
                  below.
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-7" aria-label="Prerequisite inventory">
        <h2 className="text-2xl font-semibold">
          Every prerequisite accounted for
        </h2>
        <div className="mt-3 space-y-2">
          {inventory.map((item) => (
            <details
              key={item.key}
              className="rounded-md border border-border p-3"
            >
              <summary className="min-h-8 cursor-pointer font-semibold">
                {item.label} —{' '}
                {item.basis === 'derived'
                  ? 'derived from authored values'
                  : item.basis === 'assumption'
                    ? 'explicit assumption'
                    : 'unresolved'}
              </summary>
              <p className="mt-2 text-sm">{item.reason}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="mt-7 rounded-lg border border-border bg-card p-4">
        <h2 className="text-xl font-semibold">
          The physical-response experiment answers a different question
        </h2>
        <p className="mt-2">
          The existing timed-luff model can certify hull clearance for a tested
          response under its declared assumptions. That certificate does not
          fill the missing room, entitlement or causation premises here.
        </p>
        <Link
          href="/experiments/luffing"
          className="mt-3 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          Inspect the timed-luff response model
        </Link>
      </section>
      <details className="mt-6">
        <summary className="min-h-8 cursor-pointer font-semibold">
          Inspect input and derived evidence
        </summary>
        <pre className="mt-3 max-h-96 overflow-auto rounded-md border border-border bg-card p-3 text-xs">
          {JSON.stringify(
            { scenario: sketch, observations, packet, report },
            null,
            2,
          )}
        </pre>
      </details>
    </main>
  );
}
