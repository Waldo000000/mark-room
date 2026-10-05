// Research-only contract. Production Situation and Ruling remain unchanged.
export const FACTS = {
  'rules-apply': {
    label: 'Part 2 Section A applies to this encounter',
    kind: 'assessment',
  },
  'opposite-tacks': {
    label: 'The boats are on opposite tacks',
    kind: 'observation',
  },
  'starboard-role': {
    label: 'The designated right-of-way boat is on starboard',
    kind: 'observation',
  },
  'initially-clear': {
    label: 'The port boat keeps clear before the change',
    kind: 'assessment',
  },
  'course-changed': {
    label: 'The starboard boat changes course',
    kind: 'observation',
  },
  'avoidance-required': {
    label: 'The starboard boat then needs avoiding action',
    kind: 'assessment',
  },
  'response-limited': {
    label: 'Tacking or holding course cannot keep the port boat clear',
    kind: 'assessment',
  },
  'further-change': {
    label: 'The starboard boat promptly changes course again',
    kind: 'observation',
  },
  'room-provided': {
    label: 'The required room is provided during this course-change episode',
    kind: 'assessment',
  },
  'within-entitlement': {
    label: 'The port boat is sailing within her entitled room',
    kind: 'assessment',
  },
  'incident-consequence': {
    label:
      'The keep-clear breach results from this incident with the room giver',
    kind: 'assessment',
  },
} as const;

export type FactKey = keyof typeof FACTS;
export type EvidenceBasis =
  | 'source-fact'
  | 'source-assessment'
  | 'assumption'
  | 'derived';
export type FactEvidence = {
  key: FactKey;
  value: boolean;
  episodeId: string;
  world: 'actual' | 'hypothetical';
  basis: EvidenceBasis;
  evidence: string;
  sourceUrl?: string;
};
export type FactPacket = {
  version: 'pairwise-facts-v1';
  episodeId: string;
  context: { discipline: 'general_rrs' | 'radio_sailing'; ruleSet: string };
  boats: { starboard: string; port: string };
  facts: FactEvidence[];
};
export type FindingStatus = 'supported' | 'unresolved' | 'not-supported';
export type Finding = {
  id: string;
  label: string;
  status: FindingStatus;
  ruleRefs: string[];
  dependsOn: string[];
  missing: string[];
  contradicted: string[];
  assumptions: FactKey[];
  sourceAssessments: FactKey[];
};
export type AnalysisReport = {
  episodeId: string;
  findings: Finding[];
  diagnostics: string[];
};

export const CASE_BOOK_URL =
  'https://media.sailing.org/sailing/wp-content/uploads/2025/07/31104846/WS-Case-Book-2025-2028-v2025-07.pdf';
export const RULES_URL =
  'https://media.sailing.org/sailing/wp-content/uploads/2025/07/29083752/2025-2028-RRS-with-Changes-and-Corrections.pdf';
