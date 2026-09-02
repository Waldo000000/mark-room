import Link from 'next/link';

import { ApplicableRuleQuiz } from '@/src/components/quiz/applicable-rule-quiz';
import { KeepClearQuiz } from '@/src/components/quiz/keep-clear-quiz';
import { MarkRoomQuiz } from '@/src/components/quiz/mark-room-quiz';
import {
  BoatGlyph,
  deriveSailPresentation,
} from '@/src/components/scenario/boat-glyph';
import {
  describeObligation,
  describeOutcome,
  selectRulingStatements,
} from '@/src/components/scenario/ruling-presentation';
import type { CorpusMetadata } from '@/src/domain/corpus/schema';
import { deriveApplicableRuleQuestion } from '@/src/domain/quiz/applicable-rule';
import { deriveKeepClearQuestion } from '@/src/domain/quiz/keep-clear';
import { deriveMarkRoomQuestion } from '@/src/domain/quiz/mark-room';
import { formatCompassDirection } from '@/src/domain/scenario/geometry';
import { deriveMarkZones } from '@/src/domain/scenario/mark-zone';
import type { TrainingExample } from '@/src/domain/training-example/schema';

const DIAGRAM_FONT_SIZE = 0.24;
const BOAT_LABEL_X_OFFSET = 0.66;
const BOAT_LABEL_Y_OFFSET = 0.3;

type TrainingExampleViewProps = {
  availableRuleReferences: string[];
  corpusMetadata: CorpusMetadata;
  quizMode: boolean;
  quizQuestionType: 'applicable-rule' | 'keep-clear' | 'mark-room';
  scenarioSlug: string;
  selectedKeyframeId: string;
  trainingExample: TrainingExample;
};

export function TrainingExampleView({
  availableRuleReferences,
  corpusMetadata,
  quizMode,
  quizQuestionType,
  scenarioSlug,
  selectedKeyframeId,
  trainingExample,
}: TrainingExampleViewProps) {
  const { rulings, scenario, situation } = trainingExample;
  const verificationLabel = {
    unverified: 'Unverified transcription',
    'agent-reviewed': 'Agent-reviewed transcription',
    'human-verified': 'Human-verified transcription',
  }[corpusMetadata.verification.status];
  const keyframe =
    scenario.keyframes.find(
      (candidate) => candidate.id === selectedKeyframeId,
    ) ?? scenario.keyframes[0];
  const situationMoment =
    situation.moments.find((candidate) => candidate.id === keyframe.id) ??
    situation.moments[0];
  const selectedRulings = selectRulingStatements(rulings, situationMoment.id);
  const markPositions = situationMoment.relationships.filter(
    (relationship) => relationship.type === 'mark-position',
  );
  const quizQuestion = deriveKeepClearQuestion(
    trainingExample,
    situationMoment.id,
  );
  const ruleQuizQuestion = deriveApplicableRuleQuestion(
    trainingExample,
    situationMoment.id,
    availableRuleReferences,
  );
  const markRoomQuizQuestion = deriveMarkRoomQuestion(
    trainingExample,
    situationMoment.id,
  );
  const boatLabels = new Map(
    scenario.boats.map((boat) => [boat.id, boat.label]),
  );
  const marks = scenario.courseFeatures.filter(
    (feature) => feature.type === 'mark',
  );
  const zones = deriveMarkZones(scenario);
  const windDirection = formatCompassDirection(scenario.wind.fromDegrees);
  const scenarioJson = JSON.stringify(scenario, null, 2);
  const situationJson = JSON.stringify(situation, null, 2);
  const rulingsJson = JSON.stringify(rulings, null, 2);
  const trainingExampleJson = JSON.stringify(trainingExample, null, 2);
  const diagramTitle = `${keyframe.boatStates
    .map((state) => {
      const boat = scenario.boats.find(
        (candidate) => candidate.id === state.boatId,
      );
      return `${boat?.label} on ${state.tack} tack`;
    })
    .join(' and ')} approaching each other in wind from ${windDirection}`;
  const reviewHref = `/scenarios/${scenarioSlug}?position=${encodeURIComponent(keyframe.id)}`;
  const quizHref = `${reviewHref}&mode=quiz`;
  const quizQuestionQuery = {
    'applicable-rule': '&question=rule',
    'keep-clear': '',
    'mark-room': '&question=mark-room',
  }[quizQuestionType];

  return (
    <main className="min-h-screen bg-background text-foreground">
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
            {scenario.keyframes.length > 1 ? (
              <nav aria-label="Scenario position" className="mb-5">
                <p className="text-sm font-semibold uppercase text-muted-foreground">
                  Position
                </p>
                <div
                  className="mt-2 flex gap-2 overflow-x-auto pb-1"
                  data-testid="position-selector"
                >
                  {scenario.keyframes.map((candidate) => {
                    const selected = candidate.id === keyframe.id;

                    return (
                      <Link
                        key={candidate.id}
                        aria-current={selected ? 'step' : undefined}
                        className={`inline-flex min-h-11 min-w-24 shrink-0 items-center justify-center rounded-sm border px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 ${
                          selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-foreground hover:bg-muted'
                        }`}
                        href={`/scenarios/${scenarioSlug}?position=${encodeURIComponent(candidate.id)}${quizMode ? `&mode=quiz${quizQuestionQuery}` : ''}`}
                      >
                        {candidate.label}
                      </Link>
                    );
                  })}
                </div>
              </nav>
            ) : null}

            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold">{keyframe.label}</h2>
              <p className="text-sm text-muted-foreground">
                Wind from {windDirection}
              </p>
            </div>

            <div
              className="mt-3 aspect-square w-full overflow-hidden rounded-md border border-border bg-cyan-50 p-3 sm:p-5"
              data-keyframe-id={keyframe.id}
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

                {zones.map((zone) => {
                  const screenY = scenario.sailingArea.height - zone.center.y;
                  const labelY = Math.max(0.65, screenY - zone.radius + 0.65);

                  return (
                    <g
                      key={zone.markId}
                      data-center-x={zone.center.x}
                      data-center-y={zone.center.y}
                      data-mark-id={zone.markId}
                      data-radius-hull-lengths={zone.radius}
                      data-testid={`zone-${zone.markId}`}
                    >
                      <circle
                        cx={zone.center.x}
                        cy={screenY}
                        fill="#0891b2"
                        fillOpacity="0.06"
                        r={zone.radius}
                        stroke="#0e7490"
                        strokeDasharray="0.16 0.12"
                        strokeWidth="0.045"
                      />
                      <text
                        fill="#155e75"
                        fontSize="0.2"
                        fontWeight="600"
                        textAnchor="middle"
                        x={zone.center.x}
                        y={labelY}
                      >
                        {zone.label ?? `${zone.radius} hull length zone`}
                      </text>
                    </g>
                  );
                })}

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

                {marks.map((mark) => {
                  const screenY = scenario.sailingArea.height - mark.position.y;

                  return (
                    <g
                      key={mark.id}
                      data-position-x={mark.position.x}
                      data-position-y={mark.position.y}
                      data-required-side={mark.requiredSide}
                      data-testid={`mark-${mark.id}`}
                    >
                      <circle
                        cx={mark.position.x}
                        cy={screenY}
                        fill="#f97316"
                        r={mark.radius ?? 0.18}
                        stroke="#7c2d12"
                        strokeWidth="0.045"
                      />
                      <text
                        fill="#7c2d12"
                        fontSize={DIAGRAM_FONT_SIZE}
                        fontWeight="600"
                        x={mark.position.x + 0.34}
                        y={screenY - 0.24}
                      >
                        {mark.label ?? mark.id}
                        {mark.requiredSide
                          ? ` (leave to ${mark.requiredSide})`
                          : ''}
                      </text>
                    </g>
                  );
                })}

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

            <section
              data-moment-id={situationMoment.id}
              data-testid="situation-moment"
            >
              <p className="mt-5 text-sm font-semibold uppercase text-muted-foreground">
                Situation
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
              {markPositions.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {markPositions.map((relationship) => {
                    const mark = situation.marks.find(
                      (candidate) => candidate.id === relationship.markId,
                    );

                    return (
                      <p
                        className="border-l-4 border-cyan-700 pl-3 text-sm leading-6 text-muted-foreground"
                        data-testid={`mark-position-${relationship.markId}`}
                        key={`${relationship.markId}-${relationship.insideBoatId}-${relationship.outsideBoatId}`}
                      >
                        <span className="font-semibold text-foreground">
                          {boatLabels.get(relationship.insideBoatId)}
                        </span>{' '}
                        is inside{' '}
                        <span className="font-semibold text-foreground">
                          {boatLabels.get(relationship.outsideBoatId)}
                        </span>{' '}
                        at {mark?.label ?? relationship.markId}.
                      </p>
                    );
                  })}
                </div>
              ) : null}
            </section>
          </section>

          <aside className="min-w-0 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            {quizMode ? (
              quizQuestionType === 'mark-room' && markRoomQuizQuestion ? (
                <MarkRoomQuiz
                  question={markRoomQuizQuestion}
                  reviewHref={reviewHref}
                  teachingText={corpusMetadata.teachingText}
                />
              ) : quizQuestionType === 'applicable-rule' && ruleQuizQuestion ? (
                <ApplicableRuleQuiz
                  question={ruleQuizQuestion}
                  reviewHref={reviewHref}
                  teachingText={corpusMetadata.teachingText}
                />
              ) : quizQuestionType === 'keep-clear' && quizQuestion ? (
                <KeepClearQuiz
                  question={quizQuestion}
                  reviewHref={reviewHref}
                  teachingText={corpusMetadata.teachingText}
                />
              ) : (
                <section aria-labelledby="quiz-unavailable-heading">
                  <p className="text-sm font-semibold uppercase text-muted-foreground">
                    Quick check
                  </p>
                  <h2
                    className="mt-2 text-xl font-semibold"
                    id="quiz-unavailable-heading"
                  >
                    No question at this position
                  </h2>
                  <Link
                    className="mt-4 inline-block text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
                    href={reviewHref}
                  >
                    Review the full ruling
                  </Link>
                </section>
              )
            ) : null}
            <section
              data-ruling-moment-id={situationMoment.id}
              data-testid="ruling-statements"
              hidden={quizMode}
            >
              {quizQuestion ? (
                <Link
                  className="mb-5 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2"
                  data-testid="start-quiz"
                  href={quizHref}
                >
                  Test this position
                </Link>
              ) : null}
              <p className="text-sm font-semibold uppercase text-muted-foreground">
                Rulings
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Rulings at {situationMoment.label}
              </h2>

              <section className="mt-5" aria-labelledby="obligations-heading">
                <h3
                  id="obligations-heading"
                  className="text-base font-semibold"
                >
                  Obligations
                </h3>
                {selectedRulings.obligations.length > 0 ? (
                  <ul className="mt-3 space-y-4">
                    {selectedRulings.obligations.map((obligation, index) => (
                      <li
                        key={`${obligation.atMoment}-${obligation.boatId}-${obligation.owedToBoatId}-${obligation.type}-${index}`}
                        className="border-l-4 border-primary pl-3"
                        data-statement-type={obligation.type}
                        data-testid="ruling-obligation"
                      >
                        <p className="text-sm font-semibold leading-6">
                          {describeObligation(obligation, boatLabels)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {obligation.ruleRefs.join(', ')}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p
                    className="mt-3 text-sm leading-6 text-muted-foreground"
                    data-testid="no-obligations"
                  >
                    No obligations recorded at this position.
                  </p>
                )}
              </section>

              <section
                className="mt-6 border-t border-border pt-5"
                aria-labelledby="outcomes-heading"
              >
                <h3 id="outcomes-heading" className="text-base font-semibold">
                  Outcomes
                </h3>
                {selectedRulings.outcomes.length > 0 ? (
                  <ul className="mt-3 space-y-4">
                    {selectedRulings.outcomes.map((outcome, index) => (
                      <li
                        key={`${outcome.atMoment}-${outcome.boatId}-${outcome.type}-${index}`}
                        className="border-l-4 border-accent pl-3"
                        data-statement-type={outcome.type}
                        data-testid="ruling-outcome"
                      >
                        <p className="text-sm font-semibold leading-6">
                          {describeOutcome(outcome, boatLabels)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {outcome.ruleRefs.join(', ')}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p
                    className="mt-3 text-sm leading-6 text-muted-foreground"
                    data-testid="no-outcomes"
                  >
                    No outcomes recorded at this position.
                  </p>
                )}
              </section>

              {corpusMetadata.teachingText ? (
                <section
                  className="mt-6 border-t border-border pt-5"
                  aria-labelledby="teaching-note-heading"
                >
                  <h3
                    id="teaching-note-heading"
                    className="text-base font-semibold"
                  >
                    Teaching note
                  </h3>
                  <p className="mt-3 border-l-4 border-primary pl-3 text-sm leading-6">
                    {corpusMetadata.teachingText}
                  </p>
                </section>
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

        <section
          className="mt-10 border-t border-border pt-8"
          hidden={quizMode}
        >
          <details open>
            <summary className="cursor-pointer text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4">
              Scenario JSON
            </summary>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              This is the exact Scenario record driving the diagram. Derived RRS
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
              Situation JSON
            </summary>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              This describes the same moment in Racing Rules of Sailing domain
              language.
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
              Rulings JSON
            </summary>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              These rulings record the obligations and outcomes for the
              situation.
            </p>
            <pre
              className="mt-4 max-h-[42rem] overflow-auto rounded-md border border-border bg-slate-950 p-4 text-xs leading-5 text-slate-100"
              data-testid="rulings-json"
            >
              {rulingsJson}
            </pre>
          </details>
          <details className="mt-6">
            <summary className="cursor-pointer text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4">
              Complete training example JSON
            </summary>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              The training example directly composes its Scenario, Situation,
              and Rulings.
            </p>
            <pre
              className="mt-4 max-h-[42rem] overflow-auto rounded-md border border-border bg-slate-950 p-4 text-xs leading-5 text-slate-100"
              data-testid="training-example-json"
            >
              {trainingExampleJson}
            </pre>
          </details>
        </section>
      </div>
    </main>
  );
}
