# Repository

- This repo is PUBLIC on GitHub — never commit secrets, tokens, or personal data; assume all code, comments, and commit messages are world-readable

# Development

- Use `vercel dev` instead of `pnpm dev` — env vars are managed through Vercel and are not available locally
- `pnpm build` will fail locally due to missing env vars; rely on Vercel for builds

# Supabase

- Project ref `hujtabpmatewssuxcrou` (the host of `NEXT_PUBLIC_SUPABASE_URL`, not a secret). Operate it with the Supabase CLI — see the global `CLAUDE.md`
- Regenerate `types/database.ts` after schema changes: `supabase gen types --lang=typescript --project-id hujtabpmatewssuxcrou --schema public > types/database.ts` (Biome reformats it on commit). `types/camel-case.ts` derives the camelCase view from it; don't edit either by hand
- Cron jobs (`cron.job`) and triggers (e.g. `revalidate_website` on `movements`) live only in the database, not in this repo; their bearer keys are inline in the SQL
- The project is on the Free plan's Nano instance (Postgres 14, 224 MB `shared_buffers`, 500 MB database cap). The "grace period is over" banner in the dashboard is permanent noise; the database-size cap is the real limit
- Cron schedule: `POST spotify` every minute; strava/duolingo/github/garmin every 15 min (all fire together on :00/:15/:30/:45); instagram hourly; `POST revalidate` at :01. Avoid scheduling anything heavy on those minutes
- `cleanup cron logs` (job 31, daily 03:07 UTC) deletes `cron.job_run_details` rows older than 7 days. Without it the table grows ~20 MB/month. Keep it delete-only: `VACUUM FULL` there takes an exclusive lock that stalls pg_cron, so jobs skip and then fire all at once. `net._http_response` needs no cleanup (pg_net expires rows after 3 days)
- Failure signature when the Nano instance is throttled (disk IO budget exhausted or a Supabase incident): Sentry shows `Gateway Timeout` errors thrown at the first Supabase read in `/api/*` routes (a 504 from PostgREST, not from the upstream service), plus "Consecutive HTTP" performance issues on every cron route. The code is fine; check status.supabase.com, then restart the project from Dashboard > Project Settings > General (no CLI restart exists). Sep 2026: this plus 250 MB of bloat in the cron/pg_net log tables pushed the database to the 500 MB cap; fixed with a restart, a one-off `VACUUM FULL` on those two tables, and job 31
