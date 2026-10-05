// Deliberately no imports from Scenario, motion, geometry or the producer.
export type PairFinding = {
  boats: [string, string];
  status: 'clearance-certified' | 'hull-intersection' | 'resolution-limit';
  lowerClearanceBoundHullLengths: number;
  minimumSampledClearanceHullLengths: number;
  limitingSampleSeconds: number;
};
export type CandidateFinding = {
  id: string;
  middleOption: string;
  windwardOption?: string;
  pairs: PairFinding[];
};
export type FindingsPacket = {
  version: 'experimental-1';
  caseId: string;
  profileId: string;
  intervalSeconds: [number, number];
  // The pair list is the entire encounter, including non-adjacent boats.
  requiredPairs: [string, string][];
  candidates: CandidateFinding[];
};
export type Assessment = {
  status: 'witness-found' | 'no-certified-candidate';
  witnessId: string | null;
  evaluatedCandidates: number;
};

export function candidateWorks(
  candidate: CandidateFinding,
  requiredPairs: [string, string][],
): boolean {
  return (
    requiredPairs.length > 0 &&
    requiredPairs.every(([first, second]) =>
      candidate.pairs.some(
        (pair) =>
          pair.boats[0] === first &&
          pair.boats[1] === second &&
          pair.status === 'clearance-certified',
      ),
    )
  );
}

export function assessFindings(packet: FindingsPacket): Assessment {
  const witness = packet.candidates.find((candidate) =>
    candidateWorks(candidate, packet.requiredPairs),
  );
  return {
    status: witness ? 'witness-found' : 'no-certified-candidate',
    witnessId: witness?.id ?? null,
    evaluatedCandidates: packet.candidates.length,
  };
}
