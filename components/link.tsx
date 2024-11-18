import NextLink from 'next/link'
import { useMemo } from 'react'

export default function Link({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  const target = useMemo(() => {
    if (href.startsWith('http')) {
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
