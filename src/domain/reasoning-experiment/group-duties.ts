// Source-fact research scope: Rules 11 and 16.1 during a declared same-tack,
// all-overlapped luff. This neither measures room nor determines breaches.
export type GroupDuty = {
  id: string;
  from: string;
  to: string;
  kind: 'keep-clear' | 'give-room' | 'give-mark-room';
  rule: '11' | '16.1' | '18.2(a)(1)';
};
export type LuffingGroupFacts = {
  leewardToWindward: string[];
  sectionAApplies?: boolean;
  sameTack?: boolean;
  allOverlapped?: boolean;
  courseChanges: Record<string, boolean | undefined>;
};

export function roomDependencies(duties: GroupDuty[]) {
  return duties
    .filter(
      (duty) => duty.kind === 'give-room' || duty.kind === 'give-mark-room',
    )
    .map((duty) => ({
      dutyId: duty.id,
      includes: duties
        .filter((other) => other.from === duty.to)
        .map((other) => other.id),
    }));
}

export function deriveLuffingDuties(facts: LuffingGroupFacts) {
  const duties: GroupDuty[] = [];
  const unresolved: string[] = [];
  if (
    facts.leewardToWindward.length < 2 ||
    new Set(facts.leewardToWindward).size !== facts.leewardToWindward.length
  ) {
    return {
      duties,
      dependencies: [],
      unresolved: ['Distinct ordered participants are required.'],
    };
  }
  if (
    facts.sectionAApplies !== true ||
    facts.sameTack !== true ||
    facts.allOverlapped !== true
  ) {
    return {
      duties,
      dependencies: [],
      unresolved: [
        'This bounded rule family requires established applicability, same tack and overlap for the group.',
      ],
    };
  }
  for (const [index, leeward] of facts.leewardToWindward.entries()) {
    for (const windward of facts.leewardToWindward.slice(index + 1)) {
      duties.push({
        id: `${windward}-11-${leeward}`,
        from: windward,
        to: leeward,
        kind: 'keep-clear',
        rule: '11',
      });
      if (facts.courseChanges[leeward] === true)
        duties.push({
          id: `${leeward}-16.1-${windward}`,
          from: leeward,
          to: windward,
          kind: 'give-room',
          rule: '16.1',
        });
      else if (facts.courseChanges[leeward] === undefined)
        unresolved.push(
          `${leeward} course change toward ${windward}: not established.`,
        );
    }
  }
  return { duties, dependencies: roomDependencies(duties), unresolved };
}

// Research transcription of Case 114 question 2, separate from synthetic motion.
export const CASE_114_LUFF_FACTS: LuffingGroupFacts = {
  leewardToWindward: ['L', 'M', 'W'],
  sectionAApplies: true,
  sameTack: true,
  allOverlapped: true,
  courseChanges: { L: true, M: true, W: true },
};
