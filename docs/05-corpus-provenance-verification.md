# Corpus, Provenance, And Verification

## Authoritative Sources

Official World Sailing material is authoritative for rules content:

- Racing Rules of Sailing
- definitions
- official cases
- interpretations
- relevant appendices
- Appendix E for radio sailing

Other material may help discovery:

- club training material
- race incident examples
- community explanations
- competitor apps
- images, diagrams, sketches, videos

Secondary material must not override official sources.

## Corpus Pipeline

Use this lifecycle:

1. raw source
2. extracted draft
3. normalized scenario
4. agent-reviewed scenario
5. human-verified scenario
6. canonical scenario, if accepted for trusted use

Release 1 can include unverified development fixtures, but the UI and docs must not imply they are human-verified canonical scenarios.

## Provenance Is Required

Every scenario needs source metadata:

```ts
type Provenance = {
  sourceId: string
  sourceType:
    | "world_sailing_rule"
    | "world_sailing_case"
    | "official_interpretation"
    | "club_training"
    | "competitor_reference"
    | "user_report"
    | "image"
    | "video"
    | "other"
  title?: string
  publisher?: string
  url?: string
  documentVersion?: string
  publicationDate?: string
  accessedAt?: string
  pageOrSection?: string
  extractionMethod:
    | "manual"
    | "agent_assisted"
    | "ocr"
    | "image_reconstruction"
    | "video_reconstruction"
  notes?: string
}
```

## Verification Is Separate

A scenario can come from an official source and still have an unverified MarkRoom transcription.

Use a separate verification record:

```ts
type Verification = {
  status: "unverified" | "agent-reviewed" | "human-verified"
  verifiedBy?: string
  verifiedAt?: string
  notes?: string
}
```

## Licensing Guardrails

Application code should be Apache-2.0.

Corpus licensing is separate:

- do not copy large portions of copyrighted source text without permission or a documented basis
- link to authoritative originals where possible
- store factual normalized data separately from copied source material
- preserve enough reference detail to audit the scenario
- investigate World Sailing licensing before committing substantial official text or reproduced diagrams

## Quality Principle

MarkRoom should do better than visually polished but inaccurate scenario libraries. Correctness, provenance, and verification are part of the product, not internal chores.
