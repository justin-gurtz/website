import type { Metadata } from 'next'
import '@/globals.css'
import { Analytics } from '@vercel/analytics/next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

export const metadata: Metadata = {
  title: 'Justin Gurtz',
  // description: 'Generated by create next app',
}

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased font-sans text-neutral-800 dark:text-white bg-white dark:bg-neutral-800`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}

export default RootLayout
