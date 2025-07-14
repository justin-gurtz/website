import LazyStrava from '@/components/lazy-strava'
import { SUPABASE_SERVICE_ROLE_KEY } from '@/env/secret'
import Spotify from '@/components/spotify'
import Header from '@/components/header'
import { NEXT_PUBLIC_SUPABASE_URL } from '@/env/public'
import { Database } from '@/types/database'
import { SupabaseClient, createClient } from '@supabase/supabase-js'
import {
  DuolingoLearning,
  GitHubContributions,
  StravaActivity,
} from '@/types/models'
import GitHub from '@/components/github'
import Refresh from '@/components/refresh'
import LazyDuolingo from '@/components/lazy-duolingo'
import { map } from '@/utils/lodash-replacements'
import { subYears } from 'date-fns'
import Footer from '@/components/footer'

export const revalidate = 60

const getLocation = async (supabase: SupabaseClient<Database>) => {
  const { data, error } = await supabase
    .from('movements')
    .select('moved_at,city,region,country,time_zone_id')
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
    .select('created_at,image,name,by')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

const getGitHub = async (supabase: SupabaseClient<Database>) => {
  const { data, error } = await supabase
    .from('github')
    .select('contributions')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data.contributions as GitHubContributions
}

const getDuolingo = async (supabase: SupabaseClient<Database>) => {
  const { data, error } = await supabase
    .from('duolingo')
    .select('streak,courses')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as DuolingoLearning
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
  const contributions = await getGitHub(supabase)
  const learning = await getDuolingo(supabase)

  return (
    <>
      <div className="min-h-svh flex items-center justify-center p-5 sm:p-10">
        <div className="shrink-0 flex flex-col gap-3 w-full max-w-md lg:max-w-4xl">
          <div className="flex flex-col lg:flex-row gap-20 lg:gap-3 items-start justify-between">
            <Header location={location} />
            <div className="self-end">
              <Spotify nowPlaying={nowPlaying} />
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row-reverse">
            <div className="w-full">
              <LazyStrava activities={activities} />
            </div>
            <div className="w-full flex flex-col gap-20 lg:gap-3">
              <div className="flex flex-col gap-3">
                <GitHub contributions={contributions} />
                <LazyDuolingo learning={learning} />
              </div>
              <div className="flex-1 flex items-end">
                <Footer />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Refresh every={15} />
    </>
  )
}

export default Page
