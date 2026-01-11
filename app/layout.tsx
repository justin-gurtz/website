import type { Metadata } from "next";
import "@/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import ConsoleEasterEgg from "@/components/console-easter-egg";
import {
  getBodyClassName,
  githubUrl,
  instagramUrl,
  websiteDescription,
  websiteTitle,
  websiteUrl,
  xHandle,
} from "@/constants";

const bodyClassName = getBodyClassName(
  `${GeistSans.variable} ${GeistMono.variable}`,
);

const favicon = "/images/headshot/thumbnail.png";
const opengraphImage = "/images/headshot/large.png";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: websiteTitle,
  url: websiteUrl,
  image: `${websiteUrl}/images/headshot/large.png`,
  description: websiteDescription,
  sameAs: [instagramUrl, githubUrl],
};

export const metadata: Metadata = {
  metadataBase: new URL(websiteUrl),
  alternates: {
    canonical: "/",
  },
  title: websiteTitle,
  description: websiteDescription,
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
    site: xHandle,
    creator: xHandle,
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html lang="en">
    <body className={bodyClassName}>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires this pattern
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
      <Analytics />
      <SpeedInsights />
      <ConsoleEasterEgg />
    </body>
  </html>
);

export default RootLayout;
