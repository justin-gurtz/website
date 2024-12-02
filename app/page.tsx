import filter from 'lodash/filter'
import Strava from '@/components/strava'
import {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REFRESH_TOKEN,
  STRAVA_CLIENT_ID,
  STRAVA_CLIENT_SECRET,
  STRAVA_REFERSH_TOKEN,
} from '@/env/secret'
import Spotify from '@/components/spotify'

export const revalidate = 60

const getSpotify = async () => {
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  })

  const { access_token: accessToken } = await tokenRes.json()

  if (!accessToken) {
    throw new Error('No Spotify access token')
  }

  const musicRes = await fetch(
    'https://api.spotify.com/v1/me/player/currently-playing',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!musicRes.ok) {
    throw new Error('Spotify music request failed')
  }

  try {
    const music = await musicRes.json()

    return music
  } catch (_) {
    return null
  }
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
  const music = await getSpotify()
  const activities = await getStrava()

  return (
    <div className="flex flex-col justify-center min-h-svh px-5 py-10 sm:px-10 sm:py-20 max-w-screen-sm m-auto gap-5">
      <h1 className="text-3xl font-semibold">Justin Gurtz</h1>
      <div className="self-end">
        <Spotify music={music} />
      </div>
      <Strava activities={activities} />
    </div>
  )
}

export default Page
