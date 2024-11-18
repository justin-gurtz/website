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

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!

const href = 'https://www.strava.com/athletes/gurtz'

const logoHeight = 16
const logoWidth = (logoHeight / 91) * 432

const NYC_LAT = 40.725
const NYC_LNG = -73.97
const RADIUS_MILES = 10

const nycPoint = turf.point([NYC_LNG, NYC_LAT])

const colorScale = [
  '#0000FF', // blue
  '#8000FF', // purple
  '#FF00FF', // magenta
  '#FF0080', // pink
  '#FF0000', // red
  '#FF8000', // orange
  '#FFFF00', // yellow
].map((color, index, array) => ({
  color,
  position: index / (array.length - 1),
}))

function interpolateColor(
  color1: string,
  color2: string,
  factor: number
): string {
  const r1 = parseInt(color1.substring(1, 3), 16)
  const g1 = parseInt(color1.substring(3, 5), 16)
  const b1 = parseInt(color1.substring(5, 7), 16)
  const r2 = parseInt(color2.substring(1, 3), 16)
  const g2 = parseInt(color2.substring(3, 5), 16)
  const b2 = parseInt(color2.substring(5, 7), 16)

  const r = Math.round(r1 + factor * (r2 - r1))
  const g = Math.round(g1 + factor * (g2 - g1))
  const b = Math.round(b1 + factor * (b2 - b1))

  return `#${r.toString(16).padStart(2, '0')}${g
    .toString(16)
    .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function getColorForRun(position: number, totalRuns: number): string {
  const normalizedPosition = position / (totalRuns - 1)

  for (let i = 1; i < colorScale.length; i++) {
    if (normalizedPosition <= colorScale[i].position) {
      const t =
        (normalizedPosition - colorScale[i - 1].position) /
        (colorScale[i].position - colorScale[i - 1].position)
      return interpolateColor(colorScale[i - 1].color, colorScale[i].color, t)
    }
  }
  return colorScale[colorScale.length - 1].color
}

function getComponents(seconds: number) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  console.log(seconds)

  return { days, hours, minutes }
}

const Stat = ({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: Icon
}) => (
  <div
    className={cn('flex flex-col gap-0', Icon ? 'items-end' : 'items-start')}
  >
    <p className="text-xs text-gray-500 -mb-0.5">{label}</p>
    <div className="flex items-center gap-0.5">
      {Icon && <Icon size={18} stroke={2.5} />}
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  </div>
)

const Rule = () => (
  <div className="py-0.5 -mt-0.5">
    <div className="w-[1px] h-full bg-gray-200 dark:bg-gray-800" />
  </div>
)

export default function Strava({
  activities,
}: {
  activities: StravaActivity[]
}) {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  const [mapIsReady, setMapIsReady] = useState(false)
  const [hasAddedRunsToMap, setHasAddedRunsToMap] = useState(false)
  const [mapClassName, setMapClassName] = useState('opacity-0')

  const runs = useMemo(() => {
    return activities
      .filter((activity) => activity.type === 'Run')
      .sort(
        (a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      )
  }, [activities])

  const { distance, pace, time, totalRuns } = useMemo(() => {
    const totalDistance = runs.reduce((acc, run) => acc + run.distance, 0)
    const totalMovingTime = runs.reduce((acc, run) => acc + run.moving_time, 0)
    const miles = turf.convertLength(totalDistance, 'meters', 'miles')
    const avgPace = miles === 0 ? 0 : (totalMovingTime * 60) / miles

    const milesString = miles.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })

    const paceComponents = getComponents(avgPace)
    const timeComponents = getComponents(totalMovingTime)

    const paceString = `${paceComponents.hours}:${paceComponents.minutes
      .toString()
      .padStart(2, '0')} /mi`

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
    if (map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      attributionControl: false,
      logoPosition: 'bottom-left',
      center: [NYC_LNG, NYC_LAT],
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

    map.current.on('load', () => {
      setMapIsReady(true)
    })
  }, [])

  useEffect(() => {
    if (runs.length === 0) return
    if (!map.current) return
    if (!mapIsReady) return

    const currentMap = map.current

    const bounds = new mapboxgl.LngLatBounds()

    const newYorkRuns = runs.filter((run) => {
      if (!run.start_latlng || run.start_latlng.length !== 2) return false

      const [startLat, startLng] = run.start_latlng

      const runPoint = turf.point([startLng, startLat])
      const distance = turf.distance(nycPoint, runPoint, { units: 'miles' })

      return distance <= RADIUS_MILES
    })

    const runsToShow = newYorkRuns.length === 0 ? runs : newYorkRuns

    const style = currentMap.getStyle()

    if (style) {
      const runSources = Object.keys(style.sources).filter((sourceId) =>
        sourceId.startsWith('run-source-')
      )

      runSources.forEach((sourceId) => {
        if (currentMap.getSource(sourceId)) {
          const layers = style.layers.filter(
            (layer) => layer.source === sourceId
          )

          layers.forEach((layer) => {
            if (currentMap.getLayer(layer.id)) {
              currentMap.removeLayer(layer.id)
            }
          })

          currentMap.removeSource(sourceId)
        }
      })
    }

    runsToShow.forEach((run, index) => {
      const sourceId = `run-source-${run.id}`
      const layerId = `run-layer-${run.id}`

      const coordinates = polyline
        .decode(run.map.summary_polyline)
        .map(([lat, lng]) => [lng, lat])

      coordinates.forEach((coord) => {
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

    map.current.fitBounds(bounds, {
      padding: 50,
      animate: hasAddedRunsToMap,
    })

    setHasAddedRunsToMap(true)
  }, [mapIsReady, runs, hasAddedRunsToMap])

  useEffect(() => {
    if (!map.current) return
    if (!hasAddedRunsToMap) return
    if (mapClassName.includes('opacity-1')) return

    const bounds = map.current.getBounds()

    if (bounds) {
      map.current.fitBounds(bounds, {
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
