'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { BoatGlyph, deriveSailPresentation } from './boat-glyph';
import {
  playbackBoatStates,
  playbackDuration,
} from '@/src/domain/scenario/playback';
import { deriveMarkZones } from '@/src/domain/scenario/mark-zone';
import type { Scenario } from '@/src/domain/scenario/schema';

const buttonClass =
  'min-h-11 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60';

export function ScenarioPlayback({ scenario }: { scenario: Scenario }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(0);
  const timeRef = useRef(0);
  const duration = playbackDuration(scenario);
  const states = playbackBoatStates(scenario, time);
  const height = scenario.sailingArea.height;

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  useEffect(() => {
    if (!running) return;
    const start = performance.now() - timeRef.current * 1000;
    let frame: number;
    const tick = (now: number) => {
      const next = Math.min(duration, (now - start) / 1000);
      timeRef.current = next;
      setTime(next);
      if (next >= duration) setRunning(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, duration]);

  function restart() {
    timeRef.current = 0;
    setTime(0);
    setRunning(true);
  }

  return (
    <>
      <button
        className={buttonClass}
        type="button"
        disabled={duration === 0}
        onClick={() => {
          setOpen(true);
          restart();
        }}
      >
        Play scenario
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-auto rounded-lg border border-border bg-card p-4 text-foreground shadow-xl backdrop:bg-black/50 sm:p-6"
        onClose={() => {
          setRunning(false);
          setOpen(false);
        }}
      >
        {open && (
          <>
            <div className="flex items-center justify-between gap-4">
              <h2 id={titleId} className="text-xl font-semibold">
                Scenario playback
              </h2>
              <button
                className={buttonClass}
                type="button"
                onClick={() => dialog.current?.close()}
              >
                Close playback
              </button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Illustrative motion: one second between recorded positions. This
              is not a physical simulation or additional rules evidence.
            </p>
            <div className="my-4 flex flex-wrap items-center gap-4">
              <button
                className={buttonClass}
                type="button"
                onClick={() => {
                  if (running) setRunning(false);
                  else if (time >= duration) restart();
                  else setRunning(true);
                }}
              >
                {running ? 'Pause' : time >= duration ? 'Replay' : 'Resume'}
              </button>
              <output aria-live="off" data-testid="playback-time">
                {time.toFixed(2)} / {duration.toFixed(2)} s
              </output>
              <output>
                {running ? 'Playing' : time >= duration ? 'Finished' : 'Paused'}
              </output>
            </div>
            <svg
              viewBox={`0 0 ${scenario.sailingArea.width} ${height}`}
              className="max-h-[55dvh] w-full rounded-md border border-border bg-cyan-50"
              aria-label="Illustrative scenario playback"
              data-testid="playback-diagram"
              data-wind-from-degrees={scenario.wind.fromDegrees}
            >
              <title>{scenario.title} — illustrative playback</title>
              {deriveMarkZones(scenario).map((zone) => (
                <circle
                  key={zone.markId}
                  cx={zone.center.x}
                  cy={height - zone.center.y}
                  r={zone.radius}
                  fill="none"
                  stroke="#0e7490"
                  strokeWidth="0.025"
                  strokeDasharray="0.15 0.1"
                />
              ))}
              {scenario.courseFeatures.map((feature) => {
                if (feature.type === 'mark')
                  return (
                    <g key={feature.id}>
                      <circle
                        cx={feature.position.x}
                        cy={height - feature.position.y}
                        r={feature.radius ?? 0.18}
                        fill="#f97316"
                        stroke="#7c2d12"
                        strokeWidth="0.04"
                      />
                      <text
                        x={feature.position.x + 0.3}
                        y={height - feature.position.y - 0.2}
                        fontSize="0.22"
                        fill="#7c2d12"
                      >
                        {feature.label ?? feature.id}
                        {feature.requiredSide
                          ? ` (leave to ${feature.requiredSide})`
                          : ''}
                      </text>
                    </g>
                  );
                if (feature.type === 'boundary')
                  return (
                    <polygon
                      key={feature.id}
                      points={feature.points
                        .map((p) => `${p.x},${height - p.y}`)
                        .join(' ')}
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="0.03"
                    />
                  );
                return (
                  <line
                    key={feature.id}
                    x1={feature.start.x}
                    y1={height - feature.start.y}
                    x2={feature.end.x}
                    y2={height - feature.end.y}
                    stroke="#64748b"
                    strokeWidth="0.03"
                    strokeDasharray={
                      feature.type === 'layline' ? '0.15 0.1' : undefined
                    }
                  />
                );
              })}
              <g
                transform={`translate(0.6 0.65) rotate(${scenario.wind.fromDegrees})`}
              >
                <path
                  d="M 0 -0.3 V 0.35 M -0.13 0.17 L 0 0.35 L 0.13 0.17"
                  stroke="#155e75"
                  strokeWidth="0.04"
                  fill="none"
                />
              </g>
              <text x="0.95" y="0.7" fontSize="0.23" fill="#155e75">
                WIND
              </text>
              {states.map((state) => {
                const boat = scenario.boats.find(
                  (item) => item.id === state.boatId,
                )!;
                const labelOnLeft =
                  state.position.x < scenario.sailingArea.width / 2;
                return (
                  <g
                    key={boat.id}
                    data-testid={`playback-boat-${boat.id}`}
                    data-x={state.position.x}
                    data-y={state.position.y}
                    data-heading={state.headingDegrees}
                    data-tack={state.tack}
                  >
                    <g
                      transform={`translate(${state.position.x} ${height - state.position.y}) rotate(${state.headingDegrees})`}
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
                      x={state.position.x + (labelOnLeft ? -0.66 : 0.66)}
                      textAnchor={labelOnLeft ? 'end' : 'start'}
                      y={height - state.position.y - 0.25}
                      fill="#0f172a"
                      fontSize="0.24"
                    >
                      {boat.label}
                    </text>
                  </g>
                );
              })}
            </svg>
            <p className="mt-3 text-sm text-muted-foreground">
              Close playback to return to the unchanged recorded positions. Tack
              follows the interpolated heading where unambiguous; otherwise the
              preceding recorded tack is retained until the next position.
            </p>
          </>
        )}
      </dialog>
    </>
  );
}
