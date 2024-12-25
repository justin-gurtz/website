import NextLink from 'next/link'
import { useMemo } from 'react'
import startsWith from 'lodash/startsWith'
import { cn } from '@/utils/tailwind'

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
    <NextLink
      target={target}
      href={href}
      className={cn(
        className,
        'transition-[filter] duration-200 hover:brightness-[70%]'
      )}
    >
      {children}
    </NextLink>
  )
}

export default Link
