export type HailFacts = {
  context: 'general-rrs-2025-2028';
  episodeId: string;
  sameTack?: boolean;
  roomToTackHailMade?: boolean;
  heardByM?: boolean;
  heardByW?: boolean;
  wMustRespondBeforeLCanTack?: boolean;
  mCannotReplyYouTack?: boolean;
  mNeedsWToTack?: boolean;
  wAlreadyResponding?: boolean;
  hailMeetsRule201?: boolean;
};
type HailStatus =
  | 'supported'
  | 'unresolved'
  | 'conditional'
  | 'not-required-in-this-branch';
type HailFinding = {
  id: string;
  label: string;
  rule: string;
  status: HailStatus;
  dependsOn: string[];
};

// Case 113's declared L/M/W roles and current hail episode only. A missing
// recipient or handling fact does not establish that a response is unnecessary.
export function analyzeHails(facts: HailFacts): HailFinding[] {
  const common =
    facts.context === 'general-rrs-2025-2028' &&
    facts.sameTack === true &&
    facts.roomToTackHailMade === true;
  const middle = common && facts.heardByM === true;
  const windward =
    common &&
    facts.heardByW === true &&
    facts.wMustRespondBeforeLCanTack === true;
  const tack = middle && facts.mCannotReplyYouTack === true;
  const relayBase = tack && facts.mNeedsWToTack === true;
  // Rule 20.2(b): do not gate the response duty on the hail's compliance with 20.1.
  const commonDependencies = ['sameTack', 'roomToTackHailMade'];
  return [
    {
      id: 'middle-response',
      label: 'M must respond to L’s hail',
      rule: '20.2(b), 20.2(c)',
      status: middle ? 'supported' : 'unresolved',
      dependsOn: [...commonDependencies, 'heardByM'],
    },
    {
      id: 'windward-response',
      label: 'W must respond although she is not adjacent to L',
      rule: '20.2(c); Case 113 Q1',
      status: windward ? 'supported' : 'unresolved',
      dependsOn: [
        ...commonDependencies,
        'heardByW',
        'wMustRespondBeforeLCanTack',
      ],
    },
    {
      id: 'middle-tack',
      label: 'M must respond by tacking as soon as possible',
      rule: '20.2(c)',
      status: tack ? 'supported' : 'unresolved',
      dependsOn: ['middle-response', 'mCannotReplyYouTack'],
    },
    {
      id: 'middle-relay',
      label:
        'M must immediately pass the hail to W if W is not already responding',
      rule: '20.2(c), 20.3; Case 113 Q2',
      status: !relayBase
        ? 'unresolved'
        : facts.wAlreadyResponding === undefined
          ? 'conditional'
          : facts.wAlreadyResponding
            ? 'not-required-in-this-branch'
            : 'supported',
      dependsOn: ['middle-tack', 'mNeedsWToTack', 'wAlreadyResponding'],
    },
  ];
}

// Research transcription. The source supplies audibility and the need for
// both windward boats to tack; Q2 leaves W's current response conditional.
export function case113HailFacts(): HailFacts {
  return {
    context: 'general-rrs-2025-2028',
    episodeId: 'case-113-current-hail',
    sameTack: true,
    roomToTackHailMade: true,
    heardByM: true,
    heardByW: true,
    wMustRespondBeforeLCanTack: true,
    mCannotReplyYouTack: true,
    mNeedsWToTack: true,
    hailMeetsRule201: true,
  };
}
