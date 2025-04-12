import { headers } from 'next/headers'
import { NEXT_PUBLIC_PRESHARED_KEY } from '@/env/public'

// eslint-disable-next-line import/prefer-default-export
export const validatePresharedKey = async () => {
  const headersList = await headers()
  const authorization = headersList.get('Authorization')

  if (authorization !== `Bearer ${NEXT_PUBLIC_PRESHARED_KEY}`) {
    throw new Error('Invalid pre-shared key')
  }
}
