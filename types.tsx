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
