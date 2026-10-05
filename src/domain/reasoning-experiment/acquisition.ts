export const ACQUISITION_PREMISES = {
  sectionA: 'Section A applies in this episode',
  noTackingDuty:
    'Neither boat is subject to Rule 13 in the before/after relationships',
  beforeAstern: 'Before overlap: same tack, L clear astern of W',
  nowLeeward: 'At the luff: same tack, L overlapped to leeward of W',
  causedByOther: 'L acquired right of way because of W’s actions',
  initialPeriod: 'The luff is within the initial room-giving period',
  changesCourse: 'L changes course during this episode',
  noResponse: 'No seamanlike action allows W to keep clear during this luff',
  failsKeepClear: 'W fails to keep clear during the luff',
  withinRoom: 'W sails within the room to which she is entitled',
  incidentConsequence: 'W’s breach results from this incident with L',
} as const;
type Key = keyof typeof ACQUISITION_PREMISES;
type Evidence = {
  value: boolean;
  basis: 'source-fact' | 'source-assessment' | 'diagnostic';
  explanation: string;
};
export type AcquisitionPacket = {
  context: 'general-rrs-2025-2028';
  episodeId: string;
  boats: { leeward: string; windward: string };
  evidence: Partial<Record<Key, Evidence>>;
};
type Status = 'supported' | 'unresolved' | 'not-supported';
export type AcquisitionFinding = {
  id: string;
  label: string;
  rule: string;
  status: Status;
  dependsOn: string[];
};

// Detached source-fact experiment. No Scenario, geometry, clock or case-ID lookup.
export function analyzeAcquisition(packet: AcquisitionPacket) {
  const findings: AcquisitionFinding[] = [];
  const values: Record<string, boolean | undefined> = {};
  const valid =
    packet.context === 'general-rrs-2025-2028' &&
    packet.boats.leeward !== packet.boats.windward;
  for (const key of Object.keys(ACQUISITION_PREMISES) as Key[])
    values[key] = valid ? packet.evidence[key]?.value : undefined;
  const L = packet.boats.leeward;
  const W = packet.boats.windward;
  function add(
    id: string,
    label: string,
    rule: string,
    requirements: [string, boolean][],
  ) {
    const status: Status = requirements.some(
      ([key]) => values[key] === undefined,
    )
      ? 'unresolved'
      : requirements.every(([key, expected]) => values[key] === expected)
        ? 'supported'
        : 'not-supported';
    values[id] = status === 'unresolved' ? undefined : status === 'supported';
    findings.push({
      id,
      label,
      rule,
      status,
      dependsOn: requirements.map(([key, expected]) =>
        expected ? key : `not:${key}`,
      ),
    });
  }
  add('before-duty', `${L} must keep clear of ${W} before overlap`, '12', [
    ['sectionA', true],
    ['noTackingDuty', true],
    ['beforeAstern', true],
  ]);
  add('current-duty', `${W} must keep clear of ${L} during the luff`, '11', [
    ['sectionA', true],
    ['noTackingDuty', true],
    ['nowLeeward', true],
  ]);
  add('acquisition', `${L} acquires right of way at overlap`, '11, 12', [
    ['before-duty', true],
    ['current-duty', true],
  ]);
  add('room-15', `${L} must initially give ${W} room to keep clear`, '15', [
    ['acquisition', true],
    ['causedByOther', false],
  ]);
  add('room-16', `${L} must give ${W} room while changing course`, '16.1', [
    ['current-duty', true],
    ['changesCourse', true],
  ]);
  add('breach-15', `${L} breaks Rule 15 in the initial period`, '15', [
    ['room-15', true],
    ['initialPeriod', true],
    ['noResponse', true],
  ]);
  add('breach-16', `${L} breaks Rule 16.1 during the luff`, '16.1', [
    ['room-16', true],
    ['noResponse', true],
  ]);
  add('breach-11', `${W} breaks Rule 11`, '11', [
    ['current-duty', true],
    ['failsKeepClear', true],
  ]);
  const initialInputs = [values['room-15'], values.initialPeriod];
  const initialRoom = initialInputs.includes(false)
    ? false
    : initialInputs.includes(undefined)
      ? undefined
      : true;
  const roomDuties = [initialRoom, values['room-16']];
  values['room-entitlement'] = roomDuties.includes(true)
    ? true
    : roomDuties.includes(undefined)
      ? undefined
      : false;
  findings.push({
    id: 'room-entitlement',
    label: `${W} has a supported room entitlement during this luff under Rule 15 or 16.1`,
    rule: '15, 16.1',
    status:
      values['room-entitlement'] === undefined
        ? 'unresolved'
        : values['room-entitlement']
          ? 'supported'
          : 'not-supported',
    dependsOn: ['room-15', 'initialPeriod', 'room-16'],
  });
  add('exoneration', `${W} is exonerated for this Rule 11 breach`, '43.1(b)', [
    ['breach-11', true],
    ['room-entitlement', true],
    ['withinRoom', true],
    ['incidentConsequence', true],
  ]);
  return {
    findings,
    diagnostics: valid
      ? []
      : ['Unsupported context or identical participants.'],
  };
}

export function case93AcquisitionFacts(): AcquisitionPacket {
  const sourceFacts = new Set<Key>([
    'beforeAstern',
    'nowLeeward',
    'changesCourse',
  ]);
  const explanations: Record<Key, string> = {
    sectionA:
      'The decision applies Rules 12 and 11 to these successive relationships.',
    noTackingDuty:
      'W has reached her new close-hauled course before position 2; the decision applies Rules 12 and 11, not Rule 13, in the selected episode.',
    beforeAstern:
      'At position 2 L is clear astern of W after W has completed her tack.',
    nowLeeward: 'Between positions 2 and 3 L becomes overlapped to leeward.',
    causedByOther:
      'The source applies Rule 15 after L establishes the overlap; the other-boat-action exception is not the basis of this acquisition.',
    initialPeriod:
      'The immediate luff is assessed by the source under the initial Rule 15 obligation.',
    changesCourse: 'L luffs immediately after establishing the overlap.',
    noResponse:
      'The decision finds no available seamanlike action for W to keep clear. This is a supplied assessment, not a geometric calculation.',
    failsKeepClear: 'The source finds W failed to keep clear when L luffed.',
    withinRoom: 'The decision assesses W as sailing within her entitled room.',
    incidentConsequence:
      'The source links W’s failure to keep clear to this luffing incident with L.',
  };
  return {
    context: 'general-rrs-2025-2028',
    episodeId: 'case-93-overlap-and-luff',
    boats: { leeward: 'L', windward: 'W' },
    evidence: Object.fromEntries(
      (Object.keys(ACQUISITION_PREMISES) as Key[]).map((key) => [
        key,
        {
          value: key !== 'causedByOther',
          basis: sourceFacts.has(key) ? 'source-fact' : 'source-assessment',
          explanation: explanations[key],
        },
      ]),
    ),
  };
}
