'use client';

import { useState } from 'react';
import {
  CASE_BOOK_URL,
  RULES_URL,
} from '@/src/domain/reasoning-experiment/facts';
import {
  case114MarkFacts,
  deriveMarkRoomDuties,
  MARK_GATES,
} from '@/src/domain/reasoning-experiment/mark-room';

export function MarkRoomReport() {
  const [variant, setVariant] = useState('source');
  const packet = case114MarkFacts();
  if (variant === 'missing')
    packet.pairs.forEach((pair) => {
      delete pair.entry;
    });
  if (variant === 'reversed')
    packet.pairs.forEach((pair) => {
      pair.entry = {
        outside: pair.entry!.inside,
        inside: pair.entry!.outside,
        overlapped: true,
      };
    });
  if (variant === 'exception')
    packet.pairs.forEach((pair) => {
      pair.applicability.noLateOverlapException = false;
    });
  const report = deriveMarkRoomDuties(packet);
  return (
    <section
      id="mark-room"
      aria-label="Mark-room history challenge"
      className="mt-10 scroll-mt-4 border-t border-border pt-6"
    >
      <h2 className="text-2xl font-semibold">
        Held-out test: mark-room history
      </h2>
      <p className="mt-3">
        Case 114, question 1. This separate source-fact example tests duties,
        not breaches or penalties. General RRS 2025–2028; unverified research
        transcription.
      </p>
      <p className="mt-3">
        Review context held fixed: current outside-to-inside order A / B / C.
        The consumer uses each pair’s zone-entry history, not this current
        order. Changed history is a diagnostic, not another official case.
      </p>
      <label className="mt-4 block font-semibold">
        Mark-room evidence check
        <select
          value={variant}
          onChange={(event) => setVariant(event.target.value)}
          className="mt-2 min-h-11 w-full rounded-md border border-border bg-card px-3 py-2"
        >
          <option value="source">Source zone-entry history</option>
          <option value="missing">Withhold zone-entry history</option>
          <option value="reversed">
            Reverse entry order; keep current order
          </option>
          <option value="exception">Rule 18.2(d) exception applies</option>
        </select>
      </label>
      <div
        className="mt-4 rounded-lg border border-border bg-card p-4"
        data-testid="mark-room-findings"
      >
        <h3 className="text-lg font-semibold">Supported duty reasoning</h3>
        {report.findings.map((finding) => {
          const pair = packet.pairs.find(
            (item) => item.boats === finding.boats,
          )!;
          const duty = report.duties.find((item) => item.id === finding.dutyId);
          return (
            <div
              key={finding.boats.join('/')}
              className="mt-3 border-t border-border pt-3"
            >
              <p className="font-semibold">
                {duty
                  ? `${duty.from} must give ${duty.to} mark-room (18.2(a)(1)).`
                  : `${finding.boats.join(' / ')}: unresolved in this branch.`}
              </p>
              <p className="mt-1 text-sm">
                {pair.entry
                  ? `At first entry for this pair: ${pair.entry.outside} outside, ${pair.entry.inside} inside; overlapped.`
                  : 'Entry relationship not supplied.'}
              </p>
              {finding.reasons.map((reason) => (
                <p className="mt-1 text-sm" key={reason}>
                  {reason}
                </p>
              ))}
            </div>
          );
        })}
        <ul className="mt-4 space-y-2" data-testid="mark-room-dependencies">
          {report.dependencies
            .filter((item) => item.includes.length > 0)
            .map((item) => {
              const parent = report.duties.find(
                (duty) => duty.id === item.dutyId,
              )!;
              return (
                <li key={item.dutyId}>
                  {parent.from}’s mark-room for {parent.to} includes space for{' '}
                  {parent.to} to meet:{' '}
                  {item.includes
                    .map((id) => {
                      const child = report.duties.find(
                        (duty) => duty.id === id,
                      )!;
                      return `give ${child.to} mark-room`;
                    })
                    .join('; ')}
                  .
                </li>
              );
            })}
        </ul>
        <p className="mt-3 text-sm">
          Only established duties appear in these dependencies. Missing evidence
          does not mean no entitlement; an excluded branch does not decide other
          Rule 18 duties. No amount of room or compliance is assessed.
        </p>
      </div>
      <details className="mt-4 rounded-lg border border-border p-4">
        <summary className="min-h-8 cursor-pointer font-semibold">
          Evidence and applicability limits
        </summary>
        <p className="mt-3">{packet.provenance.history}</p>
        <p className="mt-3">{packet.provenance.applicability}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          {Object.entries(MARK_GATES).map(([id, label]) => (
            <li key={id}>{label}.</li>
          ))}
        </ul>
        <p className="mt-3">
          No zone radius is calculated, and no radio-sailing context is
          substituted. Rules 18.2(a)(2), 18.2(c), 18.3 and 18.4 are not
          evaluated. A changed or unknown prerequisite withholds this branch
          rather than guessing another result.
        </p>
        <p className="mt-3">
          The source already establishes applicability. This tests whether
          detached history supports the duty reasoning, not whether geometry can
          establish every gate.
        </p>
      </details>
      <div className="mt-3 flex flex-wrap gap-4 text-primary underline underline-offset-4">
        <a href={`${CASE_BOOK_URL}#page=253`}>Official Case 114</a>
        <a href={`${RULES_URL}#page=23`}>Full Rule 18</a>
      </div>
      <details className="mt-4">
        <summary className="min-h-8 cursor-pointer">
          Inspect history and duty dependencies
        </summary>
        <pre className="mt-2 max-h-80 overflow-auto text-xs">
          {JSON.stringify({ packet, report }, null, 2)}
        </pre>
      </details>
    </section>
  );
}
