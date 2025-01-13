'use client'

import { useEffect } from 'react'
// eslint-disable-next-line no-restricted-imports
import readme from '../../README.md'

const ConsoleEasterEgg = () => {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(readme)
  }, [])

  return null
}

export default ConsoleEasterEgg
