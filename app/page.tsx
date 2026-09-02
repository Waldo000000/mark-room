import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-12">
        <p className="text-sm font-semibold uppercase text-muted-foreground">
          MarkRoom
        </p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">
          Racing rules scenarios, carefully built.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          MarkRoom is a mobile-first learning app for the Racing Rules of
          Sailing. The first scenario slice is now live; the full viewer,
          corpus, and quizzes will appear here as they become verified product
          slices.
        </p>

        <section className="mt-10 border-y border-border py-6">
          <p className="text-sm font-semibold">Available now</p>
          <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Inspect a port/starboard crossing rendered from validated,
              provenance-aware scenario data.
            </p>
            <Link
              href="/scenarios"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Browse scenarios
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
