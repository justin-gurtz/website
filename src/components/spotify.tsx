import { SpotifyMusic } from '@/types/models'
import Link from '@/components/link'
import Image from 'next/image'
import { IconPlayerPause } from '@tabler/icons-react'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import { cn } from '@/utils'
import Soundbars from '@/components/soundbars'

const getBestImage = (
  images: SpotifyMusic['item']['album']['images'] | undefined
) => {
  if (!images) return undefined

  const largestImage = reduce(
    images,
    (largest, image) => {
      return image.width > largest.width ? image : largest
    },
    images[0]
  )

  return reduce(
    images,
    (smallest, image) => {
      // Ideally 2x container size
      if (image.width >= 320 && image.height >= 320) {
        return image.width < smallest.width ? image : smallest
      }
      return smallest
    },
    largestImage
  )
}

const joinArtists = (artists: SpotifyMusic['item']['artists'] | undefined) => {
  if (!artists) return undefined

  const names = map(artists, (artist) => artist.name)

  if (names.length === 1) return names[0]
  if (names.length === 2) return names.join(' & ')

  return `${names.slice(0, -1).join(', ')}, & ${names.slice(-1)}`
}

const Spotify = ({ music }: { music: SpotifyMusic | null }) => {
  const item = music?.is_playing ? music.item : undefined

  const artists = joinArtists(item?.artists)
  const image = getBestImage(item?.album?.images)

  return (
    <Link href="https://open.spotify.com/user/gurtz">
      <div className="relative bg-slate-200 dark:bg-neutral-700 w-[160px] h-[160px] rounded-lg overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt="Artwork"
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        ) : (
          <IconPlayerPause
            size={36}
            className="stroke-neutral-900 dark:stroke-white opacity-15 absolute top-0 right-0 bottom-0 left-0 m-auto"
          />
        )}
        <div
          className={cn(
            'absolute top-0 left-0 w-full h-full',
            item
              ? 'bg-[linear-gradient(15deg,rgba(0,0,0,0.9),rgba(0,0,0,0.3))]'
              : 'bg-[linear-gradient(15deg,rgba(0,0,0,0.25),rgba(0,0,0,0))]'
          )}
        />
        <div className="absolute top-0 left-0 w-full h-full p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Image src="/spotify.svg" alt="Spotify" width={24} height={24} />
            {item && <Soundbars className="mr-1" />}
          </div>
          <div className="flex flex-col gap-0.5 text-white">
            <p className="font-semibold text-sm leading-tight line-clamp-2 text-pretty">
              {item?.name || (
                <>
                  Nothing
                  <br />
                  playing
                </>
              )}
            </p>
            {artists && <p className="text-xs line-clamp-1">{artists}</p>}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default Spotify
