import { DuolingoLearning } from '@/types/models'
import Link from '@/components/link'
import map from 'lodash/map'
import localFont from 'next/font/local'
import { cn } from '@/utils/tailwind'
import { useMemo } from 'react'
import compact from 'lodash/compact'
import isString from 'lodash/isString'
import forEach from 'lodash/forEach'
import Image from 'next/image'
import slice from 'lodash/slice'

const dinRoundPro = localFont({
  src: [
    {
      path: '../../public/fonts/din-round-pro/500.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/din-round-pro/700.otf',
      weight: '700',
      style: 'normal',
    },
  ],
})

const DuolingoLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 400 94"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M50.2605 0C44.9776 0 38.2406 6.73694 38.2406 18.466V24.1851C34.751 21.9557 30.6798 20.744 25.5907 20.744C11.1959 20.7924 0 32.1338 0 46.1893C0 60.2448 10.7113 71.5861 25.4938 71.5861C32.6184 71.5861 38.2406 69.0173 41.9241 65.4792C44.3475 68.8235 47.3525 70.6652 49.9697 70.6652C52.0053 70.6652 53.0231 69.5505 53.0231 67.0786V3.34424C53.0231 1.11475 52.0053 0 50.2605 0ZM26.6085 58.2576C19.4838 58.2576 14.9764 53.0716 14.9764 46.1408C14.9764 39.21 19.4838 34.024 26.6085 34.024C33.7332 34.024 38.2406 39.21 38.2406 46.1408C38.2406 53.1201 33.7332 58.2576 26.6085 58.2576ZM107.597 22.6342H102.605C99.0185 22.6342 97.7099 24.0882 97.7099 27.5294V45.8015C97.7099 53.1685 93.9295 57.5306 87.8226 57.5306C81.5219 57.5306 78.323 53.3624 78.323 45.6077V27.5294C78.323 23.9428 76.869 22.6342 73.4278 22.6342H68.4357C64.9945 22.6342 63.5405 23.9428 63.5405 27.5294V45.9954C63.5405 61.7957 71.4892 71.5861 85.4477 71.5861C91.6515 71.5861 97.1768 69.1627 101.054 64.9461C103.381 68.6296 106.579 70.6652 109.439 70.6652C111.184 70.6652 112.492 69.5505 112.492 67.0786V27.5294C112.492 23.9428 111.038 22.6342 107.597 22.6342ZM146.953 71.5861C161.929 71.5861 173.076 60.2448 173.076 46.1893C173.076 31.7945 161.881 20.7924 146.953 20.7924C132.073 20.7924 120.829 32.1338 120.829 46.1893C120.829 60.584 132.073 71.5861 146.953 71.5861ZM146.953 58.2576C140.216 58.2576 135.757 53.0716 135.757 46.1408C135.757 39.21 140.167 34.024 146.953 34.024C153.787 34.024 158.149 39.21 158.149 46.1408C158.1 53.1201 153.787 58.2576 146.953 58.2576ZM186.114 69.7443H191.106C194.499 69.7443 196.001 68.4357 196.001 64.8491V3.58657C196.001 1.11475 194.984 0 192.948 0C187.956 0 181.219 6.73694 181.219 18.466V64.8491C181.219 68.4357 182.673 69.7443 186.114 69.7443ZM214.855 15.8972C219.363 15.8972 223.192 12.4076 223.192 7.94862C223.192 3.48964 219.363 0 214.855 0C210.251 0 206.519 3.48964 206.519 7.94862C206.519 12.4076 210.202 15.8972 214.855 15.8972ZM212.335 69.7443H217.327C220.914 69.7443 222.222 68.2903 222.222 64.8491V27.5294C222.222 24.0882 220.914 22.6342 217.327 22.6342H212.335C208.748 22.6342 207.44 24.0882 207.44 27.5294V64.8491C207.44 68.2419 208.748 69.7443 212.335 69.7443ZM261.093 20.7924C254.986 20.7924 249.17 23.2643 245.099 27.6263C242.675 23.7489 239.477 21.7133 236.714 21.7133C234.678 21.7133 233.66 22.8281 233.66 25.2999V64.8491C233.66 68.4357 235.115 69.7443 238.556 69.7443H243.548C247.134 69.7443 248.443 68.2903 248.443 64.8491V46.5285C248.443 39.21 252.708 34.7995 258.96 34.7995C265.31 34.7995 268.654 39.0646 268.654 46.7224V64.8491C268.654 68.4357 270.108 69.7443 273.549 69.7443H278.541C281.982 69.7443 283.436 68.4357 283.436 64.8491V45.9954C283.436 30.5828 275.585 20.7924 261.093 20.7924ZM332.388 55.1557C336.75 51.9084 339.416 47.0132 339.416 41.391C339.416 39.0646 338.931 36.9805 338.01 34.9449C342.906 32.5215 344.747 28.111 344.747 23.9428C344.747 19.7746 343.099 18.5629 340.676 19.6777C332 23.652 330.789 23.8459 325.07 22.8281C321.483 22.198 318.866 21.7133 315.376 21.7133C308.93 21.7133 303.647 23.7489 299.188 27.4324C295.02 30.9221 292.887 36.0111 292.887 41.391C292.887 47.0132 295.456 51.9084 299.915 55.1557C294.099 58.2091 290.028 64.6553 290.028 72.3131C290.028 84.963 300.206 93.7356 316.055 93.7356C332.679 93.7356 342.179 84.0422 342.179 71.3922C342.276 63.7344 338.204 58.0153 332.388 55.1557ZM316.152 33.7332C321.532 33.7332 324.827 36.4958 324.827 42.0695C324.827 46.4801 321.144 50.4059 316.152 50.4059C311.16 50.4059 307.573 46.5285 307.573 42.0695C307.573 36.8351 310.966 33.7332 316.152 33.7332ZM316.152 81.5703C309.706 81.5703 304.907 77.4022 304.907 72.0708C304.907 66.1578 309.415 62.5712 316.152 62.5712C322.986 62.5712 327.493 66.1578 327.493 72.0708C327.493 77.4991 322.792 81.5703 316.152 81.5703ZM373.876 71.5861C388.853 71.5861 400 60.2448 400 46.1893C400 31.7945 388.804 20.7924 373.876 20.7924C358.997 20.7924 347.752 32.1338 347.752 46.1893C347.752 60.584 358.997 71.5861 373.876 71.5861ZM373.876 58.2576C367.139 58.2576 362.68 53.0716 362.68 46.1408C362.68 39.21 367.091 34.024 373.876 34.024C380.71 34.024 385.072 39.21 385.072 46.1408C385.072 53.1201 380.71 58.2576 373.876 58.2576Z" />
  </svg>
)

const StreakFlame = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="20"
    viewBox="0 0 16 20"
    fill="none"
  >
    <path
      d="M6.77271 0.532617C7.336 -0.177539 8.414 -0.177539 8.97729 0.532616L14.0623 6.94342C15.1193 8.23421 15.75 9.86374 15.75 11.6351C15.75 15.8233 12.2242 19.2185 7.875 19.2185C3.52576 19.2185 0 15.8233 0 11.6351C0 11.3414 0.0173457 11.0515 0.0511046 10.7664L0.0333507 4.37841C0.0307386 3.43858 0.542464 2.74527 1.41725 2.89269C1.59157 2.92207 1.9601 3.0331 2.12522 3.12149L3.94611 4.09617L6.77271 0.532617Z"
      fill="#FF9600"
    />
    <path
      d="M8.40677 8.24144C8.1299 7.86443 7.5667 7.86443 7.28982 8.24144L5.30202 10.9482C5.28343 10.9735 5.2689 11 5.25814 11.027C4.7842 11.5866 4.5 12.3011 4.5 13.0796C4.5 14.8745 6.01104 16.3296 7.875 16.3296C9.73896 16.3296 11.25 14.8745 11.25 13.0796C11.25 12.2008 10.8878 11.4035 10.2993 10.8185L8.40677 8.24144Z"
      fill="#FFC800"
    />
  </svg>
)

const flagKeys = [
  'en',
  'es',
  'fr',
  'de',
  'ja',
  'it',
  'ko',
  'zh',
  'ru',
  'pt',
  'tr',
  'nl',
  'sv',
  'ga',
  'el',
  'he',
  'pl',
  'no',
  'vi',
  'da',
  'hv',
  'ro',
  'sw',
  'eo',
  'hu',
  'cy',
  'uk',
  'kl',
  'cs',
  'hi',
  'id',
  'ha',
  'nv',
  'ar',
  'ca',
  'th',
  'gn',
  'ambassador',
  'duolingo',
  'troubleshooting',
  'teachers',
  'la',
  'gd',
  'fi',
  'Yiddish',
]
const flagOffsets: Record<string, number> = {}

forEach(flagKeys, (key, index) => {
  flagOffsets[key] = index * 66
})

const DuolingoFlag = ({
  offset,
  className,
}: {
  offset: number
  className?: string
}) => (
  <svg viewBox={`0 ${offset} 82 66`} className={className}>
    <image
      width="82"
      height="3168"
      href="https://d35aaqx5ub95lt.cloudfront.net/vendor/87938207afff1598611ba626a8c4827c.svg"
      xlinkHref="https://d35aaqx5ub95lt.cloudfront.net/vendor/87938207afff1598611ba626a8c4827c.svg"
    />
  </svg>
)

const Duolingo = ({ learning }: { learning: DuolingoLearning }) => {
  const courses = useMemo(() => {
    const withFlagOffsets = map(learning.courses, (course) => {
      if (isString(course.learningLanguage)) {
        const flagOffset = flagOffsets[course.learningLanguage]

        if (flagOffset !== undefined) {
          return { ...course, flagOffset }
        }
      }

      return null
    })

    const withoutNull = compact(withFlagOffsets)

    return slice(withoutNull, 0, 3)
  }, [learning.courses])

  return (
    <Link
      href="https://www.duolingo.com/profile/JustinGurtz"
      className="@container"
    >
      <div
        className={cn(
          'relative bg-white dark:bg-neutral-900 rounded-xl p-5 @sm:p-8 border border-neutral-300 dark:border-neutral-700 h-[180px]',
          dinRoundPro.className
        )}
      >
        <div className="flex justify-between size-full">
          <div
            className={cn(
              'flex flex-col gap-1 dark:gap-2 -mt-1 dark:-mt-0.5',
              courses.length === 3 && '@sm:justify-between'
            )}
          >
            {map(courses, (course) => (
              <div
                key={course.learningLanguage}
                className="flex gap-1.5 dark:gap-2 items-center -ml-1 dark:-ml-0.5"
              >
                <DuolingoFlag
                  offset={course.flagOffset}
                  className="h-9 dark:h-8"
                />
                <div>
                  <p className="text-sm font-bold">{course.title}</p>
                  <p className="-mt-0.5 text-xs font-medium text-neutral-400 dark:text-neutral-600">
                    {course.xp} XP
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-end">
            <DuolingoLogo className="h-4 mt-0.5 fill-neutral-400" />
            <div className="flex gap-1 items-center">
              <StreakFlame />
              <p className="font-bold text-lg text-[#FF9600]">
                {learning.streak}
              </p>
            </div>
          </div>
        </div>
        <Image
          src="/images/duo-owl.webp"
          alt="Duolingo Owl"
          width={100}
          height={100}
          className="absolute bottom-0 right-[10%] @xs:right-[15%] @sm:right-[20%]"
        />
      </div>
    </Link>
  )
}

export default Duolingo
