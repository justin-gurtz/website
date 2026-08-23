# Repository

- This repo is PUBLIC on GitHub — never commit secrets, tokens, or personal data; assume all code, comments, and commit messages are world-readable

# Development

- Use `vercel dev` instead of `pnpm dev` — env vars are managed through Vercel and are not available locally
- `pnpm build` will fail locally due to missing env vars; rely on Vercel for builds

# Supabase

- Project ref `hujtabpmatewssuxcrou` (the host of `NEXT_PUBLIC_SUPABASE_URL`, not a secret). Operate it with the Supabase CLI — see the global `CLAUDE.md`
- Regenerate `types/database.ts` after schema changes: `supabase gen types --lang=typescript --project-id hujtabpmatewssuxcrou --schema public > types/database.ts` (Biome reformats it on commit). `types/camel-case.ts` derives the camelCase view from it; don't edit either by hand
- Cron jobs (`cron.job`) and triggers (e.g. `revalidate_website` on `movements`) live only in the database, not in this repo; their bearer keys are inline in the SQL
