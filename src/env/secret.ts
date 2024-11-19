import { z } from 'zod'

const schema = z.object({
  STRAVA_CLIENT_ID: z.string().min(1),
  STRAVA_CLIENT_SECRET: z.string().min(1),
  STRAVA_REFERSH_TOKEN: z.string().min(1),
})

export const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFERSH_TOKEN } =
  schema.parse(process.env)
