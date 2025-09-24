CONSTRAINTS:
- Package manager: pnpm only. Build with: pnpm install --frozen-lockfile && pnpm build
- Typescript: strict. No next.config “ignoreBuildErrors”.
- Node 20.x. Next runtime: 'nodejs' for server routes that use fs/crypto; never edge for those.
- Do NOT read from ./private/** at runtime or build. Certs live in Vercel Blob only.
- No global css changes. Widgets scoped under .wp-root with CSS vars.
- The single source of truth for sections is SECTION_REGISTRY (exported with `as const`).
- Derive `SectionKey = keyof typeof SECTION_REGISTRY`. Do not hardcode unions.
ACCEPTANCE TESTS:
- `pnpm typecheck` passes
- `pnpm dlx vercel build --prod` passes locally
- No new ESLint errors
OUTPUT FORMAT:
- Unified patch diffs only, per file, nothing else.
- If changing types, show the exact exported types and where they’re imported.
