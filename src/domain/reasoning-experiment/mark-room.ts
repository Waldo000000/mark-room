import { roomDependencies, type GroupDuty } from './group-duties';

// A bounded same-tack Rule 18.2(a)(1) experiment, not a complete Rule 18 engine.
// These gates deliberately expose source-supplied applicability assessments.
export const MARK_GATES = {
  sameRequiredSide: 'Both boats must leave this mark on the same side',
  oneInZone: 'At least one boat is currently in the zone',
  sameTackThroughout: 'Same tack throughout; no Rule 18.3 tacking transition',
  bothApproaching: 'Both boats are approaching, rather than one leaving',
  sectionCApplies: 'The starting-mark exclusion does not apply',
  notContinuingObstruction: 'The mark is not a continuing obstruction',
  roomNotYetGiven: 'Mark-room has not yet been given (18.1(b))',
  noTermination:
    'Neither boat has passed head to wind or left the zone since entry (18.2(b))',
  noLateOverlapException: 'The inability exception in 18.2(d) does not apply',
  entryOrderEstablished:
    'Entry overlap/order is established, not reasonably doubtful (18.2(e))',
} as const;
type Gate = keyof typeof MARK_GATES;
export type MarkPairFacts = {
  boats: [string, string];
  entry?: { outside: string; inside: string; overlapped: boolean };
  applicability: Partial<Record<Gate, boolean>>;
};
export type MarkRoomFacts = {
  version: 'mark-room-history-v1';
  episodeId: string;
  context: 'general-rrs-2025-2028';
  pairs: MarkPairFacts[];
  provenance: { history: string; applicability: string };
};

export function deriveMarkRoomDuties(facts: MarkRoomFacts) {
  const duties: GroupDuty[] = [];
  const findings = facts.pairs.map((pair) => {
    const reasons: string[] = [];
    const requirements = Object.keys(MARK_GATES) as Gate[];
    if (facts.context !== 'general-rrs-2025-2028')
      reasons.push('Unsupported rules context.');
    if (pair.boats[0] === pair.boats[1])
      reasons.push('Distinct boats required.');
    if (
      facts.pairs.filter((other) =>
        other.boats.every((boat) => pair.boats.includes(boat)),
      ).length !== 1
    )
      reasons.push('Duplicate or conflicting pair records.');
    for (const gate of requirements) {
      if (pair.applicability[gate] !== true)
        reasons.push(
          `${MARK_GATES[gate]}: ${pair.applicability[gate] === false ? 'not satisfied; outside this bounded branch' : 'not established'}.`,
        );
    }
    const entry = pair.entry;
    if (!entry)
      reasons.push(
        'The relationship when the first boat in this pair reached the zone is missing.',
      );
    else if (!entry.overlapped)
      reasons.push(
        'Non-overlapped zone entry requires another branch of Rule 18.2.',
      );
    else if (
      entry.outside === entry.inside ||
      !pair.boats.includes(entry.outside) ||
      !pair.boats.includes(entry.inside)
    )
      reasons.push(
        'Entry roles must identify the two distinct boats in this pair.',
      );
    const duty: GroupDuty | undefined =
      reasons.length || !entry
        ? undefined
        : {
            id: `${entry.outside}-18.2(a)(1)-${entry.inside}`,
            from: entry.outside,
            to: entry.inside,
            kind: 'give-mark-room',
            rule: '18.2(a)(1)',
          };
    if (duty) duties.push(duty);
    return {
      boats: pair.boats,
      dutyId: duty?.id,
      status: duty ? 'supported' : 'unresolved',
      reasons,
    };
  });
  return { duties, dependencies: roomDependencies(duties), findings };
}

// The case states the overlap/order; its answer establishes this rule's application.
// Individual exclusion details are not independently reconstructed facts.
export function case114MarkFacts(): MarkRoomFacts {
  const order = ['A', 'B', 'C'];
  return {
    version: 'mark-room-history-v1',
    episodeId: 'case-114-question-1',
    context: 'general-rrs-2025-2028',
    provenance: {
      history:
        'Case 114 Q1: source-stated same-tack overlap and A/B/C outside-to-inside order at zone entry; pairwise history is supplied for this source example.',
      applicability:
        'Source-supplied assessment: the answer applies Rule 18.2(a)(1). The gates unpack that legal scope; they are not separately observed geometric facts.',
    },
    pairs: order.flatMap((outside, index) =>
      order.slice(index + 1).map((inside) => ({
        boats: [outside, inside] as [string, string],
        entry: { outside, inside, overlapped: true },
        applicability: Object.fromEntries(
          Object.keys(MARK_GATES).map((key) => [key, true]),
        ),
      })),
    ),
  };
}
