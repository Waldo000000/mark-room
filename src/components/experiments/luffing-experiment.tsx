'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { JointReasoningPanel } from './joint-reasoning-panel';
import {
  BoatGlyph,
  BOAT_GLYPH_INTERNAL_HULL_LENGTH,
  deriveSailPresentation,
} from '@/src/components/scenario/boat-glyph';
import {
  analyzeShared,
  combinations,
  deriveFindings,
} from '@/src/domain/derivation-experiment/analyze';
import { assessFindings } from '@/src/domain/derivation-experiment/findings';
import {
  CASES,
  PROFILE,
  traceAt,
} from '@/src/domain/derivation-experiment/model';

const labels = { L: 'Leeward', M: 'Middle', W: 'Windward' };
const colors = { L: '#2563EB', M: '#A16207', W: '#DC2626' };
const fieldClass =
  'mt-2 min-h-11 w-full rounded-md border border-border bg-card px-3 py-2';

export function LuffingExperiment() {
  const [caseId, setCaseId] = useState(CASES[0].id);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null,
  );
  const [time, setTime] = useState(0);
  const encounter = CASES.find((item) => item.id === caseId) ?? CASES[0];
  const analysis = useMemo(() => {
    const packet = deriveFindings(encounter);
    const serialized = JSON.stringify(packet);
    // Actually cross a value-only boundary in the review path as well as tests.
    const strict = assessFindings(JSON.parse(serialized));
    const shared = analyzeShared(encounter);
    return {
      packet,
      strict,
      shared,
      choices: combinations(encounter),
      packetBytes: new TextEncoder().encode(serialized).length,
      readablePacket: JSON.stringify(packet, null, 2),
    };
  }, [encounter]);
  const candidateId =
    selectedCandidate ??
    analysis.strict.witnessId ??
    analysis.packet.candidates[0].id;
  const candidateIndex = analysis.packet.candidates.findIndex(
    (candidate) => candidate.id === candidateId,
  );
  const index = Math.max(0, candidateIndex);
  const evidence = analysis.packet.candidates[index];
  const choice = analysis.choices[index];
  const poses = traceAt(encounter, choice.middle, choice.windward, time);
  const agrees =
    analysis.strict.status === analysis.shared.assessment.status &&
    analysis.strict.witnessId === analysis.shared.assessment.witnessId;
  const found = analysis.strict.status === 'witness-found';

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <Link href="/" className="text-primary underline underline-offset-4">
        Back to MarkRoom
      </Link>
      <header className="my-6 border-b border-border pb-6">
        <p className="text-sm font-semibold uppercase text-muted-foreground">
          Research prototype · synthetic, unverified scenarios
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Does Situation need the moving scene?
        </h1>
        <p className="mt-3 max-w-3xl">
          Compare a complete findings packet with analysis over shared encounter
          data. Both test the same finite set of luffing responses.
        </p>
        <p className="mt-3 font-semibold">
          These are hull-clearance experiments, not rules verdicts or a
          validated model of room.
        </p>
      </header>

      <label className="block font-semibold">
        Encounter
        <select
          className={fieldClass}
          value={caseId}
          onChange={(event) => {
            setCaseId(event.target.value);
            setSelectedCandidate(null);
            setTime(0);
          }}
        >
          {CASES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-3 text-muted-foreground">{encounter.question}</p>

      <section
        className="my-5 rounded-lg border border-border bg-card p-4"
        aria-live="polite"
        aria-label="Analysis result"
      >
        <h2 className="text-xl font-semibold" data-testid="assessment-status">
          {found
            ? 'A model response is available'
            : 'No certified response in the tested set'}
        </h2>
        <p className="mt-2">
          {found
            ? 'At least one joint response maintains clearance between every model hull for the full five-second interval.'
            : 'This search does not establish that room was insufficient. Other manoeuvres or handling assumptions may change the answer.'}
        </p>
        {encounter.minimumMiddleDelay && (
          <p className="mt-2">
            This case restricts the response subset. A delayed actual response
            does not establish that an earlier opportunity was unavailable.
          </p>
        )}
        <p className="mt-3 font-semibold" data-testid="boundary-agreement">
          {agrees ? 'Both interfaces agree.' : 'The interfaces disagree.'}
        </p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-muted-foreground">Complete packet</dt>
            <dd>
              {analysis.strict.evaluatedCandidates} combinations evaluated
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Shared analysis</dt>
            <dd>
              {analysis.shared.assessment.evaluatedCandidates} combinations
              evaluated
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Serialized packet</dt>
            <dd>{analysis.packetBytes.toLocaleString('en-US')} UTF-8 bytes</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-muted-foreground">
          The packet eagerly records every candidate; shared analysis stops at
          the first witness. This is a comparison of these implementations, not
          an inherent cost of a strict boundary.
        </p>
      </section>

      {encounter.boats.length > 2 && (
        <JointReasoningPanel packet={analysis.packet} />
      )}

      <section
        aria-label="Inspect a response"
        className="grid items-start gap-5 md:grid-cols-2"
      >
        <div>
          <label className="block font-semibold">
            Response combination
            <select
              className={fieldClass}
              value={evidence.id}
              onChange={(event) => setSelectedCandidate(event.target.value)}
            >
              {analysis.packet.candidates.map((candidate, candidateNumber) => {
                const pair = analysis.choices[candidateNumber];
                return (
                  <option key={candidate.id} value={candidate.id}>
                    M: {pair.middle.delay}s / {pair.middle.rate}°/s
                    {pair.windward
                      ? `; W: ${pair.windward.delay}s / ${pair.windward.rate}°/s`
                      : ''}
                  </option>
                );
              })}
            </select>
          </label>
          <p className="mt-2 text-sm text-muted-foreground">
            M responds after L begins turning; W responds after M begins.
            Selection is retrospective: a witness does not prove that this
            choice was evident to the sailor.
          </p>
          <label htmlFor="luff-time" className="mt-4 block font-semibold">
            Time: <output data-testid="time-value">{time.toFixed(2)} s</output>
          </label>
          <input
            id="luff-time"
            className="mt-2 min-h-11 w-full accent-primary"
            type="range"
            min="0"
            max={PROFILE.horizonSeconds}
            step="0.05"
            value={time}
            onChange={(event) => setTime(Number(event.target.value))}
          />
          <svg
            viewBox="0 0 8 7"
            aria-label="Selected hypothetical luffing response"
            className="w-full rounded-md border border-border bg-background"
            data-testid="luff-diagram"
            data-wind-from="0"
          >
            <title>Selected hypothetical luffing response</title>
            <text x="0.3" y="0.45" fontSize="0.25" fill="currentColor">
              Wind from north
            </text>
            <path
              d="M 0.65 0.7 V 1.35 M 0.48 1.15 L 0.65 1.35 L 0.82 1.15"
              stroke="currentColor"
              strokeWidth="0.035"
              fill="none"
            />
            {poses.map((pose) => (
              <g
                key={pose.id}
                data-testid={`experiment-boat-${pose.id}`}
                data-x={pose.x}
                data-y={pose.y}
                data-heading={pose.heading}
                data-tack="starboard"
              >
                <g
                  transform={`translate(${pose.x} ${7 - pose.y}) rotate(${pose.heading})`}
                >
                  <rect
                    x="-0.2"
                    y="-0.5"
                    width="0.4"
                    height="1"
                    rx="0.2"
                    fill={colors[pose.id]}
                    fillOpacity="0.1"
                    stroke={colors[pose.id]}
                    strokeWidth="0.018"
                    data-testid="evaluated-footprint"
                  />
                  <g
                    transform={`translate(0 ${9 / BOAT_GLYPH_INTERNAL_HULL_LENGTH - 0.5})`}
                  >
                    <BoatGlyph
                      color={colors[pose.id]}
                      sail={deriveSailPresentation(
                        pose.heading,
                        0,
                        'starboard',
                      )}
                    />
                  </g>
                </g>
                <text
                  x={pose.x + 0.48}
                  y={7 - pose.y}
                  fontSize="0.26"
                  fill="currentColor"
                >
                  {pose.id}
                </text>
              </g>
            ))}
            <path
              d="M 0.4 6.55 H 1.4 M 0.4 6.45 V 6.65 M 1.4 6.45 V 6.65"
              stroke="currentColor"
              strokeWidth="0.025"
            />
            <text x="0.4" y="6.95" fontSize="0.23" fill="currentColor">
              1 hull length
            </text>
          </svg>
          <p className="mt-2 text-sm text-muted-foreground">
            L = Leeward · M = Middle
            {encounter.boats.includes('W') ? ' · W = Windward' : ''}. Pale
            outlines are the evaluated capsules. Sails are illustrative;
            equipment contact is not assessed.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">
            Evidence for this combination
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            One combination must satisfy every pair. A different successful
            response for each pair is not enough.
          </p>
          <ul className="mt-3 space-y-3" data-testid="pair-evidence">
            {evidence.pairs.map((pair) => (
              <li
                key={pair.boats.join('-')}
                className="rounded-md border border-border p-3"
              >
                <p className="font-semibold">
                  {pair.boats
                    .map((boat) => labels[boat as keyof typeof labels])
                    .join(' / ')}
                </p>
                <p>
                  {pair.status === 'clearance-certified'
                    ? 'Clearance certified over the interval'
                    : pair.status === 'hull-intersection'
                      ? 'Model hulls intersect at a sampled instant'
                      : 'Between-sample clearance not resolved'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Minimum sampled clearance:{' '}
                  {pair.minimumSampledClearanceHullLengths.toFixed(3)} hull
                  lengths at {pair.limitingSampleSeconds.toFixed(3)} s.
                  Conservative interval bound:{' '}
                  {pair.lowerClearanceBoundHullLengths.toFixed(3)} hull lengths.
                </p>
              </li>
            ))}
          </ul>
          <details className="mt-5 border-t border-border pt-3">
            <summary className="min-h-11 cursor-pointer font-semibold">
              Declared assumptions
            </summary>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li>
                Identical one-hull-length capsules, width 0.4; flat water,
                constant wind from north.
              </li>
              <li>
                Every boat starts at 300° on starboard; a response turns 45°
                toward the wind at constant 0.8 hull lengths/s.
              </li>
              <li>
                L turns at {encounter.luffRate}°/s, starting at{' '}
                {encounter.luffStart}s. Responses use delays 0.25, 0.6 or 1s and
                rates 12, 24 or 36°/s.
              </li>
              <li>
                No speed loss, acceleration limits, sheet handling, current,
                tactical choices or tacking. None of these constants is an RRS
                threshold.
              </li>
              <li>
                Sample spacing is at most 0.025s. A conservative motion bound
                certifies intervals; an uncertain bound is not labelled contact.
              </li>
              <li>
                The result covers five seconds only. These inputs are
                hypothetical, not reconstructed official-case geometry.
              </li>
            </ul>
          </details>
        </div>
      </section>

      <section className="mt-8 border-t border-border pt-5">
        <h2 className="text-xl font-semibold">
          What this says about the architecture
        </h2>
        <p className="mt-3">
          The strict interface works for this bounded question: its consumer
          receives only candidate IDs and pairwise clearance findings. Geometry
          and time integration happen in the producer. Shared analysis uses the
          same evaluator as needed. Agreement is a boundary check, not
          independent confirmation of the physical model.
        </p>
        <p className="mt-3">
          Keep the production model provisional. This experiment has not derived
          seamanlike room, legal breaches, exoneration or a universally
          sufficient Situation. The next decision is whether a scoped findings
          packet remains useful as the actual rule predicates are added.
        </p>
        <p className="mt-3 text-sm">
          Source anchors:{' '}
          <a
            className="text-primary underline"
            href="https://media.sailing.org/sailing/wp-content/uploads/2025/07/31104846/WS-Case-Book-2025-2028-v2025-07.pdf#page=253"
          >
            World Sailing Case 114
          </a>{' '}
          (room through a group) and{' '}
          <a
            className="text-primary underline"
            href="https://media.sailing.org/sailing/wp-content/uploads/2025/07/31104846/WS-Case-Book-2025-2028-v2025-07.pdf#page=213"
          >
            Case 92
          </a>{' '}
          (no required foresight).
        </p>
        <details className="mt-5">
          <summary className="min-h-11 cursor-pointer font-semibold">
            Serialized findings packet
          </summary>
          <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
            {analysis.readablePacket}
          </pre>
        </details>
      </section>
    </main>
  );
}
