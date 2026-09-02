import Link from 'next/link';

import type { CorpusMetadata } from '@/src/domain/corpus/schema';
import type { ScenarioEvalCase } from '@/src/domain/eval/schema';
import type { Obligation } from '@/src/domain/ruling/schema';
import { formatCompassDirection } from '@/src/domain/scenario/geometry';
import type { Scenario } from '@/src/domain/scenario/schema';
import type { SituationRelationship } from '@/src/domain/situation/schema';

import { BoatGlyph } from './boat-glyph';

const DIAGRAM_FONT_SIZE = 0.24;
const BOAT_LABEL_X_OFFSET = 0.66;
const BOAT_LABEL_Y_OFFSET = 0.3;

type ScenarioDetailProps = {
  evalCase: ScenarioEvalCase;
  metadata: CorpusMetadata;
};

function boatLabel(scenario: Scenario, boatId: string | undefined): string {
  if (!boatId) return 'another boat';
  return scenario.boats.find((boat) => boat.id === boatId)?.label ?? boatId;
}

function obligationLabel(scenario: Scenario, obligation: Obligation): string {
  const subject = boatLabel(scenario, obligation.boatId);
  const other = boatLabel(scenario, obligation.owedToBoatId);

  switch (obligation.type) {
    case 'keep-clear':
      return `${subject} must keep clear of ${other}.`;
    case 'give-room':
      return `${subject} must give room to ${other}.`;
    case 'give-mark-room':
      return `${subject} must give mark-room to ${other}.`;
    case 'avoid-contact':
      return `${subject} must avoid contact.`;
  }
}

function relationshipLabel(
  scenario: Scenario,
  relationship: SituationRelationship,
): string | null {
  switch (relationship.type) {
    case 'relative-position':
      return `${boatLabel(scenario, relationship.subjectBoatId)} and ${boatLabel(scenario, relationship.otherBoatId)} are ${relationship.relationship}.`;
    case 'windward-leeward':
      return `${boatLabel(scenario, relationship.windwardBoatId)} is windward of ${boatLabel(scenario, relationship.leewardBoatId)}.`;
    case 'contact':
      return `${relationship.boatIds.map((boatId) => boatLabel(scenario, boatId)).join(' and ')} made contact.`;
    case 'proximity':
      return `${boatLabel(scenario, relationship.subjectBoatId)} is ${relationship.separationHullLengths} hull lengths from ${boatLabel(scenario, relationship.otherBoatId)}.`;
    case 'available-room':
      return `${boatLabel(scenario, relationship.boatId)} ${relationship.available ? 'has' : 'does not have'} room for ${relationship.purpose}.`;
  }
}

function verificationLabel(
  status: CorpusMetadata['verification']['status'],
): string {
  return status === 'human-verified'
    ? 'Human verified'
    : status === 'agent-reviewed'
      ? 'Agent reviewed'
      : 'Unverified transcription';
}

export function ScenarioDetail({ evalCase, metadata }: ScenarioDetailProps) {
  const scenario = evalCase.input;
  const situation = evalCase.expected.situation;
  const ruling = evalCase.expected.ruling;
  const keyframe = scenario.keyframes[0];
  const moment = situation.moments.find(
    (candidate) => candidate.id === keyframe.id,
  );
  if (!moment) throw new Error(`Missing Situation moment: ${keyframe.id}`);

  const windDirection = formatCompassDirection(scenario.wind.fromDegrees);
  const evalJson = JSON.stringify(evalCase, null, 2);
  const tackDescription = moment.boatStates
    .map(
      (state) => `${boatLabel(scenario, state.boatId)} on ${state.tack} tack`,
    )
    .join(' and ');
  const diagramTitle = `${tackDescription} in wind from ${windDirection}`;

  return (
    <main
      className="min-h-screen bg-background text-foreground"
      data-scenario-id={scenario.id}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/scenarios"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Back to scenarios
        </Link>

        <header className="mt-7 border-b border-border pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold uppercase text-muted-foreground">
              Scenario
            </p>
            <span
              className="rounded-sm border border-amber-600 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900"
              data-testid="verification-status"
            >
              {verificationLabel(metadata.verification.status)}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            {scenario.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            {scenario.prompt}
          </p>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)]">
          <section className="min-w-0">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold">{keyframe.label}</h2>
              <p className="text-sm text-muted-foreground">
                Wind from {windDirection}
              </p>
            </div>

            <div
              className="mt-3 aspect-square w-full overflow-hidden rounded-md border border-border bg-cyan-50 p-3 sm:p-5"
              data-testid="scenario-diagram"
            >
              <svg
                aria-labelledby="scenario-diagram-title"
                className="size-full"
                viewBox={`0 0 ${scenario.sailingArea.width} ${scenario.sailingArea.height}`}
              >
                <title id="scenario-diagram-title">{diagramTitle}</title>
                <defs>
                  <marker
                    id="wind-arrow"
                    markerHeight="5"
                    markerWidth="5"
                    orient="auto"
                    refX="4"
                    refY="2.5"
                  >
                    <path d="M0,0 L5,2.5 L0,5 Z" fill="#155e75" />
                  </marker>
                </defs>

                <g
                  data-testid="wind-indicator"
                  data-wind-from-degrees={scenario.wind.fromDegrees}
                  transform={`translate(0.6 0.72) rotate(${scenario.wind.fromDegrees})`}
                >
                  <line
                    markerEnd="url(#wind-arrow)"
                    stroke="#155e75"
                    strokeWidth="0.06"
                    x1="0"
                    x2="0"
                    y1="-0.3"
                    y2="0.36"
                  />
                </g>
                <text
                  fill="#155e75"
                  fontSize={DIAGRAM_FONT_SIZE}
                  x="0.9"
                  y="0.72"
                >
                  WIND
                </text>

                {keyframe.boatStates.map((state) => {
                  const boat = scenario.boats.find(
                    (candidate) => candidate.id === state.boatId,
                  );
                  const situationState = moment.boatStates.find(
                    (candidate) => candidate.boatId === state.boatId,
                  );
                  if (!boat || !situationState) return null;

                  const screenY =
                    scenario.sailingArea.height - state.position.y;
                  const labelOnLeft =
                    state.position.x < scenario.sailingArea.width / 2;

                  return (
                    <g
                      key={boat.id}
                      data-boat-id={boat.id}
                      data-heading-degrees={state.headingDegrees}
                      data-testid={`boat-${boat.id}`}
                    >
                      <g
                        transform={`translate(${state.position.x} ${screenY}) rotate(${state.headingDegrees})`}
                      >
                        <BoatGlyph
                          color={boat.color ?? '#0f766e'}
                          sail={situationState.sail}
                        />
                      </g>
                      <text
                        fill="#0f172a"
                        fontSize={DIAGRAM_FONT_SIZE}
                        fontWeight="600"
                        data-testid={`boat-label-${boat.id}`}
                        textAnchor={labelOnLeft ? 'end' : 'start'}
                        x={
                          state.position.x +
                          (labelOnLeft
                            ? -BOAT_LABEL_X_OFFSET
                            : BOAT_LABEL_X_OFFSET)
                        }
                        y={screenY - BOAT_LABEL_Y_OFFSET}
                      >
                        {boat.label}
                      </text>
                    </g>
                  );
                })}

                <g
                  data-testid="hull-length-scale"
                  transform={`translate(${scenario.sailingArea.width - 1.3} ${scenario.sailingArea.height - 0.3})`}
                >
                  <text
                    fill="#155e75"
                    fontSize="0.2"
                    textAnchor="middle"
                    x="0.5"
                    y="-0.14"
                  >
                    1 hull length
                  </text>
                  <line
                    data-testid="hull-length-scale-line"
                    stroke="#155e75"
                    strokeWidth="0.035"
                    x1="0"
                    x2="1"
                    y1="0"
                    y2="0"
                  />
                  <path
                    d="M 0 -0.08 V 0.08 M 1 -0.08 V 0.08"
                    fill="none"
                    stroke="#155e75"
                    strokeWidth="0.035"
                  />
                </g>
              </svg>
            </div>

            <section className="mt-5" aria-labelledby="situation-heading">
              <p className="text-sm font-semibold uppercase text-muted-foreground">
                Expected situation
              </p>
              <h2 id="situation-heading" className="mt-1 text-lg font-semibold">
                RRS-language observations at {moment.label}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {moment.boatStates.map((state) => (
                  <div
                    key={state.boatId}
                    className="border-l-4 border-primary pl-3 text-sm leading-6 text-muted-foreground"
                    data-boat-id={state.boatId}
                    data-situation-type="tack"
                  >
                    {boatLabel(scenario, state.boatId)} is on {state.tack} tack
                    and {state.pointOfSail}.
                  </div>
                ))}
                {moment.relationships.map((relationship, index) => (
                  <div
                    key={`${relationship.type}-${index}`}
                    className="border-l-4 border-primary pl-3 text-sm leading-6 text-muted-foreground"
                    data-situation-type={relationship.type}
                  >
                    {relationshipLabel(scenario, relationship)}
                  </div>
                ))}
              </div>
            </section>
          </section>

          <aside className="min-w-0 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <section>
              <p className="text-sm font-semibold uppercase text-muted-foreground">
                Expected ruling
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                {ruling.conclusion}
              </h2>
              <div className="mt-5 space-y-5">
                {ruling.obligations.map((obligation) => (
                  <article
                    key={obligation.id}
                    data-obligation-type={obligation.type}
                    data-testid={`obligation-${obligation.id}`}
                  >
                    <h3 className="font-semibold">
                      {obligationLabel(scenario, obligation)}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {obligation.ruleRefs.join(', ')}
                    </p>
                    {obligation.explanation ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {obligation.explanation}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
              {metadata.teachingText ? (
                <p className="mt-5 border-l-4 border-accent pl-3 text-sm leading-6">
                  {metadata.teachingText}
                </p>
              ) : null}
            </section>

            <section className="mt-7 border-t border-border pt-6">
              <h2 className="text-base font-semibold">
                Why the caution label?
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                World Sailing is the authoritative rules source, but this
                diagram and MarkRoom transcription have not yet been checked by
                a human rules expert.
              </p>
            </section>

            <section className="mt-7 border-t border-border pt-6">
              <h2 className="text-base font-semibold">Source</h2>
              {metadata.provenance.map((source) => (
                <div key={source.sourceId} className="mt-3 text-sm leading-6">
                  <p className="font-semibold">{source.title}</p>
                  <p className="text-muted-foreground">
                    {source.pageOrSection}
                  </p>
                  {source.url ? (
                    <a
                      className="mt-2 inline-block font-semibold text-primary underline underline-offset-4"
                      href={source.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open World Sailing source
                    </a>
                  ) : null}
                </div>
              ))}
            </section>
          </aside>
        </div>

        <section className="mt-10 border-t border-border pt-8">
          <details open>
            <summary className="cursor-pointer text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4">
              Pipeline eval JSON
            </summary>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              This exact validated record keeps the editable Scenario, expected
              Situation, and expected Ruling visibly separate.
            </p>
            <pre
              className="mt-4 max-h-[42rem] overflow-auto rounded-md border border-border bg-slate-950 p-4 text-xs leading-5 text-slate-100"
              data-testid="scenario-json"
            >
              {evalJson}
            </pre>
          </details>
        </section>
      </div>
    </main>
  );
}
