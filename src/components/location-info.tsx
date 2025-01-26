'use client'

import isNumber from 'lodash/isNumber'
import filter from 'lodash/filter'
import values from 'lodash/values'
import { useEffect, useMemo, useState } from 'react'
import { Movement } from '@/types/models'
import includes from 'lodash/includes'
import compact from 'lodash/compact'
import join from 'lodash/join'
import {
  differenceInSeconds,
  formatDistanceToNowStrict,
  isValid,
} from 'date-fns'
import { AnimatePresence, motion } from 'motion/react'
import { toZonedTime } from 'date-fns-tz'

type Location = Pick<
  Movement,
  'moved_at' | 'city' | 'region' | 'country' | 'time_zone_id'
>

enum Mode {
  CurrentLocation,
  LocalTime,
  LastSeen,
}

const modes = filter(values(Mode), isNumber)

const getCurrentlyIn = (location: Location) => {
  const { city, region, country } = location

  if (city || region || country) {
    let array: Array<string | null | undefined> = []

    if (city) {
      const prefersRegion = includes(['US', 'CA', 'AU'], country)
      const suffix = prefersRegion ? region || country : country || region

      array = [city, suffix]
    } else if (region) {
      array = [region, country]
    } else {
      array = [country]
    }

    const compacted = compact(array)

    if (compacted.length) {
      return join(compacted, ', ')
    }
  }

  return 'unknown'
}

const getLocalTime = (location: Location) => {
  const { time_zone_id: timeZoneId } = location

  if (timeZoneId) {
    const now = new Date()
    const date = toZonedTime(now, timeZoneId)

    if (isValid(date)) {
      return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: 'numeric',
      })
    }
  }

  return 'unknown'
}

const getLastSeen = (location: Location) => {
  const d = new Date(location.moved_at)
  const seconds = differenceInSeconds(new Date(), d)

  if (seconds < 60) return 'Just now'

  const distance = formatDistanceToNowStrict(d)
  return `${distance} ago`
}

const LocationInfo = ({ location }: { location: Location }) => {
  const [renderedFirstItem, setRenderedFirstItem] = useState(false)
  const [mode, setMode] = useState(modes[0])

  useEffect(() => {
    const interval = setInterval(() => {
      setMode((prev) => (prev + 1) % modes.length)
    }, 3500)

    return () => clearInterval(interval)
  }, [])

  const children = useMemo(() => {
    switch (mode) {
      case Mode.CurrentLocation:
        return `Currently in: ${getCurrentlyIn(location)}`
      case Mode.LocalTime:
        return `Local time: ${getLocalTime(location)}`
      case Mode.LastSeen:
        return `Last seen: ${getLastSeen(location)}`
      default:
        throw new Error(`Invalid elevator mode: ${mode}`)
    }
  }, [mode, location])

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={mode}
        initial={renderedFirstItem ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onAnimationComplete={() => setRenderedFirstItem(true)}
        className="text-sm text-neutral-500 leading-tight line-clamp-1"
      >
        {children}
      </motion.p>
    </AnimatePresence>
  )
}

export default LocationInfo
