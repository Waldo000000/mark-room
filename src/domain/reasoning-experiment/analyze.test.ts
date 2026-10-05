import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeFacts } from './analyze';
import { case147Facts } from './case147';
import type { FactKey } from './facts';

const result = (key: string, omitted?: FactKey) => {
  const packet = case147Facts();
  packet.facts = packet.facts.filter((fact) => fact.key !== omitted);
  return analyzeFacts(packet).findings.find((finding) => finding.id === key)!;
};

describe('detached source-fact reasoning', () => {
  it('supports breach, room compliance and exoneration simultaneously', () => {
    const packet = JSON.parse(JSON.stringify(case147Facts()));
    const report = analyzeFacts(packet);
    expect(report.findings).toHaveLength(6);
    expect(
      report.findings.every((finding) => finding.status === 'supported'),
    ).toBe(true);
    expect(report.diagnostics).toEqual([]);
    expect(result('exoneration').sourceAssessments).toContain(
      'within-entitlement',
    );
  });

  it('does not infer exoneration merely from inability to respond', () => {
    expect(result('exoneration', 'within-entitlement')).toMatchObject({
      status: 'unresolved',
      missing: ['within-entitlement'],
    });
    expect(result('keep-clear-breach', 'within-entitlement').status).toBe(
      'supported',
    );
    expect(result('no-penalty-for-breach', 'within-entitlement').status).toBe(
      'unresolved',
    );
  });

  it('requires the incident causal premise for exoneration', () => {
    expect(result('exoneration', 'incident-consequence').status).toBe(
      'unresolved',
    );
    expect(result('room-compliance', 'incident-consequence').status).toBe(
      'supported',
    );
  });

  it('does not manufacture room from a further course change', () => {
    expect(result('room-compliance', 'room-provided').status).toBe(
      'unresolved',
    );
    expect(result('room-duty', 'room-provided').status).toBe('supported');
  });

  it('does not need S to breach Rule 16.1 for PB to be exonerated', () => {
    expect(result('exoneration', 'room-provided').status).toBe('supported');
  });

  it('propagates a missing applicability premise', () => {
    const packet = case147Facts();
    packet.facts = packet.facts.filter((fact) => fact.key !== 'rules-apply');
    expect(
      analyzeFacts(packet).findings.every(
        (finding) => finding.status === 'unresolved',
      ),
    ).toBe(true);
  });

  it('withholds contradictory evidence without contaminating independent findings', () => {
    const packet = case147Facts();
    packet.facts.push({
      ...packet.facts.find((fact) => fact.key === 'within-entitlement')!,
      value: false,
    });
    const report = analyzeFacts(packet);
    expect(report.diagnostics).toContain(
      'The port boat is sailing within her entitled room: conflicting supplied values.',
    );
    expect(
      report.findings.find((finding) => finding.id === 'exoneration')!.status,
    ).toBe('unresolved');
    expect(
      report.findings.find((finding) => finding.id === 'room-compliance')!
        .status,
    ).toBe('supported');
  });

  it('a false premise does not manufacture the opposite ruling', () => {
    const packet = case147Facts();
    packet.facts.find((fact) => fact.key === 'within-entitlement')!.value =
      false;
    const report = analyzeFacts(packet);
    expect(
      report.findings.find((finding) => finding.id === 'exoneration')!.status,
    ).toBe('not-supported');
    expect(report.findings.some((finding) => finding.id === 'penalty')).toBe(
      false,
    );
  });

  it.each(['hypothetical', 'different-episode'] as const)(
    'excludes %s evidence from actual conclusions',
    (mode) => {
      const packet = case147Facts();
      const fact = packet.facts.find(
        (item) => item.key === 'within-entitlement',
      )!;
      if (mode === 'hypothetical') fact.world = 'hypothetical';
      else fact.episodeId = 'other';
      const report = analyzeFacts(packet);
      expect(report.diagnostics).toHaveLength(1);
      expect(
        report.findings.find((finding) => finding.id === 'exoneration')!.status,
      ).toBe('unresolved');
    },
  );

  it('propagates explicit assumptions to dependent conclusions', () => {
    const packet = case147Facts();
    packet.facts.find((fact) => fact.key === 'within-entitlement')!.basis =
      'assumption';
    expect(
      analyzeFacts(packet).findings.find(
        (finding) => finding.id === 'exoneration',
      )!.assumptions,
    ).toEqual(['within-entitlement']);
  });

  it('does not silently apply this general-RRS fixture to another rules context', () => {
    const packet = case147Facts();
    packet.context.discipline = 'radio_sailing';
    expect(
      analyzeFacts(packet).findings.every(
        (finding) => finding.status === 'unresolved',
      ),
    ).toBe(true);
  });

  it('uses role labels rather than a case identifier to compute conclusions', () => {
    const packet = case147Facts();
    packet.boats = { starboard: 'Alpha', port: 'Beta' };
    expect(analyzeFacts(packet).findings[0].label).toBe(
      'Beta must keep clear of Alpha',
    );
    expect(Object.keys(packet)).not.toContain('caseId');
    const source = readFileSync(
      new URL('./analyze.ts', import.meta.url),
      'utf8',
    );
    expect(
      [...source.matchAll(/from ['"]([^'"]+)['"]/g)].map((match) => match[1]),
    ).toEqual(['./facts']);
  });
});
