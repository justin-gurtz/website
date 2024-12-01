export interface SpotifyMusic {
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

export interface StravaActivity {
  id: number
  type: string
  name: string
  start_date: string
  start_latlng: [number, number]
  distance: number
  moving_time: number
  map: {
    summary_polyline: string
  }
}
