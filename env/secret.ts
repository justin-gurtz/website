import { z } from "zod";

const schema = z.object({
  BIRTH_DATE: z.string().min(1),
  CRON_PRESHARED_KEY: z.string().min(1),
  INSTAGRAM_ACCESS_TOKEN: z.string().min(1),
  INSTAGRAM_PAGE_ID: z.string().min(1),
  GARMIN_PASSWORD: z.string().min(1),
  GARMIN_USERNAME: z.string().min(1),
  GARMIN_TOKEN_ENCRYPTION_KEY: z.string().min(1),
  GITHUB_ACCESS_TOKEN: z.string().min(1),
  NYTIMES_PRESHARED_KEY: z.string().min(1),
  SPOTIFY_CLIENT_ID: z.string().min(1),
  SPOTIFY_CLIENT_SECRET: z.string().min(1),
  SPOTIFY_REFRESH_TOKEN: z.string().min(1),
  STRAVA_CLIENT_ID: z.string().min(1),
  STRAVA_CLIENT_SECRET: z.string().min(1),
  STRAVA_REFERSH_TOKEN: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export const {
  BIRTH_DATE,
  CRON_PRESHARED_KEY,
  INSTAGRAM_ACCESS_TOKEN,
  INSTAGRAM_PAGE_ID,
  GARMIN_PASSWORD,
  GARMIN_USERNAME,
  GARMIN_TOKEN_ENCRYPTION_KEY,
  GITHUB_ACCESS_TOKEN,
  NYTIMES_PRESHARED_KEY,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REFRESH_TOKEN,
  STRAVA_CLIENT_ID,
  STRAVA_CLIENT_SECRET,
  STRAVA_REFERSH_TOKEN,
  SUPABASE_SERVICE_ROLE_KEY,
} = schema.parse(process.env);
