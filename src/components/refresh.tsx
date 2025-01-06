'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const Refresh = ({ every }: { every: number }) => {
  const { refresh } = useRouter()

  useEffect(() => {
    const interval = setInterval(refresh, every * 1000)

    return () => clearInterval(interval)
  }, [every, refresh])

  return null
}

export default Refresh
