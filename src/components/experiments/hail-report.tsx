'use client';
import { useState } from 'react';
import {
  analyzeHails,
  case113HailFacts,
} from '@/src/domain/reasoning-experiment/hails';
import {
  CASE_BOOK_URL,
  RULES_URL,
} from '@/src/domain/reasoning-experiment/facts';

const statusLabels = {
  supported: 'Supported by supplied premises',
  unresolved: 'Unresolved',
  conditional: 'Conditional: depends on W’s current response',
  'not-required-in-this-branch': 'Additional relay not required by this branch',
};
export function HailReport() {
  const [variant, setVariant] = useState('source');
  const packet = case113HailFacts();
  if (variant === 'hearing') delete packet.heardByW;
  if (variant === 'responding') packet.wAlreadyResponding = true;
  if (variant === 'waiting') packet.wAlreadyResponding = false;
  if (variant === 'invalid') packet.hailMeetsRule201 = false;
  const report = analyzeHails(packet);
  return (
    <section
      id="hails"
      aria-label="Linked hail challenge"
      className="mt-10 scroll-mt-4 border-t border-border pt-6"
    >
      <h2 className="text-2xl font-semibold">
        A hail can create duties across three boats
      </h2>
      <p className="mt-3">
        Case 113: L, M and W approach an obstruction on the same tack. L hails
        “Room to tack”; the source establishes that both windward boats must
        tack before L can. General RRS 2025–2028; unverified research
        transcription.
      </p>
      <label className="mt-4 block font-semibold">
        Hail evidence check
        <select
          className="mt-2 min-h-11 w-full rounded-md border border-border bg-card px-3 py-2"
          value={variant}
          onChange={(event) => setVariant(event.target.value)}
        >
          <option value="source">
            Source: conditional relay
          </option>
          <option value="hearing">Withhold whether W heard the hail</option>
          <option value="responding">W is already responding</option>
          <option value="waiting">W is not yet responding</option>
          <option value="invalid">Hailing conditions under 20.1 not met</option>
        </select>
      </label>
      <p className="mt-2 text-sm text-muted-foreground">
        Changed premises are dependency diagnostics, not alternative official
        rulings. All other supplied assessments remain fixed.
      </p>
      <ol className="mt-4 space-y-3">
        {report.map((item) => (
          <li
            className="rounded-lg border border-border bg-card p-4"
            key={item.id}
            data-testid={`hail-${item.id}`}
          >
            <p className="text-sm font-semibold" data-testid="hail-status">
              {statusLabels[item.status]}
            </p>
            <h3 className="mt-1 font-semibold">{item.label}</h3>
            <p className="mt-1 text-sm">Rule {item.rule}</p>
          </li>
        ))}
      </ol>
      <details className="mt-4 rounded-lg border border-border p-4">
        <summary className="min-h-11 cursor-pointer font-semibold">
          What is supplied, and what is still missing?
        </summary>
        <p className="mt-3">
          Source facts: same tack, the hail, and its audibility to M and W.
          Source response assessments: W must act before L can tack; M cannot
          give a “You tack” response and needs W to tack. Those handling
          conclusions are not derived from positions.
        </p>
        <p className="mt-3">
          The official relay answer is conditional on W not already responding.
          It does not establish an actual failure to hail or a breach. This
          report also does not decide response time, compliance, penalties or
          every Rule 20 obligation.
        </p>
        <p className="mt-3">
          Rule 20.2(b) still requires a hailed boat to respond when the hail
          breaks 20.1. This does not excuse the hailing boat. Words other than
          “Room to tack” and additional signaling requirements are outside this
          branch.
        </p>
        <p className="mt-3">
          Scenario currently records a hail’s boat, message and authored
          position. The editor can show those inputs; it cannot infer
          recipients, audibility or feasible responses from that record. No
          geometry callback would supply missing hearing evidence.
        </p>
      </details>
      <div className="mt-3 flex flex-wrap gap-4 text-primary underline underline-offset-4">
        <a href={`${CASE_BOOK_URL}#page=251`}>Official Case 113</a>
        <a href={`${RULES_URL}#page=25`}>Full Rule 20</a>
      </div>
      <details className="mt-3">
        <summary className="min-h-11 cursor-pointer">
          Inspect hail facts and dependencies
        </summary>
        <pre className="mt-2 max-h-80 overflow-auto text-xs">
          {JSON.stringify({ packet, report }, null, 2)}
        </pre>
      </details>
    </section>
  );
}
