import {
  FACTS,
  type AnalysisReport,
  type FactKey,
  type FactPacket,
  type Finding,
} from './facts';

const unique = <T>(values: T[]) => [...new Set(values)];

// Only consumes detached facts. No Scenario, trajectories, case IDs or callbacks.
export function analyzeFacts(packet: FactPacket): AnalysisReport {
  const diagnostics: string[] = [];
  const facts = new Map<string, Finding>();
  const supportedContext =
    packet.version === 'pairwise-facts-v1' &&
    packet.context.discipline === 'general_rrs' &&
    packet.context.ruleSet === '2025-2028' &&
    packet.boats.port !== packet.boats.starboard;
  if (!supportedContext)
    diagnostics.push(
      'Unsupported rules context, packet version or participant roles.',
    );

  for (const key of Object.keys(FACTS) as FactKey[]) {
    const supplied = packet.facts.filter((fact) => fact.key === key);
    const applicable = supplied.filter(
      (fact) => fact.episodeId === packet.episodeId && fact.world === 'actual',
    );
    if (applicable.length !== supplied.length)
      diagnostics.push(
        `${FACTS[key].label}: evidence from another episode or hypothetical branch was excluded.`,
      );
    const conflict =
      applicable.some((fact) => fact.value) &&
      applicable.some((fact) => !fact.value);
    if (conflict)
      diagnostics.push(`${FACTS[key].label}: conflicting supplied values.`);
    const missing = !supportedContext || applicable.length === 0 || conflict;
    facts.set(key, {
      id: key,
      label: FACTS[key].label,
      status: missing
        ? 'unresolved'
        : applicable[0].value
          ? 'supported'
          : 'not-supported',
      ruleRefs: [],
      dependsOn: [],
      missing: missing ? [key] : [],
      contradicted: !missing && !applicable[0].value ? [key] : [],
      assumptions: applicable.some((fact) => fact.basis === 'assumption')
        ? [key]
        : [],
      sourceAssessments: applicable.some(
        (fact) => fact.basis === 'source-assessment',
      )
        ? [key]
        : [],
    });
  }

  const findings: Finding[] = [];
  function conclude(
    id: string,
    label: string,
    ruleRefs: string[],
    dependsOn: string[],
  ) {
    const requirements = dependsOn.map((key) => facts.get(key)!);
    const missing = unique(requirements.flatMap((item) => item.missing));
    const contradicted = unique(
      requirements.flatMap((item) => item.contradicted),
    );
    const finding: Finding = {
      id,
      label,
      ruleRefs,
      dependsOn,
      missing,
      contradicted,
      status: missing.length
        ? 'unresolved'
        : contradicted.length
          ? 'not-supported'
          : 'supported',
      assumptions: unique(requirements.flatMap((item) => item.assumptions)),
      sourceAssessments: unique(
        requirements.flatMap((item) => item.sourceAssessments),
      ),
    };
    facts.set(id, finding);
    findings.push(finding);
  }

  const { starboard, port } = packet.boats;
  conclude(
    'keep-clear-duty',
    `${port} must keep clear of ${starboard}`,
    ['10'],
    ['rules-apply', 'opposite-tacks', 'starboard-role'],
  );
  conclude(
    'room-duty',
    `${starboard} must give ${port} room during the course change`,
    ['16.1'],
    ['keep-clear-duty', 'course-changed'],
  );
  conclude(
    'keep-clear-breach',
    `${port} breaks Rule 10 in this encounter`,
    ['10', 'Keep Clear'],
    ['keep-clear-duty', 'avoidance-required'],
  );
  conclude(
    'room-compliance',
    `${starboard} satisfies this Rule 16.1 obligation`,
    ['16.1'],
    ['room-duty', 'room-provided'],
  );
  conclude(
    'exoneration',
    `${port} is exonerated for this Rule 10 breach`,
    ['43.1(b)'],
    [
      'keep-clear-breach',
      'room-duty',
      'within-entitlement',
      'incident-consequence',
    ],
  );
  conclude(
    'no-penalty-for-breach',
    `${port} need not take, and must not receive, a penalty for this breach`,
    ['43.2'],
    ['exoneration'],
  );

  return { episodeId: packet.episodeId, findings, diagnostics };
}
