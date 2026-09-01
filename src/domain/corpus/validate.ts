import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { scenarioSchema, type Scenario } from '../scenario/schema';

export type CorpusDocument = {
  filePath: string;
  value: unknown;
};

export type ValidatedCorpus = {
  files: string[];
  scenarios: Scenario[];
};

export class CorpusValidationError extends Error {
  constructor(public readonly failures: string[]) {
    super(
      `Corpus validation failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`,
    );
    this.name = 'CorpusValidationError';
  }
}

export function validateCorpusDocuments(
  documents: CorpusDocument[],
): ValidatedCorpus {
  const failures: string[] = [];
  const scenarios: Scenario[] = [];
  const scenarioFiles = new Map<string, string>();

  if (documents.length === 0) {
    failures.push('No scenario JSON files were found.');
  }

  for (const document of documents) {
    const result = scenarioSchema.safeParse(document.value);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const location =
          issue.path.length > 0 ? issue.path.join('.') : 'record';
        failures.push(`${document.filePath}: ${location}: ${issue.message}`);
      }
      continue;
    }

    const previousFile = scenarioFiles.get(result.data.id);
    if (previousFile) {
      failures.push(
        `${document.filePath}: duplicate scenario ID ${result.data.id} (already used by ${previousFile})`,
      );
      continue;
    }

    scenarioFiles.set(result.data.id, document.filePath);
    scenarios.push(result.data);
  }

  if (failures.length > 0) throw new CorpusValidationError(failures);

  return {
    files: documents.map((document) => document.filePath),
    scenarios,
  };
}

export async function validateCorpusDirectory(
  directoryPath = path.join(process.cwd(), 'corpus', 'scenarios'),
): Promise<ValidatedCorpus> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const fileNames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort();
  const documents: CorpusDocument[] = [];
  const failures: string[] = [];

  for (const fileName of fileNames) {
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

  if (failures.length > 0) throw new CorpusValidationError(failures);

  return validateCorpusDocuments(documents);
}
