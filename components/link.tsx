import NextLink from 'next/link'
import { useMemo } from 'react'
import startsWith from 'lodash/startsWith'

const Link = ({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) => {
  const target = useMemo(() => {
    if (startsWith(href, 'http')) {
      return '_blank'
    }

    return undefined
  }, [href])

  return (
    <NextLink target={target} href={href} className={className}>
      {children}
    </NextLink>
  )
}

export default Link
