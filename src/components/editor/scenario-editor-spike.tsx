'use client';

import { useMemo, useRef, useState } from 'react';

import {
  BoatGlyph,
  deriveSailPresentation,
} from '@/src/components/scenario/boat-glyph';
import { GhostedKeyframeBoats } from '@/src/components/scenario/ghosted-keyframe-boats';
import {
  inferTackFromHeading,
  normalizeDegrees,
} from '@/src/domain/scenario/geometry';
import { deriveMarkZones } from '@/src/domain/scenario/mark-zone';
import { scenarioSchema, type BoatState } from '@/src/domain/scenario/schema';
import type { Scenario } from '@/src/domain/scenario/schema';

const DIAGRAM_FONT_SIZE = 0.24;
const BOAT_LABEL_X_OFFSET = 0.66;
const BOAT_LABEL_Y_OFFSET = 0.3;

const initialScenario: Scenario = {
  schemaVersion: '0.5.0',
  id: 'editor-spike-draft',
  title: 'Editor spike draft',
  context: {
    discipline: 'radio_sailing',
    ruleSetVersion: '2025-2028',
  },
  sailingArea: {
    width: 8,
    height: 8,
  },
  wind: {
    fromDegrees: 0,
  },
  boats: [
    {
      id: 'blue',
      label: 'Blue',
      sailNumber: '01',
      color: '#2563EB',
    },
    {
      id: 'yellow',
      label: 'Yellow',
      sailNumber: '02',
      color: '#EAB308',
    },
  ],
  keyframes: [
    {
      id: 'position-1',
      label: 'Position 1',
      boatStates: [
        {
          boatId: 'blue',
          position: { x: 3.2, y: 5.8 },
          headingDegrees: 180,
          tack: 'starboard',
        },
        {
          boatId: 'yellow',
          position: { x: 4.4, y: 6.5 },
          headingDegrees: 180,
          tack: 'starboard',
        },
      ],
    },
    {
      id: 'position-2',
      label: 'Position 2',
      boatStates: [
        {
          boatId: 'blue',
          position: { x: 3.5, y: 4.4 },
          headingDegrees: 180,
          tack: 'starboard',
        },
        {
          boatId: 'yellow',
          position: { x: 4.3, y: 4.9 },
          headingDegrees: 180,
          tack: 'starboard',
        },
      ],
    },
  ],
  courseFeatures: [
    {
      type: 'mark',
      id: 'leeward-mark',
      label: 'Leeward mark',
      position: { x: 4, y: 2 },
      radius: 0.2,
      requiredSide: 'port',
    },
  ],
  observedEvents: [],
};

function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function withUpdatedBoatState(
  scenario: Scenario,
  keyframeId: string,
  boatId: string,
  update: (state: BoatState) => BoatState,
): Scenario {
  return {
    ...scenario,
    keyframes: scenario.keyframes.map((keyframe) =>
      keyframe.id === keyframeId
        ? {
            ...keyframe,
            boatStates: keyframe.boatStates.map((state) =>
              state.boatId === boatId ? update(state) : state,
            ),
          }
        : keyframe,
    ),
  };
}

export function ScenarioEditorSpike() {
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const [activeKeyframeId, setActiveKeyframeId] = useState(
    initialScenario.keyframes[0].id,
  );
  const [selectedBoatId, setSelectedBoatId] = useState(
    initialScenario.boats[0].id,
  );
  const [draggingBoatId, setDraggingBoatId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  );
  const svgRef = useRef<SVGSVGElement | null>(null);

  const activeKeyframe =
    scenario.keyframes.find((keyframe) => keyframe.id === activeKeyframeId) ??
    scenario.keyframes[0];
  const selectedBoat = scenario.boats.find(
    (boat) => boat.id === selectedBoatId,
  );
  const selectedBoatState = activeKeyframe.boatStates.find(
    (state) => state.boatId === selectedBoatId,
  );
  const zones = deriveMarkZones(scenario);
  const marks = scenario.courseFeatures.filter(
    (feature) => feature.type === 'mark',
  );
  const validation = scenarioSchema.safeParse(scenario);
  const scenarioJson = useMemo(
    () => JSON.stringify(scenario, null, 2),
    [scenario],
  );
  const scenarioDownloadHref = useMemo(
    () =>
      `data:application/json;charset=utf-8,${encodeURIComponent(`${scenarioJson}\n`)}`,
    [scenarioJson],
  );
  const scenarioDownloadFileName = `${scenario.id}.json`;

  function updateBoatState(
    boatId: string,
    update: (state: BoatState) => BoatState,
  ) {
    setScenario((currentScenario) =>
      withUpdatedBoatState(currentScenario, activeKeyframe.id, boatId, update),
    );
  }

  function updateSelectedBoat(update: (state: BoatState) => BoatState) {
    updateBoatState(selectedBoatId, update);
  }

  function setBoatPositionFromPointer(
    event: React.PointerEvent<SVGElement>,
    boatId = selectedBoatId,
  ) {
    if (!svgRef.current) return;

    const point = svgRef.current.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svgRef.current.getScreenCTM()?.inverse();
    if (!matrix) return;

    const cursor = point.matrixTransform(matrix);
    const x = roundCoordinate(clamp(cursor.x, 0, scenario.sailingArea.width));
    const y = roundCoordinate(
      clamp(
        scenario.sailingArea.height - cursor.y,
        0,
        scenario.sailingArea.height,
      ),
    );

    updateBoatState(boatId, (state) => ({
      ...state,
      position: { x, y },
    }));
  }

  function updateHeading(headingDegrees: number) {
    updateSelectedBoat((state) => {
      const normalizedHeading = normalizeDegrees(headingDegrees);
      const inferredTack = inferTackFromHeading(
        normalizedHeading,
        scenario.wind.fromDegrees,
      );

      return {
        ...state,
        headingDegrees: normalizedHeading,
        tack: inferredTack ?? state.tack,
      };
    });
  }

  function addKeyframe() {
    const nextIndex = scenario.keyframes.length + 1;
    const copiedStates = activeKeyframe.boatStates.map((state) => ({
      ...state,
      position: {
        x: roundCoordinate(
          clamp(state.position.x + 0.25, 0, scenario.sailingArea.width),
        ),
        y: roundCoordinate(
          clamp(state.position.y - 0.45, 0, scenario.sailingArea.height),
        ),
      },
    }));
    const keyframeId = `position-${nextIndex}`;

    setScenario((currentScenario) => ({
      ...currentScenario,
      keyframes: [
        ...currentScenario.keyframes,
        {
          id: keyframeId,
          label: `Position ${nextIndex}`,
          boatStates: copiedStates,
        },
      ],
    }));
    setActiveKeyframeId(keyframeId);
  }

  async function copyScenarioJson() {
    try {
      await navigator.clipboard.writeText(scenarioJson);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)]">
      <section className="min-w-0">
        <nav aria-label="Scenario position" className="mb-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold uppercase text-muted-foreground">
              Position
            </p>
            <button
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2"
              data-testid="add-keyframe"
              type="button"
              onClick={addKeyframe}
            >
              Add position
            </button>
          </div>
          <div
            className="mt-2 flex gap-2 overflow-x-auto pb-1"
            data-testid="editor-position-selector"
          >
            {scenario.keyframes.map((keyframe) => {
              const selected = keyframe.id === activeKeyframe.id;

              return (
                <button
                  key={keyframe.id}
                  aria-current={selected ? 'step' : undefined}
                  className={`inline-flex min-h-11 min-w-24 shrink-0 items-center justify-center rounded-sm border px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-muted'
                  }`}
                  data-testid={`keyframe-tab-${keyframe.id}`}
                  type="button"
                  onClick={() => setActiveKeyframeId(keyframe.id)}
                >
                  {keyframe.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold">{activeKeyframe.label}</h2>
          <p className="text-sm text-muted-foreground">
            {selectedBoat?.label ?? selectedBoatId} selected
          </p>
        </div>

        <div
          className="mt-3 aspect-square w-full overflow-hidden rounded-md border border-border bg-cyan-50 p-3 sm:p-5"
          data-active-keyframe-id={activeKeyframe.id}
          data-selected-boat-id={selectedBoatId}
          data-testid="editor-diagram"
        >
          <svg
            ref={svgRef}
            aria-labelledby="editor-diagram-title"
            className="size-full touch-none"
            viewBox={`0 0 ${scenario.sailingArea.width} ${scenario.sailingArea.height}`}
            onPointerDown={setBoatPositionFromPointer}
            onPointerMove={(event) => {
              if (draggingBoatId) {
                setBoatPositionFromPointer(event, draggingBoatId);
              }
            }}
            onPointerUp={() => setDraggingBoatId(null)}
            onPointerCancel={() => setDraggingBoatId(null)}
          >
            <title id="editor-diagram-title">Editable scenario diagram</title>
            <defs>
              <marker
                id="editor-wind-arrow"
                markerHeight="5"
                markerWidth="5"
                orient="auto"
                refX="4"
                refY="2.5"
              >
                <path d="M0,0 L5,2.5 L0,5 Z" fill="#155e75" />
              </marker>
            </defs>

            <GhostedKeyframeBoats
              activeKeyframeId={activeKeyframe.id}
              scenario={scenario}
            />

            {zones.map((zone) => {
              const screenY = scenario.sailingArea.height - zone.center.y;
              const labelY = Math.max(0.65, screenY - zone.radius + 0.65);
              const labelX = Math.min(
                scenario.sailingArea.width - 1.1,
                Math.max(1.1, zone.center.x + zone.radius * 0.35),
              );

              return (
                <g
                  key={zone.markId}
                  data-center-x={zone.center.x}
                  data-center-y={zone.center.y}
                  data-radius-hull-lengths={zone.radius}
                  data-testid={`editor-zone-${zone.markId}`}
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
                    paintOrder="stroke"
                    stroke="#ecfeff"
                    strokeWidth="0.08"
                    textAnchor="middle"
                    x={labelX}
                    y={labelY}
                  >
                    {zone.label}
                  </text>
                </g>
              );
            })}

            <g
              data-testid="editor-wind-indicator"
              data-wind-from-degrees={scenario.wind.fromDegrees}
              transform={`translate(0.6 0.72) rotate(${scenario.wind.fromDegrees})`}
            >
              <line
                markerEnd="url(#editor-wind-arrow)"
                stroke="#155e75"
                strokeWidth="0.06"
                x1="0"
                x2="0"
                y1="-0.3"
                y2="0.36"
              />
            </g>
            <text fill="#155e75" fontSize={DIAGRAM_FONT_SIZE} x="0.9" y="0.72">
              WIND
            </text>

            {marks.map((mark) => {
              const screenY = scenario.sailingArea.height - mark.position.y;

              return (
                <g
                  key={mark.id}
                  data-position-x={mark.position.x}
                  data-position-y={mark.position.y}
                  data-testid={`editor-mark-${mark.id}`}
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

            {activeKeyframe.boatStates.map((state) => {
              const boat = scenario.boats.find(
                (candidate) => candidate.id === state.boatId,
              );
              if (!boat) return null;

              const selected = state.boatId === selectedBoatId;
              const screenY = scenario.sailingArea.height - state.position.y;
              const labelOnLeft =
                state.position.x < scenario.sailingArea.width / 2;

              return (
                <g
                  key={boat.id}
                  data-boat-id={boat.id}
                  data-heading-degrees={state.headingDegrees}
                  data-testid={`editor-boat-${boat.id}`}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    setSelectedBoatId(boat.id);
                    setDraggingBoatId(boat.id);
                    setBoatPositionFromPointer(event, boat.id);
                  }}
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
                    {selected ? (
                      <circle
                        data-testid={`selection-ring-${boat.id}`}
                        fill="none"
                        r="0.64"
                        stroke="#0f172a"
                        strokeDasharray="0.08 0.08"
                        strokeWidth="0.045"
                      />
                    ) : null}
                  </g>
                  <text
                    fill="#0f172a"
                    fontSize={DIAGRAM_FONT_SIZE}
                    fontWeight="600"
                    textAnchor={labelOnLeft ? 'end' : 'start'}
                    x={
                      state.position.x +
                      (labelOnLeft ? -BOAT_LABEL_X_OFFSET : BOAT_LABEL_X_OFFSET)
                    }
                    y={screenY - BOAT_LABEL_Y_OFFSET}
                  >
                    {boat.label}
                  </text>
                </g>
              );
            })}

            <g
              data-testid="editor-hull-length-scale"
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
                data-testid="editor-hull-length-scale-line"
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
      </section>

      <aside className="min-w-0 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
        <section aria-labelledby="boat-controls-heading">
          <p className="text-sm font-semibold uppercase text-muted-foreground">
            Selected boat
          </p>
          <h2 id="boat-controls-heading" className="mt-2 text-xl font-semibold">
            {selectedBoat?.label ?? selectedBoatId}
          </h2>

          <div
            className="mt-4 grid grid-cols-2 gap-2"
            data-testid="boat-picker"
          >
            {scenario.boats.map((boat) => {
              const selected = boat.id === selectedBoatId;

              return (
                <button
                  key={boat.id}
                  aria-pressed={selected}
                  className={`inline-flex min-h-11 items-center justify-center rounded-md border px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-muted'
                  }`}
                  type="button"
                  onClick={() => setSelectedBoatId(boat.id)}
                >
                  {boat.label}
                </button>
              );
            })}
          </div>

          {selectedBoatState ? (
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">
                X
                <input
                  className="min-h-11 rounded-md border border-input bg-background px-3 text-base font-normal text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-sm"
                  data-testid="boat-x-input"
                  inputMode="decimal"
                  max={scenario.sailingArea.width}
                  min="0"
                  step="0.1"
                  type="number"
                  value={selectedBoatState.position.x}
                  onChange={(event) => {
                    const nextX = Number(event.currentTarget.value);
                    if (Number.isFinite(nextX)) {
                      updateSelectedBoat((state) => ({
                        ...state,
                        position: {
                          ...state.position,
                          x: roundCoordinate(
                            clamp(nextX, 0, scenario.sailingArea.width),
                          ),
                        },
                      }));
                    }
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Y
                <input
                  className="min-h-11 rounded-md border border-input bg-background px-3 text-base font-normal text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-sm"
                  data-testid="boat-y-input"
                  inputMode="decimal"
                  max={scenario.sailingArea.height}
                  min="0"
                  step="0.1"
                  type="number"
                  value={selectedBoatState.position.y}
                  onChange={(event) => {
                    const nextY = Number(event.currentTarget.value);
                    if (Number.isFinite(nextY)) {
                      updateSelectedBoat((state) => ({
                        ...state,
                        position: {
                          ...state.position,
                          y: roundCoordinate(
                            clamp(nextY, 0, scenario.sailingArea.height),
                          ),
                        },
                      }));
                    }
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Heading
                <input
                  className="w-full accent-primary"
                  data-testid="heading-input"
                  max="359"
                  min="0"
                  step="1"
                  type="range"
                  value={selectedBoatState.headingDegrees}
                  onChange={(event) =>
                    updateHeading(Number(event.currentTarget.value))
                  }
                />
              </label>
              <p
                className="text-sm text-muted-foreground"
                data-testid="heading-value"
              >
                {selectedBoatState.headingDegrees} degrees,{' '}
                {selectedBoatState.tack} tack
              </p>
            </div>
          ) : null}
        </section>

        <section className="mt-7 border-t border-border pt-6">
          <h2 className="text-base font-semibold">Validation</h2>
          <p
            className={`mt-3 border-l-4 pl-3 text-sm leading-6 ${
              validation.success
                ? 'border-primary text-muted-foreground'
                : 'border-destructive text-foreground'
            }`}
            data-valid={String(validation.success)}
            data-testid="scenario-validation"
          >
            {validation.success
              ? 'Scenario JSON is valid.'
              : validation.error.issues[0]?.message}
          </p>
        </section>

        <section className="mt-7 border-t border-border pt-6">
          <details open>
            <summary className="cursor-pointer text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-4">
              Scenario JSON
            </summary>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2"
                data-testid="copy-scenario-json"
                type="button"
                onClick={copyScenarioJson}
              >
                Copy JSON
              </button>
              <a
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
                data-testid="download-scenario-json"
                download={scenarioDownloadFileName}
                href={scenarioDownloadHref}
              >
                Download JSON
              </a>
            </div>
            <p
              aria-live="polite"
              className="mt-3 min-h-5 text-sm text-muted-foreground"
              data-testid="copy-json-status"
            >
              {copyStatus === 'copied'
                ? 'Scenario JSON copied.'
                : copyStatus === 'failed'
                  ? 'Could not copy Scenario JSON.'
                  : ''}
            </p>
            <pre
              className="mt-3 max-h-[32rem] overflow-auto rounded-md border border-border bg-slate-950 p-4 text-xs leading-5 text-slate-100"
              data-testid="editor-scenario-json"
            >
              {scenarioJson}
            </pre>
          </details>
        </section>
      </aside>
    </div>
  );
}
