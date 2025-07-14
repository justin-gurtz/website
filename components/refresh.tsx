'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useCallback } from 'react'

const Refresh = ({ every }: { every: number }) => {
  const { refresh } = useRouter()

  const refreshHandler = useCallback(() => {
    // Only refresh if page is visible to avoid unnecessary requests
    if (document.visibilityState === 'visible') {
      refresh()
    }
  }, [refresh])

  useEffect(() => {
    const interval = setInterval(refreshHandler, every * 1000)

    return () => clearInterval(interval)
  }, [every, refreshHandler])

  return null
}

export default Refresh
