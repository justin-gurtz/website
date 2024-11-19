import type { Metadata } from 'next'
import localFont from 'next/font/local'
import '@/globals.css'
import { Analytics } from '@vercel/analytics/next'

const geistSans = localFont({
  src: '../src/fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 200 300 400 500 600 700 800 900',
})

const geistMono = localFont({
  src: '../src/fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 200 300 400 500 600 700 800 900',
})

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark:bg-neutral-900`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}

export default RootLayout
