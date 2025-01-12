import Strava from '@/components/strava'
import { GITHUB_ACCESS_TOKEN, SUPABASE_SERVICE_ROLE_KEY } from '@/env/secret'
import Spotify from '@/components/spotify'
import Header from '@/components/header'
import { NEXT_PUBLIC_SUPABASE_URL } from '@/env/public'
import { Database } from '@/types/database'
import { SupabaseClient, createClient } from '@supabase/supabase-js'
import { request } from 'graphql-request'
import { GitHubData, StravaActivity } from '@/types/models'
import GitHub from '@/components/github'
import Refresh from '@/components/refresh'
import Duolingo from '@/components/duolingo'
import Duo from 'duo-wrapper'
import map from 'lodash/map'
import { subYears } from 'date-fns'

export const revalidate = 60

const getLocation = async (supabase: SupabaseClient<Database>) => {
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

const getNowPlaying = async (supabase: SupabaseClient<Database>) => {
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

const getDuolingo = async () => {
  const duo = new Duo('JustinGurtz')

  const streak = await duo.getStreak()
  const courses = await duo.getCourses()

  return { streak, courses }
}

const getStrava = async (supabase: SupabaseClient<Database>) => {
  const oneYearAgo = subYears(new Date(), 1)

  // eslint-disable-next-line lodash/prefer-lodash-method
  const { data, error } = await supabase
    .from('strava')
    .select('payload')
    .filter('type', 'eq', 'Run')
    .filter('start_date', 'gte', oneYearAgo.toISOString())
    .order('start_date', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return map(data, ({ payload }) => payload) as StravaActivity[]
}

const Page = async () => {
  const supabase = await createClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  )

  const location = await getLocation(supabase)
  const nowPlaying = await getNowPlaying(supabase)
  const activities = await getStrava(supabase)
  const contributions = await getGitHub()
  const learning = await getDuolingo()

  return (
    <>
      <div className="flex flex-col gap-20 justify-center min-h-svh p-5 sm:p-10 md:p-16 lg:p-20 max-w-2xl lg:max-w-5xl mx-auto">
        <Header location={location} />
        <div className="flex flex-col gap-3">
          {nowPlaying && (
            <div className="self-end">
              <Spotify nowPlaying={nowPlaying} />
            </div>
          )}
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="w-full flex flex-col gap-3">
              <GitHub contributions={contributions} />
              <Duolingo learning={learning} />
            </div>
            <div className="w-full">
              <Strava activities={activities} />
            </div>
          </div>
        </div>
      </div>
      <Refresh every={15} />
    </>
  )
}

export default Page
