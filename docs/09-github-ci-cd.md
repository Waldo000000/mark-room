# GitHub, CI, And Deployment

## Repository

Use a public GitHub repo named `mark-room`.

Protect `main`:

- require pull requests
- require CI checks
- require human approval except for explicitly authorized "I'm Feeling Lucky"
  runs merging their own green pull requests
- prevent direct pushes where possible

## CI Checks

Initial CI should run:

- dependency install
- project consistency check
- lint
- type check
- unit tests
- production build
- Playwright browser tests

Corpus validation should be added in MR-003, when the corpus exists. CI should
not pretend to validate unavailable behavior.

## Vercel

Use Vercel for deployment:

- production deployment from `main`
- preview deployment for each pull request
- environment variables managed through Vercel

For the current skeleton, import the GitHub repository into Vercel with the
default root directory:

- framework preset: `Next.js`
- Node.js version: `24.x`
- install command: `npm ci`
- build command: `npm run build`

The framework preset is also committed as `"framework": "nextjs"` in
`vercel.json`. This prevents a newly linked Vercel project from falling back to
the `Other` preset that previously produced a production 404.

The production URL may be public during alpha, but the app should clearly represent the maturity and verification status of its content.

## Environment Variables

No OpenAI API key is needed for Release 1 if the basic product avoids LLM dependency.

When AI features are introduced:

- store provider keys in Vercel and local `.env.local`
- keep `.env.local` out of Git
- expose only server-side APIs to the browser

## Suggested GitHub Files

Include:

- `.github/pull_request_template.md`
- issue templates for feature, bug, corpus item, and ADR request
- CI workflow once the app scaffold exists

## Release Discipline

Every release should have:

- version or date tag
- changelog entry
- known limitations
- verification/corpus status summary
- deployment URL
