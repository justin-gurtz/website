import type { Metadata } from "next";
import "@/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import ConsoleEasterEgg from "@/components/console-easter-egg";

const bodyClassName = `${GeistSans.variable} ${GeistMono.variable} antialiased font-sans text-neutral-800 dark:text-white bg-neutral-100 dark:bg-neutral-900`;

const headshot = "/images/headshot.png";

export const metadata: Metadata = {
  title: "Justin Gurtz",
  description:
    "Working at the intersection of design, product, and engineering",
  icons: {
    icon: headshot,
    shortcut: headshot,
    apple: headshot,
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
