import type { Metadata } from "next";
import "@/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import ConsoleEasterEgg from "@/components/console-easter-egg";

const bodyClassName = `${GeistSans.variable} ${GeistMono.variable} antialiased font-sans text-neutral-800 dark:text-white bg-neutral-100 dark:bg-neutral-900`;

const favicon = "/images/headshot-thumbnail.png";
const opengraphImage = "/images/headshot-large.png";

const websiteUrl = "https://justingurtz.com";

export const metadata: Metadata = {
  metadataBase: new URL(websiteUrl),
  title: "Justin Gurtz",
  description:
    "Working at the intersection of design, product, and engineering",
  icons: {
    icon: favicon,
    shortcut: favicon,
    apple: favicon,
  },
  openGraph: {
    type: "website",
    url: websiteUrl,
    images: [opengraphImage],
  },
  twitter: {
    card: "summary_large_image",
    site: "@gurtz",
    creator: "@gurtz",
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html lang="en">
    <body className={bodyClassName}>
      {children}
      <Analytics />
      <SpeedInsights />
      <ConsoleEasterEgg />
    </body>
  </html>
);

export default RootLayout;
