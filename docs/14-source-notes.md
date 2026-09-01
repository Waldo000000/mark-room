# Source Notes

These notes capture time-sensitive technical facts checked while creating the planning pack.

## Framework Versions

As of 2026-09-01:

- Next.js 16 is Active LTS, and Next.js 15 is Maintenance LTS.
- Node.js 24 is the latest LTS line, and Node.js 26 is Current.

Planning implication:

- the original conversation mentioned Next.js 15, but a fresh repo should prefer the current Active LTS line at initialization unless there is a concrete compatibility reason to stay on 15
- use Node 24 for local development, CI, and Vercel
- keep the version in `.nvmrc` and make CI consume that file

## References

- Next.js support policy: https://nextjs.org/support-policy
- Next.js release notes/blog: https://nextjs.org/blog
- Node.js release schedule: https://github.com/nodejs/release
- Node.js releases page: https://nodejs.org/en/about/previous-releases

## Sailing Diagram Convention

Reviewed the World Sailing Call Book for Radio Sailing diagrams on 2026-08-31.
They consistently use narrow rounded plan-view hulls and sails offset from the
hull centreline; the preface states that wind is from the top unless indicated
otherwise. MarkRoom follows that visual grammar with original SVG geometry and
does not reproduce an official diagram.

- World Sailing Call Book for Radio Sailing:
  https://www.sailing.org/document/2021-2024-call-book-for-radio-sailing/
