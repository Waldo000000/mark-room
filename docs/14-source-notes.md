# Source Notes

These notes capture time-sensitive technical facts checked while creating the planning pack.

## Framework Versions

As of 2026-08-30:

- Next.js 16 is Active LTS, and Next.js 15 is Maintenance LTS.
- Node.js 24 is Active LTS, and Node.js 26 is Current.

Planning implication:

- the original conversation mentioned Next.js 15, but a fresh repo should prefer the current Active LTS line at initialization unless there is a concrete compatibility reason to stay on 15
- use Node Active LTS for local development and CI

## References

- Next.js support policy: https://nextjs.org/support-policy
- Next.js release notes/blog: https://nextjs.org/blog
- Node.js release schedule: https://github.com/nodejs/release
- Node.js releases page: https://nodejs.org/en/about/previous-releases

