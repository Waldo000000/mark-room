const nextSteps = [
  'Define the first scenario JSON schema and validation command.',
  'Add one provenance-aware demo scenario from inspectable source notes.',
  'Build the first real SVG scenario viewer from that data.',
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-12">
        <p className="text-sm font-semibold uppercase text-muted-foreground">
          MarkRoom
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Racing rules scenarios, carefully built.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          MarkRoom is a mobile-first learning app for the Racing Rules of
          Sailing. The app scaffold is live; the scenario viewer, corpus, and
          quizzes will appear here as they become verified product slices.
        </p>

        <div className="mt-10 rounded-lg border border-border bg-card p-5">
          <h2 className="text-base font-semibold">Coming next</h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            {nextSteps.map((step) => (
              <li key={step} className="flex gap-3">
                <span className="mt-2 block size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
