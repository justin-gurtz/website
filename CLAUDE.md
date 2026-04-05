# Development

- Use `vercel dev` instead of `pnpm dev` — env vars are managed through Vercel and are not available locally
- `pnpm build` will fail locally due to missing env vars; rely on Vercel for builds
