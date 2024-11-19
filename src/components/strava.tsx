'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import polyline from '@mapbox/polyline'
import * as turf from '@turf/turf'
import Link from '@/components/link'
import { StravaActivity } from '@/types'
import { cn } from '@/utils'
import { Icon, IconRun } from '@tabler/icons-react'
import Image from 'next/image'
import map from 'lodash/map'
import filter from 'lodash/filter'
import padStart from 'lodash/padStart'
import reduce from 'lodash/reduce'
import sortBy from 'lodash/sortBy'
import forEach from 'lodash/forEach'
import includes from 'lodash/includes'
import keys from 'lodash/keys'
import startsWith from 'lodash/startsWith'
import { NEXT_PUBLIC_MAPBOX_MAPS_ACCESS_TOKEN } from '@/env/public'

mapboxgl.accessToken = NEXT_PUBLIC_MAPBOX_MAPS_ACCESS_TOKEN

const href = 'https://www.strava.com/athletes/gurtz'

const logoHeight = 16
const logoWidth = (logoHeight / 91) * 432

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
      OptionalIcon ? 'sm:items-end' : undefined
    )}
  >
    <p className="text-xs text-gray-500 -mb-0.5">{label}</p>
    <div className="flex items-center gap-0.5">
      {OptionalIcon && <OptionalIcon size={18} stroke={2.5} />}
      <p className="text-md font-semibold tabular-nums">{value}</p>
    </div>
  </div>
)

const Rule = () => (
  <div className="py-0.5 -mt-0.5 hidden sm:block">
    <div className="w-[1px] h-full bg-gray-200 dark:bg-gray-800" />
  </div>
)

const Strava = ({ activities }: { activities: StravaActivity[] }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapbox = useRef<mapboxgl.Map | null>(null)

  const [mapIsReady, setMapIsReady] = useState(false)
  const [hasAddedRunsToMap, setHasAddedRunsToMap] = useState(false)
  const [mapClassName, setMapClassName] = useState('opacity-0')

  const runs = useMemo(() => {
    const filtered = filter(activities, ({ type }) => type === 'Run')
    return sortBy(filtered, ({ start_date: d }) => new Date(d).getTime())
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

    const paceComponents = getComponents(avgPace)
    const timeComponents = getComponents(totalMovingTime)

    const paceString = `${paceComponents.hours}:${padded(paceComponents.minutes)} /mi`

    const timeString = timeComponents.days
      ? `${timeComponents.days}d ${timeComponents.hours}h`
      : `${timeComponents.hours}h ${timeComponents.minutes}m`

    return {
      distance: `${milesString} mi`,
      pace: paceString,
      time: timeString,
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

      const runColor = getColorForRun(index, runs.length)

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
      padding: 50,
      animate: hasAddedRunsToMap,
    })

    setHasAddedRunsToMap(true)
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
    <div className="flex flex-col gap-5">
      <Link href={href} className="self-start">
        <Image
          src="/strava.svg"
          alt="Strava"
          width={logoWidth}
          height={logoHeight}
        />
      </Link>
      <Link href={href}>
        <div className="relative w-full pb-[125%] rounded-lg overflow-hidden">
          <div className="absolute w-full h-full bg-neutral-800 duration-1">
            <div
              ref={mapContainer}
              className={cn(
                'absolute w-full h-full [&_.mapboxgl-ctrl]:!hidden',
                mapClassName
              )}
            />
          </div>
        </div>
      </Link>
      <div className="flex flex-wrap gap-5">
        <Link href={href} className="flex flex-wrap gap-5">
          <Stat label="Distance" value={distance} />
          <Rule />
          <Stat label="Pace" value={pace} />
          <Rule />
          <Stat label="Time" value={time} />
        </Link>
        <div className="flex-1" />
        <Link href={href}>
          <Stat label="Total Runs" value={totalRuns} icon={IconRun} />
        </Link>
      </div>
    </div>
  )
}

export default Strava
