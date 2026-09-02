# Initial Non-Goals

These are deliberately out of scope for the first milestones.

## No Native Apps

Build responsive web first. Native iOS and Android apps are deferred until the web app proves insufficient.

## No Authentication

Release 1 should work anonymously. Add auth only when a concrete feature needs it, such as cross-device progress, saved cloud scenarios, sharing ownership, or payments.

## No Runtime Database Initially

Canonical corpus data lives in Git as validated files. Browser storage can hold anonymous local progress and drafts.

Postgres can be introduced later when it solves a real persistence or retrieval problem.

## No Payments Or Monetization Plumbing

Do not design around subscriptions, checkout, pricing, or account entitlements yet. Preserve the option for a commercial hosted product later.

## No Full Offline Mode

Internet connection required is acceptable initially. Do not add service workers, cache invalidation, offline synchronization, or offline AI for Release 1.

Avoid architecture that would make offline support impossible later.

## No Open-Ended AI Rulings In Release 1

Release 1 should not require an LLM for the basic experience. Quizzes over known scenarios should score deterministically.

Deterministic analysis arrives after the three domain models, corpus boundaries,
and editor are proven. AI assistance may later support input, retrieval, and
explanation, but it does not replace either deterministic transform.

## No Broad RRS Coverage In Release 1

The first product focuses on core boat-on-boat rules, dependent definitions, relevant Appendix E modifications, and enough surrounding rules to explain selected scenarios.

Schema discovery must still sample broadly.

## No Mixed Hull Lengths Initially

All boats initially share one standard hull size. Scenario geometry is measured
in that common hull length, and each rendered hull is exactly one Scenario unit
long. Mixed fleets and per-boat scaling are deferred until a concrete use case
justifies the additional schema and geometry complexity.
