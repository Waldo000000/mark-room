import {
  assessCompatibility,
  type FindingsPacket,
} from '@/src/domain/derivation-experiment/findings';
import { CASE_BOOK_URL } from '@/src/domain/reasoning-experiment/facts';
import {
  CASE_114_LUFF_FACTS,
  deriveLuffingDuties,
} from '@/src/domain/reasoning-experiment/group-duties';

const sourceDuties = deriveLuffingDuties(CASE_114_LUFF_FACTS);

export function JointReasoningPanel({ packet }: { packet: FindingsPacket }) {
  const compatibility = assessCompatibility(packet);
  const mismatch =
    compatibility.eachPairHasCandidate &&
    compatibility.jointCandidateCount === 0;
  return (
    <section
      className="my-5 rounded-lg border border-border bg-card p-4"
      aria-label="Joint response compatibility"
    >
      <h2 className="text-xl font-semibold">
        Do the pairwise responses fit together?
      </h2>
      <p className="mt-3 font-semibold" data-testid="compatibility-result">
        {mismatch
          ? 'Every pair has a candidate, but no joint candidate works.'
          : compatibility.jointCandidateCount > 0
            ? 'At least one complete combination works across every pair.'
            : 'At least one pair has no certified candidate in this set.'}
      </p>
      <ul className="mt-3 space-y-2" data-testid="pair-candidate-counts">
        {compatibility.pairs.map((pair) => (
          <li key={pair.boats.join('/')}>
            <strong>{pair.boats.join(' / ')}:</strong> {pair.candidateCount}{' '}
            combinations certify clearance.
            <details className="mt-1">
              <summary className="min-h-8 cursor-pointer text-primary">
                Compatible M choices
              </summary>
              <p className="mt-1 break-words text-sm">
                {pair.middleOptions.length
                  ? pair.middleOptions.join('; ')
                  : 'None in this tested set.'}
              </p>
            </details>
          </li>
        ))}
      </ul>
      <p className="mt-3">
        Joint combinations:{' '}
        <strong data-testid="joint-candidate-count">
          {compatibility.jointCandidateCount}
        </strong>
        . Each combination uses the same M and W choices for every pair,
        including L/W.
      </p>
      {mismatch && (
        <p className="mt-2">
          A separate “yes” for each pair would lose the required compatibility.
          The detached findings packet preserves it with shared response
          identities.
        </p>
      )}
      <p className="mt-3 text-sm text-muted-foreground">
        Whole-interval, retrospective clearance evidence only. No candidate
        proves what a sailor could know at the time; no successful candidate is
        not proof of insufficient legal room.
      </p>
      <details className="mt-4 border-t border-border pt-3">
        <summary className="min-h-8 cursor-pointer font-semibold">
          The separate legal dependency: Case 114, question 2
        </summary>
        <p className="mt-2">
          Source-supplied premises: same tack, all overlapped in L/M/W order,
          and each boat luffs. This transcription is a bounded duty example, not
          a ruling on the synthetic trajectories above.
        </p>
        <ul
          className="mt-3 list-disc space-y-1 pl-5"
          data-testid="group-duties"
        >
          {sourceDuties.duties.map((duty) => (
            <li key={duty.id}>
              {duty.from} → {duty.to}:{' '}
              {duty.kind === 'keep-clear' ? 'keep clear' : 'give room'} (Rule{' '}
              {duty.rule}).
            </li>
          ))}
        </ul>
        <p className="mt-3 font-semibold">
          L’s room for M includes M’s room obligation to W.
        </p>
        <p className="mt-2 text-sm">
          These are linked pairwise duties. The experiment covers Rules 11/16.1
          only; it does not assess all Part 2 duties, measure seamanlike room,
          or infer a breach. The numerical gap is an uncalibrated test input,
          not an RRS threshold.
        </p>
        <a
          className="mt-3 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
          href={`${CASE_BOOK_URL}#page=253`}
        >
          Read the official Case 114
        </a>
        <details className="mt-2">
          <summary className="min-h-8 cursor-pointer">
            Inspect detached duty dependencies
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto text-xs">
            {JSON.stringify(sourceDuties, null, 2)}
          </pre>
        </details>
      </details>
    </section>
  );
}
