'use client'

import { lazy, Suspense } from 'react'
import { StravaActivity } from '@/types/models'

// Lazy load the heavy Strava component (includes mapbox-gl and turf)
const StravaComponent = lazy(() => import('@/components/strava'))

const StravaLoadingFallback = () => (
  <div className="bg-neutral-200 dark:bg-neutral-700 rounded-lg p-4 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-24"></div>
      <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-16"></div>
    </div>
    <div className="h-48 bg-neutral-300 dark:bg-neutral-600 rounded mb-4"></div>
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="text-center">
          <div className="h-6 bg-neutral-300 dark:bg-neutral-600 rounded mb-2"></div>
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded"></div>
        </div>
      ))}
    </div>
  </div>
)

const LazyStrava = ({ activities }: { activities: StravaActivity[] }) => (
  <Suspense fallback={<StravaLoadingFallback />}>
    <StravaComponent activities={activities} />
  </Suspense>
)

export default LazyStrava