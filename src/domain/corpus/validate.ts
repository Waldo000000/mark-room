import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { scenarioEvalCaseSchema, type ScenarioEvalCase } from '../eval/schema';
import { corpusMetadataSchema, type CorpusMetadata } from './schema';

type CorpusRecords = {
  evalCases: Map<string, unknown>;
  metadata: Map<string, unknown>;
};

export type ValidatedCorpusEntry = {
  slug: string;
  evalCase: ScenarioEvalCase;
  metadata: CorpusMetadata;
};

function formatIssues(
  file: string,
  issues: { message: string; path: PropertyKey[] }[],
) {
  return issues.map((issue) => {
    const location = issue.path.length > 0 ? ` at ${issue.path.join('.')}` : '';
    return `${file}${location}: ${issue.message}`;
  });
}

export function validateCorpusRecords({
  evalCases,
  metadata,
}: CorpusRecords): ValidatedCorpusEntry[] {
  const errors: string[] = [];
  const entries: ValidatedCorpusEntry[] = [];
  const slugs = [...new Set([...evalCases.keys(), ...metadata.keys()])].sort();
  const scenarioIds = new Set<string>();

  if (slugs.length === 0) errors.push('Corpus contains no EvalCases');

  for (const slug of slugs) {
    const rawEvalCase = evalCases.get(slug);
    const rawMetadata = metadata.get(slug);

    if (rawEvalCase === undefined) {
      errors.push(`metadata/${slug}.json has no matching EvalCase`);
      continue;
    }
    if (rawMetadata === undefined) {
      errors.push(`eval-cases/${slug}.json has no matching metadata sidecar`);
      continue;
    }

    const evalResult = scenarioEvalCaseSchema.safeParse(rawEvalCase);
    const metadataResult = corpusMetadataSchema.safeParse(rawMetadata);

    if (!evalResult.success) {
      errors.push(
        ...formatIssues(`eval-cases/${slug}.json`, evalResult.error.issues),
      );
    }
    if (!metadataResult.success) {
      errors.push(
        ...formatIssues(`metadata/${slug}.json`, metadataResult.error.issues),
      );
    }
    if (!evalResult.success || !metadataResult.success) continue;

    const scenarioId = evalResult.data.input.id;
    if (metadataResult.data.scenarioId !== scenarioId) {
      errors.push(
        `metadata/${slug}.json references ${metadataResult.data.scenarioId}, expected ${scenarioId}`,
      );
    }
    if (scenarioIds.has(scenarioId)) {
      errors.push(`Duplicate corpus Scenario ID: ${scenarioId}`);
    }
    scenarioIds.add(scenarioId);

    entries.push({
      slug,
      evalCase: evalResult.data,
      metadata: metadataResult.data,
    });
  }

  if (errors.length > 0) {
    throw new Error(`Corpus validation failed:\n- ${errors.join('\n- ')}`);
  }

  return entries;
}

async function readJsonDirectory(
  directory: string,
): Promise<Map<string, unknown>> {
  const records = new Map<string, unknown>();
  const directoryEntries = await readdir(directory, { withFileTypes: true });

  for (const entry of directoryEntries) {
    if (!entry.isFile() || path.extname(entry.name) !== '.json') continue;

    const slug = path.basename(entry.name, '.json');
    const contents = await readFile(path.join(directory, entry.name), 'utf8');
    records.set(slug, JSON.parse(contents));
  }

  return records;
}

export async function validateCorpusDirectory(
  corpusDirectory: string,
): Promise<ValidatedCorpusEntry[]> {
  const [evalCases, metadata] = await Promise.all([
    readJsonDirectory(path.join(corpusDirectory, 'eval-cases')),
    readJsonDirectory(path.join(corpusDirectory, 'metadata')),
  ]);

  return validateCorpusRecords({ evalCases, metadata });
}
