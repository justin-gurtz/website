import { Movement } from '@/types/models'
import Image from 'next/image'
import Timestamp from '@/components/timestamp'
import { useMemo } from 'react'
import includes from 'lodash/includes'
import compact from 'lodash/compact'
import join from 'lodash/join'

const Header = ({
  location,
}: {
  location: Pick<Movement, 'moved_at' | 'city' | 'region' | 'country'>
}) => {
  const locationDescription = useMemo(() => {
    const { city, region, country } = location

    if (!city && !region && !country) return undefined

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
    const joined = join(compacted, ', ')

    return joined || undefined
  }, [location])

  return (
    <div className="flex gap-3 items-center">
      <Image
        src="/images/headshot.jpg"
        alt="Headshot"
        width={50}
        height={50}
        className="rounded-lg bg-black/5 dark:bg-white/5"
        priority
      />
      <div className="flex flex-col gap-0.5">
        <h1 className="text-md font-bold leading-tight">Justin Gurtz</h1>
        {locationDescription && (
          <p className="text-sm text-neutral-500 leading-tight">
            {locationDescription}
            <span className="text-neutral-400 dark:text-neutral-600">
              {' '}
              &ndash; <Timestamp date={location.moved_at} />
            </span>
          </p>
        )}
      </div>
    </div>
  )
}

export default Header
