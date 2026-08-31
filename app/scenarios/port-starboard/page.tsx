import type { Metadata } from 'next';
import Link from 'next/link';

import validDevelopmentScenario from '@/src/domain/scenario/__fixtures__/valid-development-scenario.json';
import { scenarioSchema } from '@/src/domain/scenario/schema';

export const metadata: Metadata = {
  title: 'Port meets starboard | MarkRoom',
  description:
    'An unverified MarkRoom scenario illustrating a port-starboard crossing.',
};

const scenario = scenarioSchema.parse(validDevelopmentScenario);
const keyframe = scenario.keyframes[0];

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
              Unverified transcription
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
              <p className="text-sm text-muted-foreground">Wind from north</p>
            </div>

            <div className="mt-3 aspect-square w-full overflow-hidden rounded-md border border-border bg-cyan-50 p-3 sm:p-5">
              <svg
                aria-labelledby="scenario-diagram-title"
                className="size-full"
                viewBox={`0 0 ${scenario.sailingArea.width} ${scenario.sailingArea.height}`}
              >
                <title id="scenario-diagram-title">
                  Blue on starboard tack and Yellow on port tack approaching
                  each other
                </title>
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

                <line
                  markerEnd="url(#wind-arrow)"
                  stroke="#155e75"
                  strokeWidth="1"
                  x1="10"
                  x2="10"
                  y1="18"
                  y2="7"
                />
                <text fill="#155e75" fontSize="4" x="15" y="12">
                  WIND
                </text>

                {keyframe.boatStates.map((state) => {
                  const boat = scenario.boats.find(
                    (candidate) => candidate.id === state.boatId,
                  );
                  if (!boat) return null;

                  const screenY =
                    scenario.sailingArea.height - state.position.y;

                  return (
                    <g key={boat.id}>
                      <g
                        transform={`translate(${state.position.x} ${screenY}) rotate(${state.headingDegrees})`}
                      >
                        <path
                          d="M 0 -9 L 4 5 L 0 8 L -4 5 Z"
                          fill={boat.color ?? '#0f766e'}
                          stroke="#0f172a"
                          strokeWidth="0.8"
                        />
                        <line
                          stroke="#ffffff"
                          strokeWidth="0.7"
                          x1="0"
                          x2="0"
                          y1="-7"
                          y2="5"
                        />
                      </g>
                      <text
                        fill="#0f172a"
                        fontSize="4"
                        fontWeight="600"
                        x={state.position.x + 6}
                        y={screenY - 5}
                      >
                        {boat.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {scenario.facts.map((fact) => {
                if (fact.type !== 'tack') return null;
                const boat = scenario.boats.find(
                  (candidate) => candidate.id === fact.boatId,
                );

                return (
                  <div
                    key={fact.id}
                    className="border-l-4 border-primary pl-3 text-sm leading-6"
                  >
                    <span className="font-semibold">{boat?.label}</span>{' '}
                    <span className="text-muted-foreground">
                      is on {fact.tack} tack.
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
                Yellow must keep clear of Blue.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Yellow is on port tack and Blue is on starboard tack. The
                structured finding cites{' '}
                {scenario.ruling.findings[0].ruleRefs.join(', ')}.
              </p>
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
              {scenario.provenance.map((source) => (
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
      </div>
    </main>
  );
}
