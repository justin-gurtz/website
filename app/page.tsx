import filter from 'lodash/filter'
import Strava from '@/components/strava'
import {
  GITHUB_ACCESS_TOKEN,
  STRAVA_CLIENT_ID,
  STRAVA_CLIENT_SECRET,
  STRAVA_REFERSH_TOKEN,
  SUPABASE_SERVICE_ROLE_KEY,
} from '@/env/secret'
import Spotify from '@/components/spotify'
import Header from '@/components/header'
import { NEXT_PUBLIC_SUPABASE_URL } from '@/env/public'
import { Database } from '@/types/database'
import { createClient } from '@supabase/supabase-js'
import { request } from 'graphql-request'
import { GitHubData } from '@/types/models'
import GitHub from '@/components/github'
import Refresh from '@/components/refresh'

export const revalidate = 60

const getLocation = async () => {
  const supabase = await createClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabase
    .from('movements')
    .select('moved_at,city,region,country,time_zone_id')
    .eq('vercel_env', 'production')
    .order('moved_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

const getNowPlaying = async () => {
  const supabase = await createClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabase
    .from('now_playing')
    .select('created_at,image,name,artists')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

const getGitHub = async () => {
  const query = `
    query {
      viewer {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                weekday
                date
                contributionCount
                contributionLevel
              }
            }
          }
        }
      }
    }
  `

  const data = await request<GitHubData>(
    'https://api.github.com/graphql',
    query,
    undefined,
    {
      Authorization: `Bearer ${GITHUB_ACCESS_TOKEN}`,
    }
  )

  return data
}

const getStrava = async () => {
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

  const runsRes = await fetch(
    'https://www.strava.com/api/v3/athlete/activities',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  const runs = await runsRes.json()

  if (runs.errors) {
    throw new Error('Strava API error')
  }

  return filter(runs, (run: { type: string }) => run.type === 'Run')
}

const Page = async () => {
  const location = await getLocation()
  const nowPlaying = await getNowPlaying()
  const activities = await getStrava()
  const contributions = await getGitHub()

  return (
    <>
      <div className="flex flex-col gap-20 justify-center min-h-svh px-5 py-10 sm:px-10 sm:py-20 max-w-screen-sm m-auto">
        <Header location={location} />
        <div className="flex flex-col gap-3">
          {nowPlaying && (
            <div className="self-end">
              <Spotify nowPlaying={nowPlaying} />
            </div>
          )}
          <GitHub contributions={contributions} />
          <Strava activities={activities} />
        </div>
      </div>
      <Refresh every={15} />
    </>
  )
}

export default Page
