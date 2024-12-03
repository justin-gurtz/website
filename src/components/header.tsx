import { Movement } from '@/types/models'
import { describeLocation } from '@/utils'
import Image from 'next/image'
import Timestamp from '@/components/timestamp'

const Header = ({
  location,
}: {
  location: Pick<Movement, 'moved_at' | 'city' | 'region' | 'country'>
}) => {
  const locationDescription = describeLocation(location)

  return (
    <div className="flex gap-3 items-center">
      <Image
        src="/headshot.jpg"
        alt="Headshot"
        width={50}
        height={50}
        objectFit="cover"
        className="rounded-lg bg-black/5 dark:bg-white/5"
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
