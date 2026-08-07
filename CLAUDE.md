# Repository

- This repo is PUBLIC on GitHub — never commit secrets, tokens, or personal data; assume all code, comments, and commit messages are world-readable

# Development

- Use `vercel dev` instead of `pnpm dev` — env vars are managed through Vercel and are not available locally
- `pnpm build` will fail locally due to missing env vars; rely on Vercel for builds
