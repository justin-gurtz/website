'use client'

import { lazy, Suspense } from 'react'
import { DuolingoLearning } from '@/types/models'

// Lazy load the Duolingo component (includes local fonts)
const DuolingoComponent = lazy(() => import('@/components/duolingo'))

const DuolingoLoadingFallback = () => (
  <div className="bg-neutral-200 dark:bg-neutral-700 rounded-lg p-4 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-24"></div>
      <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-16"></div>
    </div>
    <div className="flex items-center gap-2 mb-4">
      <div className="h-6 w-6 bg-neutral-300 dark:bg-neutral-600 rounded"></div>
      <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-32"></div>
    </div>
    <div className="flex gap-2">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-8 w-8 bg-neutral-300 dark:bg-neutral-600 rounded"></div>
      ))}
    </div>
  </div>
)

const LazyDuolingo = ({ learning }: { learning: DuolingoLearning }) => (
  <Suspense fallback={<DuolingoLoadingFallback />}>
    <DuolingoComponent learning={learning} />
  </Suspense>
)

export default LazyDuolingo