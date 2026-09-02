# Corpus, Provenance, And Verification

## Authoritative Sources

Official World Sailing material is authoritative for rules content: the Racing
Rules of Sailing, definitions, official cases, interpretations, relevant
appendices, and Appendix E for radio sailing.

Club material, race incidents, community explanations, competitors, images,
sketches, and videos may help discovery but do not override official sources.

## Corpus Shape

Scenario eval files contain only domain input and expected output:

```ts
type ScenarioEvalCase = {
  input: Scenario;
  expected: {
    situation: Situation;
    ruling: Ruling;
  };
};
```

This shape keeps teaching, source tracking, and review status out of the domain
pipeline. Required sidecar metadata is keyed by `scenarioId`:

```ts
type CorpusMetadata = {
  scenarioId: string;
  teachingText?: string;
  provenance: Provenance[];
  verification: Verification;
};
```

Corpus validation requires exactly one metadata sidecar for every eval and no
orphan metadata. The deployed viewer may compose them for presentation without
making metadata part of Scenario, Situation, or Ruling.

## Corpus Pipeline

Use this lifecycle:

1. raw source
2. extracted draft
3. normalized Scenario plus expected Situation and Ruling
4. agent-reviewed transcription
5. human-verified transcription
6. canonical eval, if accepted for trusted use

Release 1 can include unverified development evals, but the UI and docs must not
imply that they are human-verified canonical records.

## Provenance Is Required

Every eval needs source metadata:

```ts
type Provenance = {
  sourceId: string;
  sourceType:
    | 'world_sailing_rule'
    | 'world_sailing_case'
    | 'official_interpretation'
    | 'club_training'
    | 'competitor_reference'
    | 'user_report'
    | 'image'
    | 'video'
    | 'other';
  title?: string;
  publisher?: string;
  url?: string;
  documentVersion?: string;
  publicationDate?: string;
  accessedAt?: string;
  pageOrSection?: string;
  extractionMethod:
    | 'manual'
    | 'agent_assisted'
    | 'ocr'
    | 'image_reconstruction'
    | 'video_reconstruction';
  notes?: string;
};
```

## Verification Is Separate

An official source can still have an unverified MarkRoom Scenario, Situation,
or Ruling transcription. Reviewed records require reviewer identity and time;
unverified records must not imply either:

```ts
type Verification =
  | { status: 'unverified'; notes?: string }
  | {
      status: 'agent-reviewed' | 'human-verified';
      verifiedBy: string;
      verifiedAt: string;
      notes?: string;
    };
```

## Licensing Guardrails

Application code should be Apache-2.0. Corpus licensing is separate:

- do not copy large portions of copyrighted source text without permission or a
  documented basis
- link to authoritative originals where possible
- store factual normalized data separately from copied source material
- preserve enough reference detail to audit every expected output
- investigate World Sailing licensing before committing substantial official
  text or reproduced diagrams

Correctness, provenance, and verification are part of the product, not internal
chores.
