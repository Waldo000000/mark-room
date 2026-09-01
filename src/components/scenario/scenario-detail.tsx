import Link from 'next/link';

import { formatCompassDirection } from '@/src/domain/scenario/geometry';
import type {
  Scenario,
  ScenarioFact,
  ScenarioFinding,
} from '@/src/domain/scenario/schema';

import { BoatGlyph } from './boat-glyph';

type ScenarioDetailProps = {
  scenario: Scenario;
};

function boatLabel(scenario: Scenario, boatId: string | undefined): string {
  if (!boatId) return 'another boat';
  return scenario.boats.find((boat) => boat.id === boatId)?.label ?? boatId;
}

function findingLabel(scenario: Scenario, finding: ScenarioFinding): string {
  const subject = boatLabel(scenario, finding.subjectBoat);
  const other = boatLabel(scenario, finding.otherBoat);

  switch (finding.findingType) {
    case 'keep_clear':
      return `${subject} must keep clear of ${other}.`;
    case 'right_of_way':
      return `${subject} has right of way over ${other}.`;
    case 'must_give_room':
      return `${subject} must give room to ${other}.`;
    case 'entitled_to_room':
      return `${subject} is entitled to room from ${other}.`;
    case 'entitled_to_mark_room':
      return `${subject} is entitled to mark-room from ${other}.`;
    case 'must_avoid_contact':
      return `${subject} must avoid contact.`;
    case 'rule_applies':
      return `A rule applies to ${subject}.`;
    case 'rule_breached':
      return `${subject} broke a rule.`;
    case 'exonerated':
      return `${subject} is exonerated.`;
    case 'penalty':
      return `${subject} takes a penalty.`;
    case 'no_breach':
      return `${subject} did not break a rule.`;
  }
}

function factLabel(scenario: Scenario, fact: ScenarioFact): string | null {
  if (fact.type === 'tack') {
    return `${boatLabel(scenario, fact.boatId)} is on ${fact.tack} tack.`;
  }

  if (fact.type === 'overlap') {
    return `${boatLabel(scenario, fact.subjectBoat)} and ${boatLabel(scenario, fact.otherBoat)} are ${fact.relationship}.`;
  }

  return null;
}

function verificationLabel(status: Scenario['verification']['status']): string {
  return status === 'human-verified'
    ? 'Human verified'
    : status === 'agent-reviewed'
      ? 'Agent reviewed'
      : 'Unverified transcription';
}

export function ScenarioDetail({ scenario }: ScenarioDetailProps) {
  const keyframe = scenario.keyframes[0];
  const keyframeFacts = scenario.facts.filter(
    (fact) => fact.atKeyframe === keyframe.id,
  );
  const visibleFacts = keyframeFacts
    .map((fact) => ({ fact, label: factLabel(scenario, fact) }))
    .filter((item): item is { fact: ScenarioFact; label: string } =>
      Boolean(item.label),
    );
  const windDirection = formatCompassDirection(scenario.wind.fromDegrees);
  const scenarioJson = JSON.stringify(scenario, null, 2);
  const tackDescription = keyframeFacts
    .filter((fact) => fact.type === 'tack')
    .map((fact) => `${boatLabel(scenario, fact.boatId)} on ${fact.tack} tack`)
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
              {verificationLabel(scenario.verification.status)}
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
                  transform={`translate(10 12) rotate(${scenario.wind.fromDegrees})`}
                >
                  <line
                    markerEnd="url(#wind-arrow)"
                    stroke="#155e75"
                    strokeWidth="1"
                    x1="0"
                    x2="0"
                    y1="-5"
                    y2="6"
                  />
                </g>
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
                          sail={state.sail}
                        />
                      </g>
                      <text
                        fill="#0f172a"
                        fontSize="4"
                        fontWeight="600"
                        data-testid={`boat-label-${boat.id}`}
                        textAnchor={labelOnLeft ? 'end' : 'start'}
                        x={state.position.x + (labelOnLeft ? -11 : 11)}
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
              {visibleFacts.map(({ fact, label }) => (
                <div
                  key={fact.id}
                  className="border-l-4 border-primary pl-3 text-sm leading-6 text-muted-foreground"
                  data-boat-id={'boatId' in fact ? fact.boatId : undefined}
                  data-fact-type={fact.type}
                >
                  {label}
                </div>
              ))}
            </div>
          </section>

          <aside className="min-w-0 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <section>
              <p className="text-sm font-semibold uppercase text-muted-foreground">
                Authored ruling
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                {scenario.ruling.conclusion}
              </h2>
              <div className="mt-5 space-y-5">
                {scenario.ruling.findings.map((finding) => (
                  <article
                    key={finding.id}
                    data-finding-type={finding.findingType}
                    data-testid={`finding-${finding.id}`}
                  >
                    <h3 className="font-semibold">
                      {findingLabel(scenario, finding)}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {finding.ruleRefs.join(', ')}
                    </p>
                    {finding.explanation ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {finding.explanation}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
              {scenario.teachingText ? (
                <p className="mt-5 border-l-4 border-accent pl-3 text-sm leading-6">
                  {scenario.teachingText}
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
              Scenario JSON
            </summary>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              This is the exact validated scenario record driving the diagram
              and authored ruling above.
            </p>
            <pre
              className="mt-4 max-h-[42rem] overflow-auto rounded-md border border-border bg-slate-950 p-4 text-xs leading-5 text-slate-100"
              data-testid="scenario-json"
            >
              {scenarioJson}
            </pre>
          </details>
        </section>
      </div>
    </main>
  );
}
