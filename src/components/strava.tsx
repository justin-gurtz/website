'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import polyline from '@mapbox/polyline'
import * as turf from '@turf/turf'
import Link from '@/components/link'
import { StravaActivity } from '@/types/models'
import { cn } from '@/utils/tailwind'
import { Icon, IconRun } from '@tabler/icons-react'
import map from 'lodash/map'
import filter from 'lodash/filter'
import padStart from 'lodash/padStart'
import reduce from 'lodash/reduce'
import forEach from 'lodash/forEach'
import includes from 'lodash/includes'
import keys from 'lodash/keys'
import startsWith from 'lodash/startsWith'
import { NEXT_PUBLIC_MAPBOX_MAPS_ACCESS_TOKEN } from '@/env/public'
import isEqual from 'lodash/isEqual'
import join from 'lodash/join'
import slice from 'lodash/slice'

mapboxgl.accessToken = NEXT_PUBLIC_MAPBOX_MAPS_ACCESS_TOKEN

const href = 'https://www.strava.com/athletes/gurtz'

const nycPoint = turf.point([-73.97, 40.725])

const colorScale = map(
  [
    '#0000FF', // blue
    '#8000FF', // purple
    '#FF00FF', // magenta
    '#FF0080', // pink
    '#FF0000', // red
    '#FF8000', // orange
    '#FFFF00', // yellow
  ],
  (color, index, array) => ({
    color,
    position: index / (array.length - 1),
    index,
  })
)

const padded = (value: number, radix?: number) =>
  padStart(value.toString(radix), 2, '0')

const interpolateColor = (color1: string, color2: string, factor: number) => {
  const r1 = parseInt(color1.substring(1, 3), 16)
  const g1 = parseInt(color1.substring(3, 5), 16)
  const b1 = parseInt(color1.substring(5, 7), 16)
  const r2 = parseInt(color2.substring(1, 3), 16)
  const g2 = parseInt(color2.substring(3, 5), 16)
  const b2 = parseInt(color2.substring(5, 7), 16)

  const r = Math.round(r1 + factor * (r2 - r1))
  const g = Math.round(g1 + factor * (g2 - g1))
  const b = Math.round(b1 + factor * (b2 - b1))

  return `#${padded(r, 16)}${padded(g, 16)}${padded(b, 16)}`
}

const getColorForRun = (position: number, totalRuns: number) => {
  const normalizedPosition = position / (totalRuns - 1)
  let { color } = colorScale[colorScale.length - 1]

  forEach(colorScale, (scale) => {
    const i = scale.index

    if (i > 0 && normalizedPosition <= colorScale[i].position) {
      const t =
        (normalizedPosition - colorScale[i - 1].position) /
        (colorScale[i].position - colorScale[i - 1].position)
      color = interpolateColor(colorScale[i - 1].color, colorScale[i].color, t)

      return false
    }

    return true
  })

  return color
}

const getComponents = (seconds: number) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  return { days, hours, minutes }
}

const StravaLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 432 91"
    className={className}
  >
    <path
      fill="#FC4C02"
      d="M74.5 49.5c1.6 2.8 2.5 6.3 2.5 10.4v0.2c0 4.2-0.8 8-2.5 11.4 -1.7 3.4-4.1 6.2-7.1 8.6 -3.1 2.3-6.8 4.1-11.2 5.4 -4.4 1.3-9.3 1.9-14.7 1.9 -8.2 0-15.9-1.1-23-3.4 -7.1-2.3-13.2-5.7-18.3-10.2l14.4-17.1c4.4 3.4 9 5.8 13.8 7.2 4.8 1.5 9.6 2.2 14.4 2.2 2.5 0 4.2-0.3 5.3-0.9 1.1-0.6 1.6-1.5 1.6-2.5v-0.2c0-1.2-0.8-2.1-2.4-2.9 -1.6-0.8-4.5-1.6-8.8-2.4 -4.5-0.9-8.8-2-12.9-3.2 -4.1-1.2-7.7-2.8-10.8-4.7 -3.1-1.9-5.6-4.3-7.4-7.2C5.4 39 4.5 35.4 4.5 31.2V31c0-3.8 0.7-7.4 2.2-10.7 1.5-3.3 3.7-6.2 6.6-8.6 2.9-2.5 6.5-4.4 10.7-5.8 4.2-1.4 9.1-2.1 14.7-2.1 7.8 0 14.7 0.9 20.5 2.8 5.9 1.8 11.1 4.6 15.8 8.3L61.9 33c-3.8-2.8-7.9-4.8-12.1-6.1 -4.3-1.3-8.3-1.9-12-1.9 -2 0-3.5 0.3-4.4 0.9 -1 0.6-1.4 1.4-1.4 2.4v0.2c0 1.1 0.7 2 2.2 2.8 1.5 0.8 4.3 1.6 8.5 2.4 5.1 0.9 9.8 2 14 3.3 4.2 1.3 7.8 3 10.9 5C70.5 44.2 72.9 46.6 74.5 49.5zM75.5 28.1h23.7v57.8h26.9V28.1h23.7V5.3H75.5V28.1zM387.9 0.3l-43.3 85.6h25.8l17.5-34.6 17.6 34.6h25.8L387.9 0.3zM267.3 0.3l43.4 85.6h-25.8l-17.5-34.6 -17.5 34.6h-17.5 -8.3 -22.4l-15.2-23h-0.2 -5.5v23h-26.9V5.3H193c7.2 0 13.1 0.8 17.8 2.5 4.6 1.6 8.4 3.9 11.2 6.7 2.5 2.4 4.3 5.2 5.5 8.3 1.2 3.1 1.8 6.7 1.8 10.8v0.2c0 5.9-1.4 10.9-4.3 14.9 -2.8 4.1-6.7 7.3-11.6 9.7l14 20.4L267.3 0.3zM202.5 35.6c0-2.6-0.9-4.5-2.8-5.8 -1.8-1.3-4.3-1.9-7.5-1.9h-11.7v15.8h11.6c3.2 0 5.8-0.7 7.6-2.1 1.8-1.4 2.8-3.3 2.8-5.8V35.6zM345.2 5.3L327.6 40 310 5.3h-25.8l43.4 85.6 43.3-85.6H345.2z"
    />
  </svg>
)

const Stat = ({
  label,
  value,
  icon: OptionalIcon,
}: {
  label: string
  value: string
  icon?: Icon
}) => (
  <div
    className={cn(
      'flex flex-col gap-0 items-start',
      OptionalIcon ? 'items-end' : undefined
    )}
  >
    <p className="text-xs text-white/50 -mb-0.5">{label}</p>
    <div className="flex items-center gap-0.5">
      {OptionalIcon && (
        <OptionalIcon size={18} stroke={2.5} className="stroke-white" />
      )}
      <p className="text-md text-white font-semibold tabular-nums">{value}</p>
    </div>
  </div>
)

const Rule = () => (
  <div className="py-0.5 -mt-0.5">
    <div className="w-[1px] h-full bg-white/25" />
  </div>
)

const Strava = ({ activities }: { activities: StravaActivity[] }) => {
  const previousRuns = useRef<StravaActivity[]>([])
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapbox = useRef<mapboxgl.Map | null>(null)

  const [mapIsReady, setMapIsReady] = useState(false)
  const [hasAddedRunsToMap, setHasAddedRunsToMap] = useState(false)
  const [mapClassName, setMapClassName] = useState('opacity-0')

  const runs = useMemo(() => {
    return filter(activities, ({ visibility }) => visibility === 'everyone')
  }, [activities])

  const { distance, pace, time, totalRuns } = useMemo(() => {
    const totalDistance = reduce(runs, (acc, run) => acc + run.distance, 0)
    const totalMovingTime = reduce(runs, (acc, run) => acc + run.moving_time, 0)
    const miles = turf.convertLength(totalDistance, 'meters', 'miles')
    const avgPace = miles === 0 ? 0 : (totalMovingTime * 60) / miles

    const milesString = miles.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })

    const p = getComponents(avgPace)
    const t = getComponents(totalMovingTime)

    const leadingTStrings = [`${t.days}d`, `${t.hours}h`]
    const nonZeroTStrings = filter(leadingTStrings, (c) => !startsWith(c, '0'))
    const finalTStrings = [...nonZeroTStrings, `${t.minutes}m`]
    const slicedTStrings = slice(finalTStrings, 0, 2)

    return {
      distance: `${milesString} mi`,
      pace: `${p.hours}:${padded(p.minutes)} /mi`,
      time: join(slicedTStrings, ' '),
      totalRuns: runs.length.toString(),
    }
  }, [runs])

  useEffect(() => {
    if (!mapContainer.current) return
    if (mapbox.current) return

    mapbox.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      attributionControl: false,
      logoPosition: 'bottom-left',
      center: nycPoint.geometry.coordinates as [number, number],
      zoom: 10.5,
      interactive: false,
      dragPan: false,
      dragRotate: false,
      scrollZoom: false,
      keyboard: false,
      doubleClickZoom: false,
      touchPitch: false,
      touchZoomRotate: false,
    })

    mapbox.current.on('load', () => {
      setMapIsReady(true)
    })
  }, [])

  useEffect(() => {
    if (runs.length === 0) return
    if (!mapbox.current) return
    if (!mapIsReady) return
    if (isEqual(runs, previousRuns.current)) return

    const currentMap = mapbox.current

    const bounds = new mapboxgl.LngLatBounds()

    const newYorkRuns = filter(runs, (run) => {
      if (!run.start_latlng || run.start_latlng.length !== 2) return false

      const [startLat, startLng] = run.start_latlng

      const runPoint = turf.point([startLng, startLat])
      const radius = turf.distance(nycPoint, runPoint, { units: 'miles' })

      return radius <= 10
    })

    const runsToShow = newYorkRuns.length === 0 ? runs : newYorkRuns

    const style = currentMap.getStyle()

    if (style) {
      const runKeys = keys(style.sources)
      const runSources = filter(runKeys, (sourceId) =>
        startsWith(sourceId, 'run-source-')
      )

      forEach(runSources, (sourceId) => {
        if (currentMap.getSource(sourceId)) {
          const layers = filter(
            style.layers,
            (layer) => layer.source === sourceId
          )

          forEach(layers, (layer) => {
            if (currentMap.getLayer(layer.id)) {
              currentMap.removeLayer(layer.id)
            }
          })

          currentMap.removeSource(sourceId)
        }
      })
    }

    forEach(runsToShow, (run, index) => {
      const sourceId = `run-source-${run.id}`
      const layerId = `run-layer-${run.id}`

      const decoded = polyline.decode(run.map.summary_polyline)
      const coordinates = map(decoded, ([lat, lng]) => [lng, lat])

      forEach(coordinates, (coord) => {
        bounds.extend(coord as [number, number])
      })

      currentMap.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        },
      })

      const runColor = getColorForRun(index, runsToShow.length)

      currentMap.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': runColor,
          'line-width': 2,
        },
      })
    })

    mapbox.current.fitBounds(bounds, {
      padding: { top: 100, right: 50, bottom: 100, left: 50 },
      animate: hasAddedRunsToMap,
    })

    setHasAddedRunsToMap(true)

    previousRuns.current = runs
  }, [mapIsReady, runs, hasAddedRunsToMap])

  useEffect(() => {
    if (!mapbox.current) return
    if (!hasAddedRunsToMap) return
    if (includes(mapClassName, 'opacity-1')) return

    const bounds = mapbox.current.getBounds()

    if (bounds) {
      mapbox.current.fitBounds(bounds, {
        padding: 25,
        animate: true,
        duration: 1000,
      })
    }

    setMapClassName('opacity-1 transition-all duration-1000')
  }, [hasAddedRunsToMap, mapClassName])

  return (
    <Link href={href}>
      <div className="@container relative w-full pb-[125%] rounded-xl overflow-hidden">
        <div className="absolute w-full h-full bg-[#1f1f1f]">
          <div
            ref={mapContainer}
            className={cn(
              'absolute w-full h-full [&_.mapboxgl-ctrl]:!hidden',
              mapClassName
            )}
          />
        </div>
        <div className="absolute top-0 right-0 left-0 p-3 @sm:p-5 bg-gradient-to-b from-black/50 to-black/0 flex items-start justify-between">
          <StravaLogo className="h-4" />
          <Stat label="Past Year Runs" value={totalRuns} icon={IconRun} />
        </div>
        <div className="absolute right-0 bottom-0 left-0 p-3 @sm:p-5 bg-gradient-to-t from-black/50 to-black/0 flex flex-wrap gap-3 @sm:gap-5">
          <Stat label="Distance" value={distance} />
          <Rule />
          <Stat label="Pace" value={pace} />
          <Rule />
          <Stat label="Time" value={time} />
        </div>
      </div>
    </Link>
  )
}

export default Strava
