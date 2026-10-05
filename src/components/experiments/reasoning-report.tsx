'use client';

import Link from 'next/link';
import { useState } from 'react';
import { analyzeFacts } from '@/src/domain/reasoning-experiment/analyze';
import { case147Facts } from '@/src/domain/reasoning-experiment/case147';
import {
  CASE_BOOK_URL,
  FACTS,
  RULES_URL,
  type FactKey,
} from '@/src/domain/reasoning-experiment/facts';

const variants = {
  source: 'Official case premises',
  missing: 'Withhold the entitlement assessment',
  conflict: 'Conflicting entitlement assessments',
} as const;

export function ReasoningReport() {
  const [variant, setVariant] = useState<keyof typeof variants>('source');
  const packet = case147Facts();
  if (variant === 'missing')
    packet.facts = packet.facts.filter(
      (fact) => fact.key !== 'within-entitlement',
    );
  if (variant === 'conflict')
    packet.facts.push({
      ...packet.facts.find((fact) => fact.key === 'within-entitlement')!,
      value: false,
      evidence:
        'Deliberate conflicting input for this diagnostic; not an official case fact.',
    });
  const report = analyzeFacts(JSON.parse(JSON.stringify(packet)));
  const labelFor = (id: string) =>
    FACTS[id as FactKey]?.label ??
    report.findings.find((finding) => finding.id === id)?.label ??
    id;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <Link href="/" className="text-primary underline underline-offset-4">
        Back to MarkRoom
      </Link>
      <header className="my-6 border-b border-border pb-6">
        <p className="text-sm font-semibold uppercase text-muted-foreground">
          Research experiment · source-backed premises · unverified
          transcription
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          From sailing facts to a ruling
        </h1>
        <p className="mt-3">
          Case 147, S and PB through the course change. This tests a detached
          facts-to-rulings boundary, not geometric derivation or every rule in
          the incident.
        </p>
        <p className="mt-3 font-semibold">
          Situation means relevant facts. This report also shows the reasoning
          and its limits.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-primary underline underline-offset-4">
          <a href={`${CASE_BOOK_URL}#page=317`}>Official Case 147</a>
          <a href={`${RULES_URL}#page=21`}>Rules 10 and 16.1</a>
          <a href={`${RULES_URL}#page=35`}>Exoneration: Rule 43</a>
          <Link href="/experiments/luffing">Physical-clearance experiment</Link>
          <Link href="/experiments/scenario-facts">
            Which facts can geometry supply?
          </Link>
        </div>
      </header>

      <label className="block font-semibold">
        Evidence check
        <select
          className="mt-2 min-h-11 w-full rounded-md border border-border bg-card px-3 py-2"
          value={variant}
          onChange={(event) =>
            setVariant(event.target.value as keyof typeof variants)
          }
        >
          {Object.entries(variants).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-2 text-sm text-muted-foreground">
        Diagnostic variants test missing or conflicting evidence. They are not
        alternative official rulings or saved edits to the case.
      </p>

      <section
        className="my-5 rounded-lg border border-border bg-card p-4"
        aria-label="Boundary limitation"
      >
        <h2 className="text-xl font-semibold">
          What this has—and has not—established
        </h2>
        <p className="mt-2">
          The engine applies explicit rules to supplied premises. Room and
          entitlement assessments come from the official decision. Their labels
          below do not mean we derived them from boats on a diagram.
        </p>
        <p className="mt-2">
          General RRS 2025–2028; actual S/PB encounter from the luff through the
          avoiding response. No incident seconds are inferred. PA’s earlier
          encounter is outside this analysis.
        </p>
      </section>

      <section aria-label="Rule conclusions" aria-live="polite">
        <h2 className="text-2xl font-semibold">Rule conclusions</h2>
        {report.diagnostics.length > 0 && (
          <output className="my-3 block rounded-md border border-border p-3">
            <span className="font-semibold">Input diagnostic</span>
            {report.diagnostics.map((message) => (
              <span className="mt-2 block" key={message}>
                {message}
              </span>
            ))}
          </output>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          “Not supported” does not establish the opposite conclusion.
          Exoneration here applies only to the identified Rule 10 breach.
        </p>
        <ol className="mt-4 space-y-3">
          {report.findings.map((finding) => (
            <li
              key={finding.id}
              id={`finding-${finding.id}`}
              className="scroll-mt-4 rounded-lg border border-border p-4"
              data-testid={`finding-${finding.id}`}
            >
              <p className="text-sm font-semibold" data-testid="finding-status">
                {finding.status === 'supported'
                  ? finding.assumptions.length
                    ? 'Conditional on assumptions'
                    : 'Supported by supplied premises'
                  : finding.status === 'unresolved'
                    ? 'Unresolved'
                    : 'Not supported by these premises'}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{finding.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Rule {finding.ruleRefs.join(' · ')}
              </p>
              {finding.missing.length > 0 && (
                <p className="mt-2">
                  Missing or conflicting:{' '}
                  {finding.missing.map(labelFor).join('; ')}.
                </p>
              )}
              <details className="mt-3">
                <summary className="min-h-8 cursor-pointer text-primary">
                  Why this conclusion?
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {finding.dependsOn.map((id) => (
                    <li key={id}>
                      <a
                        className="text-primary underline underline-offset-4"
                        href={`#${id in FACTS ? 'fact' : 'finding'}-${id}`}
                      >
                        {labelFor(id)}
                      </a>
                    </li>
                  ))}
                </ul>
                {finding.sourceAssessments.length > 0 && (
                  <p className="mt-3 text-sm">
                    Depends on source-supplied assessments:{' '}
                    {finding.sourceAssessments.map(labelFor).join('; ')}. These
                    are not geometric outputs.
                  </p>
                )}
                {finding.assumptions.length > 0 && (
                  <p className="mt-3 text-sm">
                    Assumptions: {finding.assumptions.map(labelFor).join('; ')}.
                  </p>
                )}
              </details>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8" aria-label="Supplied Situation facts">
        <h2 className="text-2xl font-semibold">Supplied Situation facts</h2>
        <p className="mt-2 text-muted-foreground">
          The three-phase account is before the change, the luff, then the
          further avoiding action. Some premises supply context without being
          prerequisites of every conclusion.
        </p>
        <div className="mt-4 space-y-2">
          {(Object.keys(FACTS) as FactKey[]).map((key) => {
            const entries = packet.facts.filter((fact) => fact.key === key);
            return (
              <details
                id={`fact-${key}`}
                key={key}
                className="scroll-mt-4 rounded-lg border border-border p-3"
              >
                <summary className="min-h-8 cursor-pointer font-semibold">
                  {FACTS[key].label}
                </summary>
                {entries.length === 0 ? (
                  <p className="mt-2">
                    Not supplied in this diagnostic variant.
                  </p>
                ) : (
                  entries.map((entry, index) => (
                    <div key={`${entry.key}-${index}`} className="mt-3">
                      <p className="text-sm font-semibold">
                        {entry.value ? 'True' : 'False'} ·{' '}
                        {entry.basis === 'source-assessment'
                          ? 'Source-supplied assessment'
                          : 'Source-supplied fact'}
                      </p>
                      <p className="mt-1 text-sm">{entry.evidence}</p>
                      <a
                        className="mt-2 inline-block text-sm text-primary underline underline-offset-4"
                        href={entry.sourceUrl}
                      >
                        Read the source
                      </a>
                    </div>
                  ))
                )}
              </details>
            );
          })}
        </div>
      </section>
      <details className="mt-8">
        <summary className="min-h-8 cursor-pointer font-semibold">
          Inspect the detached facts and analysis JSON
        </summary>
        <pre className="mt-3 max-h-96 overflow-auto rounded-md border border-border bg-card p-3 text-xs">
          {JSON.stringify({ packet, report }, null, 2)}
        </pre>
      </details>
    </main>
  );
}
