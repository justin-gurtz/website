import { Database } from '@/types/database'

export type Movement = Database['public']['Tables']['movements']['Row']

export type SpotifyMusic = {
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

export type StravaActivity = {
  id: number
  type: string
  name: string
  start_date: string
  start_latlng: [number, number]
  distance: number
  moving_time: number
  elapsed_time: number
  visibility: string
  map: {
    summary_polyline: string
  }
}

export type GitContributionLevel =
  | 'NONE'
  | 'FIRST_QUARTILE'
  | 'SECOND_QUARTILE'
  | 'THIRD_QUARTILE'
  | 'FOURTH_QUARTILE'

export type GitHubData = {
  viewer: {
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: number
        weeks: {
          contributionDays: {
            weekday: number
            date: string
            contributionCount: number
            contributionLevel: GitContributionLevel
          }[]
        }[]
      }
    }
  }
}
