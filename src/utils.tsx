import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Movement } from '@/types/models'
import includes from 'lodash/includes'
import compact from 'lodash/compact'
import join from 'lodash/join'

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

export const describeLocation = (
  location: Pick<Movement, 'city' | 'region' | 'country'>
) => {
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
}
