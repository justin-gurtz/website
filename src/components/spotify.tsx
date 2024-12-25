import { NowPlaying } from '@/types/models'
import Link from '@/components/link'
import { IconMusic, IconPlayerPause } from '@tabler/icons-react'
import { cn } from '@/utils/tailwind'
import Soundbars from '@/components/soundbars'
import { isAfter, subMinutes } from 'date-fns'

const joinArtists = (artists: NowPlaying['artists']) => {
  if (!artists?.length) return undefined

  if (artists.length === 1) return artists[0]
  if (artists.length === 2) return artists.join(' & ')

  return `${artists.slice(0, -1).join(', ')}, & ${artists.slice(-1)}`
}

const SpotifyLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 496 512"
    className={className}
  >
    <path
      fill="#1ed760"
      d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8Z"
    />
    <path d="M406.6 231.1c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3zm-31 76.2c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm-26.9 65.6c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4z" />
  </svg>
)

const Spotify = ({
  nowPlaying,
}: {
  nowPlaying: Pick<NowPlaying, 'created_at' | 'image' | 'name' | 'artists'>
}) => {
  const isPlaying = isAfter(nowPlaying.created_at, subMinutes(new Date(), 2))
  const artists = joinArtists(nowPlaying.artists)

  return (
    <Link href="https://open.spotify.com/user/gurtz">
      <div className="relative bg-white dark:bg-neutral-800 size-[180px] rounded-xl overflow-hidden">
        {nowPlaying.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={nowPlaying.image}
            alt="Artwork"
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        ) : (
          <IconMusic
            size={48}
            stroke={1}
            className="stroke-neutral-900 dark:stroke-white opacity-15 absolute top-0 right-0 bottom-0 left-0 m-auto"
          />
        )}
        <div
          className={cn(
            'absolute top-0 left-0 w-full h-full',
            nowPlaying.image
              ? 'bg-[linear-gradient(15deg,rgba(0,0,0,0.9),rgba(0,0,0,0.3))]'
              : 'bg-[linear-gradient(15deg,rgba(0,0,0,0.25),rgba(0,0,0,0))]'
          )}
        />
        <div className="absolute top-0 left-0 w-full h-full p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <SpotifyLogo className="size-6" />
            {isPlaying ? (
              <Soundbars className="mr-1" />
            ) : (
              <IconPlayerPause size={20} stroke={0} className="fill-white" />
            )}
          </div>
          <div className="flex flex-col gap-0.5 text-white">
            <p className="font-semibold text-sm leading-tight line-clamp-2 text-pretty">
              {nowPlaying.name}
            </p>
            {artists && <p className="text-xs line-clamp-1">{artists}</p>}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default Spotify
