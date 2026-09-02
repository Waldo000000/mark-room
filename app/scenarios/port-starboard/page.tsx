import type { Metadata } from 'next';
import Link from 'next/link';

import portStarboardMetadata from '@/corpus/metadata/port-starboard.json';
import {
  BoatGlyph,
  deriveSailPresentation,
} from '@/src/components/scenario/boat-glyph';
import { corpusMetadataSchema } from '@/src/domain/corpus/schema';
import { scenarioEvalCaseSchema } from '@/src/domain/eval/schema';
import portStarboardRuling from '@/src/domain/ruling/__fixtures__/port-starboard-ruling.json';
import validDevelopmentScenario from '@/src/domain/scenario/__fixtures__/valid-development-scenario.json';
import { formatCompassDirection } from '@/src/domain/scenario/geometry';
import portStarboardSituation from '@/src/domain/situation/__fixtures__/port-starboard-situation.json';

const DIAGRAM_FONT_SIZE = 0.24;
const BOAT_LABEL_X_OFFSET = 0.66;
const BOAT_LABEL_Y_OFFSET = 0.3;

export const metadata: Metadata = {
  title: 'Port meets starboard | MarkRoom',
  description:
    'An unverified MarkRoom scenario illustrating a port-starboard crossing.',
};

const evalCase = scenarioEvalCaseSchema.parse({
  input: validDevelopmentScenario,
  expected: {
    situation: portStarboardSituation,
    ruling: portStarboardRuling,
  },
});
const scenario = evalCase.input;
const { ruling, situation } = evalCase.expected;
const corpusMetadata = corpusMetadataSchema.parse(portStarboardMetadata);

if (corpusMetadata.scenarioId !== scenario.id) {
  throw new Error(
    `Corpus metadata references ${corpusMetadata.scenarioId}, expected ${scenario.id}`,
  );
}
if (
  situation.scenarioId !== scenario.id ||
  JSON.stringify(situation.context) !== JSON.stringify(scenario.context)
) {
  throw new Error('Expected Situation does not match the Scenario');
}

const verificationLabel = {
  unverified: 'Unverified transcription',
  'agent-reviewed': 'Agent-reviewed transcription',
  'human-verified': 'Human-verified transcription',
}[corpusMetadata.verification.status];
const keyframe = scenario.keyframes[0];
const situationMoment = situation.moments[0];
const obligation = ruling.obligations[0];
const subjectBoat = scenario.boats.find(
  (boat) => boat.id === obligation.boatId,
);
const otherBoat = scenario.boats.find(
  (boat) => boat.id === obligation.owedToBoatId,
);
const subjectState = situationMoment.boatStates.find(
  (state) => state.boatId === obligation.boatId,
);
const otherState = situationMoment.boatStates.find(
  (state) => state.boatId === obligation.owedToBoatId,
);
const windDirection = formatCompassDirection(scenario.wind.fromDegrees);
const scenarioJson = JSON.stringify(scenario, null, 2);
const situationJson = JSON.stringify(situation, null, 2);
const rulingJson = JSON.stringify(ruling, null, 2);
const evalCaseJson = JSON.stringify(evalCase, null, 2);
const diagramTitle = `${keyframe.boatStates
  .map((state) => {
    const boat = scenario.boats.find(
      (candidate) => candidate.id === state.boatId,
    );
    return `${boat?.label} on ${state.tack} tack`;
  })
  .join(' and ')} approaching each other in wind from ${windDirection}`;

export default function PortStarboardScenarioPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Back to MarkRoom
        </Link>

        <header className="mt-7 border-b border-border pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold uppercase text-muted-foreground">
              Scenario
            </p>
            <span className="rounded-sm border border-amber-600 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
              {verificationLabel}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            {scenario.title}
          </h1>
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
                  if (!boat) return null;

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
                          sail={deriveSailPresentation(
                            state.headingDegrees,
                            scenario.wind.fromDegrees,
                            state.tack,
                          )}
                        />
                      </g>
                      <text
                        fill="#0f172a"
                        fontSize={DIAGRAM_FONT_SIZE}
                        fontWeight="600"
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

            <p className="mt-5 text-sm font-semibold uppercase text-muted-foreground">
              Expected Situation
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {situationMoment.boatStates.map((state) => {
                const boat = situation.boats.find(
                  (candidate) => candidate.id === state.boatId,
                );

                return (
                  <div
                    key={state.boatId}
                    className="border-l-4 border-primary pl-3 text-sm leading-6"
                  >
                    <span className="font-semibold">{boat?.label}</span>{' '}
                    <span className="text-muted-foreground">
                      is on {state.tack} tack and {state.pointOfSail}.
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="min-w-0 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <section>
              <p className="text-sm font-semibold uppercase text-muted-foreground">
                Finding
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                {subjectBoat?.label} must keep clear of {otherBoat?.label}.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {subjectBoat?.label} is on {subjectState?.tack} tack and{' '}
                {otherBoat?.label} is on {otherState?.tack} tack. The structured
                obligation cites {obligation.ruleRefs.join(', ')}.
              </p>
              {corpusMetadata.teachingText ? (
                <p className="mt-3 border-l-4 border-primary pl-3 text-sm leading-6">
                  {corpusMetadata.teachingText}
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
              {corpusMetadata.provenance.map((source) => (
                <div key={source.sourceId} className="mt-3 text-sm leading-6">
                  <p className="font-semibold">{source.title}</p>
                  <p className="text-muted-foreground">
                    {source.pageOrSection}
                  </p>
                  {source.url ? (
                    <a
                      className="mt-2 inline-block font-semibold text-primary underline underline-offset-4"
                      href={source.url}
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
              Scenario JSON
            </summary>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              This is the exact input record driving the diagram. Derived RRS
              observations, rulings, corpus notes, sources, and verification are
              kept separately.
            </p>
            <pre
              className="mt-4 max-h-[42rem] overflow-auto rounded-md border border-border bg-slate-950 p-4 text-xs leading-5 text-slate-100"
              data-testid="scenario-json"
            >
              {scenarioJson}
            </pre>
          </details>
          <details className="mt-6" open>
            <summary className="cursor-pointer text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4">
              Expected Situation JSON
            </summary>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              This authored expectation describes the same moment in RRS
              language. A future deterministic geometry transform will produce
              this model from Scenario.
            </p>
            <pre
              className="mt-4 max-h-[42rem] overflow-auto rounded-md border border-border bg-slate-950 p-4 text-xs leading-5 text-slate-100"
              data-testid="situation-json"
            >
              {situationJson}
            </pre>
          </details>
          <details className="mt-6" open>
            <summary className="cursor-pointer text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4">
              Expected Ruling JSON
            </summary>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              This authored expectation records deterministic obligations and
              outcomes. A future rules transform will produce it from Situation.
            </p>
            <pre
              className="mt-4 max-h-[42rem] overflow-auto rounded-md border border-border bg-slate-950 p-4 text-xs leading-5 text-slate-100"
              data-testid="ruling-json"
            >
              {rulingJson}
            </pre>
          </details>
          <details className="mt-6">
            <summary className="cursor-pointer text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4">
              Complete EvalCase JSON
            </summary>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              The complete evaluation record composes only Scenario input and
              the expected Situation and Ruling outputs.
            </p>
            <pre
              className="mt-4 max-h-[42rem] overflow-auto rounded-md border border-border bg-slate-950 p-4 text-xs leading-5 text-slate-100"
              data-testid="eval-case-json"
            >
              {evalCaseJson}
            </pre>
          </details>
        </section>
      </div>
    </main>
  );
}
