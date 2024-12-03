'use client'

import { differenceInSeconds, formatDistanceToNowStrict } from 'date-fns'
import split from 'lodash/split'
import { useCallback, useEffect, useState } from 'react'

const Timestamp = ({ date }: { date: string | Date }) => {
  const getTimestamp = useCallback(() => {
    const d = new Date(date)
    const seconds = differenceInSeconds(new Date(), d)

    if (seconds < 60) {
      return 'Just now'
    }

    const distance = formatDistanceToNowStrict(d)

    const [num, str] = split(distance, ' ')
    const char = str.charAt(0)

    return `${num}${char} ago`
  }, [date])

  const [timestamp, setTimestamp] = useState(getTimestamp())

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(getTimestamp())
    }, 60000)

    return () => clearInterval(interval)
  }, [getTimestamp])

  return <span>{timestamp}</span>
}

export default Timestamp
