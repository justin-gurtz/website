import { validatePresharedKey } from '@/utils/server'
import {
  STRAVA_CLIENT_ID,
  STRAVA_CLIENT_SECRET,
  STRAVA_REFERSH_TOKEN,
  SUPABASE_SERVICE_ROLE_KEY,
} from '@/env/secret'
import { Database } from '@/types/database'
import { createClient } from '@supabase/supabase-js'
import { NEXT_PUBLIC_SUPABASE_URL } from '@/env/public'
import map from 'lodash/map'
import { StravaActivity } from '@/types/models'

// eslint-disable-next-line import/prefer-default-export
export async function POST() {
  await validatePresharedKey()

  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: STRAVA_REFERSH_TOKEN,
      grant_type: 'refresh_token',
    }),
  })

  const { access_token: accessToken } = await tokenRes.json()

  if (!accessToken) {
    throw new Error('No Strava access token')
  }

  const activitiesRes = await fetch(
    'https://www.strava.com/api/v3/athlete/activities',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  const activities = await activitiesRes.json()

  if (activities.errors) {
    throw new Error('Strava API error')
  }

  const supabase = await createClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  )

  const data = map(activities, (activity: StravaActivity) => ({
    id: activity.id,
    type: activity.type,
    start_date: activity.start_date,
    payload: activity,
  }))

  const { error } = await supabase.from('strava').upsert(data)

  if (error) {
    throw new Error(error.message)
  }

  return new Response(null, {
    status: 204,
  })
}
