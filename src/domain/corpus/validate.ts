import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { scenarioEvalCaseSchema, type ScenarioEvalCase } from '../eval/schema';
import { corpusMetadataSchema, type CorpusMetadata } from './schema';

export type CorpusDocument = {
  filePath: string;
  value: unknown;
};

export type ValidatedCorpus = {
  files: string[];
  evalCases: ScenarioEvalCase[];
  metadata: CorpusMetadata[];
};

export class CorpusValidationError extends Error {
  constructor(public readonly failures: string[]) {
    super(
      `Corpus validation failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`,
    );
    this.name = 'CorpusValidationError';
  }
}

function collectIssues(
  filePath: string,
  result: ReturnType<typeof scenarioEvalCaseSchema.safeParse>,
  failures: string[],
) {
  if (result.success) return;

  for (const issue of result.error.issues) {
    const location = issue.path.length > 0 ? issue.path.join('.') : 'record';
    failures.push(`${filePath}: ${location}: ${issue.message}`);
  }
}

function validateEvalReferences(
  evalCase: ScenarioEvalCase,
  filePath: string,
  failures: string[],
) {
  const scenario = evalCase.input;
  const situation = evalCase.expected.situation;
  const ruling = evalCase.expected.ruling;
  const boatIds = new Set(scenario.boats.map((boat) => boat.id));
  const momentIds = new Set(situation.moments.map((moment) => moment.id));
  const keyframeIds = new Set(
    scenario.keyframes.map((keyframe) => keyframe.id),
  );

  if (
    JSON.stringify(situation.boats.map((boat) => boat.id).sort()) !==
    JSON.stringify([...boatIds].sort())
  ) {
    failures.push(
      `${filePath}: expected.situation.boats: Situation boats must match Scenario boats`,
    );
  }

  if (
    JSON.stringify([...momentIds].sort()) !==
    JSON.stringify([...keyframeIds].sort())
  ) {
    failures.push(
      `${filePath}: expected.situation.moments: Situation moments must match Scenario keyframes`,
    );
  }

  situation.moments.forEach((moment, momentIndex) => {
    const keyframe = scenario.keyframes.find(
      (candidate) => candidate.id === moment.id,
    );
    if (!keyframe) {
      failures.push(
        `${filePath}: expected.situation.moments.${momentIndex}.id: No matching Scenario keyframe`,
      );
      return;
    }

    moment.boatStates.forEach((state, stateIndex) => {
      const scenarioState = keyframe.boatStates.find(
        (candidate) => candidate.boatId === state.boatId,
      );
      if (scenarioState && scenarioState.tack !== state.tack) {
        failures.push(
          `${filePath}: expected.situation.moments.${momentIndex}.boatStates.${stateIndex}.tack: Situation tack must match explicit Scenario tack`,
        );
      }
      const expectedSailSide = state.tack === 'port' ? 'starboard' : 'port';
      if (state.sail.side !== expectedSailSide) {
        failures.push(
          `${filePath}: expected.situation.moments.${momentIndex}.boatStates.${stateIndex}.sail.side: ${state.tack} tack requires the sail on the ${expectedSailSide} side`,
        );
      }
    });
  });

  for (const [collectionName, statements] of [
    ['obligations', ruling.obligations],
    ['outcomes', ruling.outcomes],
  ] as const) {
    statements.forEach((statement, statementIndex) => {
      if (!boatIds.has(statement.boatId)) {
        failures.push(
          `${filePath}: expected.ruling.${collectionName}.${statementIndex}.boatId: Unknown boat ID: ${statement.boatId}`,
        );
      }
      if (statement.atMoment && !momentIds.has(statement.atMoment)) {
        failures.push(
          `${filePath}: expected.ruling.${collectionName}.${statementIndex}.atMoment: Unknown moment ID: ${statement.atMoment}`,
        );
      }
      if ('owedToBoatId' in statement && statement.owedToBoatId) {
        if (!boatIds.has(statement.owedToBoatId)) {
          failures.push(
            `${filePath}: expected.ruling.${collectionName}.${statementIndex}.owedToBoatId: Unknown boat ID: ${statement.owedToBoatId}`,
          );
        }
      }
    });
  }
}

export function validateCorpusDocuments(
  evalDocuments: CorpusDocument[],
  metadataDocuments: CorpusDocument[],
): ValidatedCorpus {
  const failures: string[] = [];
  const evalCases: ScenarioEvalCase[] = [];
  const metadata: CorpusMetadata[] = [];
  const evalFiles = new Map<string, string>();
  const metadataFiles = new Map<string, string>();

  if (evalDocuments.length === 0)
    failures.push('No scenario eval JSON files were found.');
  if (metadataDocuments.length === 0)
    failures.push('No corpus metadata JSON files were found.');

  for (const document of evalDocuments) {
    const result = scenarioEvalCaseSchema.safeParse(document.value);
    collectIssues(document.filePath, result, failures);
    if (!result.success) continue;

    const scenarioId = result.data.input.id;
    const previousFile = evalFiles.get(scenarioId);
    if (previousFile) {
      failures.push(
        `${document.filePath}: duplicate scenario ID ${scenarioId} (already used by ${previousFile})`,
      );
      continue;
    }

    evalFiles.set(scenarioId, document.filePath);
    validateEvalReferences(result.data, document.filePath, failures);
    evalCases.push(result.data);
  }

  for (const document of metadataDocuments) {
    const result = corpusMetadataSchema.safeParse(document.value);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const location =
          issue.path.length > 0 ? issue.path.join('.') : 'record';
        failures.push(`${document.filePath}: ${location}: ${issue.message}`);
      }
      continue;
    }

    const previousFile = metadataFiles.get(result.data.scenarioId);
    if (previousFile) {
      failures.push(
        `${document.filePath}: duplicate metadata for ${result.data.scenarioId} (already used by ${previousFile})`,
      );
      continue;
    }
    metadataFiles.set(result.data.scenarioId, document.filePath);
    metadata.push(result.data);
  }

  for (const [scenarioId, filePath] of evalFiles) {
    if (!metadataFiles.has(scenarioId)) {
      failures.push(`${filePath}: missing corpus metadata for ${scenarioId}`);
    }
  }
  for (const [scenarioId, filePath] of metadataFiles) {
    if (!evalFiles.has(scenarioId)) {
      failures.push(
        `${filePath}: metadata has no scenario eval for ${scenarioId}`,
      );
    }
  }

  if (failures.length > 0) throw new CorpusValidationError(failures);

  return {
    files: [...evalDocuments, ...metadataDocuments].map(
      (document) => document.filePath,
    ),
    evalCases,
    metadata,
  };
}

async function readJsonDirectory(directoryPath: string) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const documents: CorpusDocument[] = [];
  const failures: string[] = [];

  for (const fileName of entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort()) {
    const filePath = path.join(directoryPath, fileName);
    const relativePath = path.relative(process.cwd(), filePath);
    try {
      documents.push({
        filePath: relativePath,
        value: JSON.parse(await readFile(filePath, 'utf8')) as unknown,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${relativePath}: invalid JSON: ${message}`);
    }
  }

  return { documents, failures };
}

export async function validateCorpusDirectory(
  corpusPath = path.join(process.cwd(), 'corpus'),
): Promise<ValidatedCorpus> {
  const evalResult = await readJsonDirectory(
    path.join(corpusPath, 'scenarios'),
  );
  const metadataResult = await readJsonDirectory(
    path.join(corpusPath, 'metadata'),
  );
  const failures = [...evalResult.failures, ...metadataResult.failures];
  if (failures.length > 0) throw new CorpusValidationError(failures);

  return validateCorpusDocuments(
    evalResult.documents,
    metadataResult.documents,
  );
}
