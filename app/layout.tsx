import type { Metadata } from "next";
import "@/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import ConsoleEasterEgg from "@/components/console-easter-egg";
import { githubUrl } from "@/components/github";
import { instagramUrl } from "@/components/instagram";

const bodyClassName = `${GeistSans.variable} ${GeistMono.variable} antialiased font-sans text-neutral-800 dark:text-white bg-neutral-100 dark:bg-neutral-900`;

const favicon = "/images/headshot/thumbnail.png";
const opengraphImage = "/images/headshot/large.png";

const title = "Justin Gurtz";
const description =
  "Working at the intersection of design, product, and engineering";
const websiteUrl = "https://justingurtz.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: title,
  url: websiteUrl,
  image: `${websiteUrl}/images/headshot/large.png`,
  description,
  sameAs: [instagramUrl, githubUrl],
};

export const metadata: Metadata = {
  metadataBase: new URL(websiteUrl),
  alternates: {
    canonical: "/",
  },
  title,
  description,
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
