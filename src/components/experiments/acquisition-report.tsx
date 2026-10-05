'use client';
import { useState } from 'react';
import {
  ACQUISITION_PREMISES,
  analyzeAcquisition,
  case93AcquisitionFacts,
} from '@/src/domain/reasoning-experiment/acquisition';
import {
  CASE_BOOK_URL,
  RULES_URL,
} from '@/src/domain/reasoning-experiment/facts';

export function AcquisitionReport() {
  const [variant, setVariant] = useState('source');
  const packet = case93AcquisitionFacts();
  if (variant === 'history') delete packet.evidence.beforeAstern;
  if (variant === 'response') delete packet.evidence.noResponse;
  if (variant === 'other')
    packet.evidence.causedByOther = {
      value: true,
      basis: 'diagnostic',
      explanation:
        'Changed premise for dependency testing; not the official case.',
    };
  const report = analyzeAcquisition(packet);
  const label = (id: string): string => {
    if (id.startsWith('not:')) return `False: ${label(id.slice(4))}`;
    return (
      ACQUISITION_PREMISES[id as keyof typeof ACQUISITION_PREMISES] ??
      report.findings.find((item) => item.id === id)?.label ??
      id
    );
  };
  return (
    <section
      id="acquisition"
      aria-label="Acquired right of way challenge"
      className="mt-10 scroll-mt-4 border-t border-border pt-6"
    >
      <h2 className="text-2xl font-semibold">
        Rule 15: what changes when right of way changes?
      </h2>
      <p className="mt-3">
        Case 93, from L being clear astern to her leeward overlap and immediate
        luff. This is a bounded source-fact analysis under general RRS
        2025–2028, not a geometric reconstruction or verified corpus entry.
      </p>
      <p className="mt-3 font-semibold">
        Event order establishes the transition. It does not measure response
        time.
      </p>
      <label className="mt-4 block font-semibold">
        Acquisition evidence check
        <select
          className="mt-2 min-h-11 w-full rounded-md border border-border bg-card px-3 py-2"
          value={variant}
          onChange={(event) => setVariant(event.target.value)}
        >
          <option value="source">Source overlap and luff episode</option>
          <option value="history">Withhold the prior relationship</option>
          <option value="other">Acquisition caused by the other boat</option>
          <option value="response">Withhold the response assessment</option>
        </select>
      </label>
      <p className="mt-2 text-sm text-muted-foreground">
        Variants test dependencies, not alternative official rulings. The
        remaining supplied assessments are not re-derived for a changed
        incident.
      </p>
      <ol className="mt-4 space-y-3">
        {report.findings.map((finding) => (
          <li
            key={finding.id}
            data-testid={`acquisition-${finding.id}`}
            className="rounded-lg border border-border bg-card p-4"
          >
            <p
              className="text-sm font-semibold"
              data-testid="acquisition-status"
            >
              {finding.status === 'supported'
                ? 'Supported by supplied premises'
                : finding.status === 'unresolved'
                  ? 'Unresolved'
                  : 'Not supported by these premises'}
            </p>
            <h3 className="mt-1 font-semibold">{finding.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Rule {finding.rule}
            </p>
            <details className="mt-2">
              <summary className="min-h-8 cursor-pointer">
                Required evidence
              </summary>
              {finding.id === 'room-entitlement' && (
                <p className="mt-2 text-sm">
                  Either Rule 15 applies within its initial period, or the
                  separate Rule 16.1 duty applies during this course change.
                </p>
              )}
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {finding.dependsOn.map((id) => (
                  <li key={id}>{label(id)}</li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ol>
      <details className="mt-4 rounded-lg border border-border p-4">
        <summary className="min-h-11 cursor-pointer font-semibold">
          Supplied evidence and its basis
        </summary>
        {(
          Object.entries(ACQUISITION_PREMISES) as [
            keyof typeof ACQUISITION_PREMISES,
            string,
          ][]
        ).map(([key, title]) => {
          const item = packet.evidence[key];
          return (
            <div className="mt-3" key={key}>
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-sm">
                {item
                  ? `${item.value ? 'True' : 'False'} · ${item.basis}. ${item.explanation}`
                  : 'Not supplied in this diagnostic.'}
              </p>
            </div>
          );
        })}
      </details>
      <p className="mt-4 text-sm">
        The source supplies the seamanlike-response, initial-period and
        entitlement assessments. No duration or clearance threshold is invented.
        L’s mark-room claim and Rules 14, 17 and 18 are outside this analysis;
        the full case discusses them. “Not supported” does not establish no
        breach or no entitlement.
      </p>
      <div className="mt-3 flex flex-wrap gap-4 text-primary underline underline-offset-4">
        <a href={`${CASE_BOOK_URL}#page=215`}>Official Case 93</a>
        <a href={`${RULES_URL}#page=22`}>Rules 15 and 16.1</a>
        <a href={`${RULES_URL}#page=35`}>Rule 43</a>
      </div>
      <details className="mt-3">
        <summary className="min-h-11 cursor-pointer">
          Inspect acquisition facts and conclusions
        </summary>
        <pre className="mt-2 max-h-80 overflow-auto text-xs">
          {JSON.stringify({ packet, report }, null, 2)}
        </pre>
      </details>
    </section>
  );
}
