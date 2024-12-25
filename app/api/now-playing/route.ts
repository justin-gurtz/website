import { NEXT_PUBLIC_SUPABASE_URL } from '@/env/public'
import {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REFRESH_TOKEN,
  SUPABASE_SERVICE_ROLE_KEY,
} from '@/env/secret'
import { Database } from '@/types/database'
import { validatePresharedKey } from '@/utils/server'
import { createClient } from '@supabase/supabase-js'
import { backOff } from 'exponential-backoff'
import map from 'lodash/map'
import reduce from 'lodash/reduce'

type SpotifyCurrentlyPlaying = {
  is_playing: boolean
  item: {
    id: string
    name: string
    artists: {
      id: string
      name: string
    }[]
    album: {
      id: string
      name: string
      images: {
        height: number
        url: string
        width: number
      }[]
    }
  }
}

const getBestImage = (
  images: SpotifyCurrentlyPlaying['item']['album']['images'] | undefined
) => {
  if (!images) return undefined

  const largestImage = reduce(
    images,
    (largest, image) => {
      return image.width > largest.width ? image : largest
    },
    images[0]
  )

  return reduce(
    images,
    (smallest, image) => {
      // Ideally 2x container size
      if (image.width >= 320 && image.height >= 320) {
        return image.width < smallest.width ? image : smallest
      }
      return smallest
    },
    largestImage
  )
}

// eslint-disable-next-line import/prefer-default-export
export async function POST() {
  await validatePresharedKey()

  const tokenRes = await backOff(() =>
    fetch('https://accounts.spotify.com/api/token', {
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
  )

  const { access_token: accessToken } = await tokenRes.json()

  if (!accessToken) {
    throw new Error('No Spotify access token')
  }

  const currentlyPlayingRes = await backOff(() =>
    fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  )

  if (!currentlyPlayingRes.ok) {
    throw new Error('Spotify currently playing request failed')
  }

  try {
    const music: SpotifyCurrentlyPlaying = await currentlyPlayingRes.json()

    const { is_playing: isPlaying, item } = music

    if (isPlaying && item) {
      const supabase = await createClient<Database>(
        NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY
      )

      const image = getBestImage(item.album.images)

      await supabase.from('now_playing').insert({
        image: image?.url,
        name: item.name,
        artists: map(item.artists, (artist) => artist.name),
        payload: music,
      })
    }
  } catch (_) {
    // No music playing
  }

  return new Response(null, {
    status: 204,
  })
}
