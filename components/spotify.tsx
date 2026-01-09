"use client";

import { isAfter, subMinutes } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "@/components/link";
import ScrollingText from "@/components/scrolling-text";
import Soundbars from "@/components/soundbars";
import usePageIsVisible from "@/hooks/use-page-is-visible";
import type { SpotifyData } from "@/types/models";
import { cn } from "@/utils/tailwind";
import Timestamp from "./timestamp";

const SpotifyLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 496 512"
    className={className}
    aria-label="Spotify"
    role="img"
  >
    <path
      fill="#1ed760"
      d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8Z"
    />
    <path d="M406.6 231.1c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3zm-31 76.2c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm-26.9 65.6c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4z" />
  </svg>
);

const QuarterNote = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 15 42"
    aria-label="Quarter Note"
    role="img"
    className={className}
  >
    <g transform="translate(-440.95 -9.4689)">
      <path
        d="m451.09 49.39c3.3958-1.82 5.2053-5.1146 4.0922-7.593-1.1873-2.6436-5.267-3.3897-9.1066-1.6654-3.8396 1.7244-5.9922 5.2694-4.8049 7.913 1.1873 2.6436 5.267 3.3897 9.1066 1.6654 0.23997-0.10777 0.48628-0.19874 0.71268-0.32007z"
        fillRule="evenodd"
      />
      <path d="m454.73 43.056v-33.588" fill="none" strokeWidth="2.75" />
    </g>
  </svg>
);

const albumArtBgClassName = "bg-neutral-300 dark:bg-neutral-600";

const AlbumArtImage = ({
  image,
  name,
}: {
  image: NonNullable<SpotifyData["image"]>;
  name: SpotifyData["name"];
}) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    // biome-ignore lint/performance/noImgElement: src is remote
    <img
      src={image}
      alt={name}
      className={cn("size-full object-cover", isLoading && albumArtBgClassName)}
      onLoad={handleLoad}
    />
  );
};

const AlbumArt = ({
  data,
  onAnimationComplete: handleAnimationComplete,
}: {
  data: Pick<SpotifyData, "image" | "name">;
  onAnimationComplete: () => void;
}) => {
  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={data.image || "no-image"}
        className="absolute inset-0 [backface-visibility:hidden] rounded-md shadow-md overflow-hidden"
        initial={{ rotateY: 180 }}
        animate={{ rotateY: 0 }}
        exit={{ rotateY: -180 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
        onAnimationComplete={handleAnimationComplete}
      >
        {data.image ? (
          <AlbumArtImage image={data.image} name={data.name} />
        ) : (
          <div
            className={cn(
              "size-full flex items-center justify-center",
              albumArtBgClassName,
            )}
          >
            <QuarterNote className="size-1/3 stroke-neutral-900 fill-neutral-900 dark:fill-white dark:stroke-white opacity-50" />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

const getIsPlaying = (updatedAt: SpotifyData["updatedAt"]) => {
  return isAfter(updatedAt, subMinutes(new Date(), 2));
};

const Spotify = ({
  data: d,
}: {
  data: Pick<SpotifyData, "updatedAt" | "image" | "name" | "by" | "color">;
}) => {
  const [data, setData] = useState(d);
  const [isAnimating, setIsAnimating] = useState(false);

  const pageIsVisible = usePageIsVisible();

  // When song changes (image differs), use data.updatedAt so isPlaying syncs with animation
  // When same song (only updatedAt changes), use d.updatedAt for instant update
  const updatedAtForIsPlaying = useMemo(() => {
    return data.image === d.image ? d.updatedAt : data.updatedAt;
  }, [data.updatedAt, d.updatedAt, data.image, d.image]);

  const [isPlaying, setIsPlaying] = useState(
    getIsPlaying(updatedAtForIsPlaying),
  );

  useEffect(() => {
    setIsPlaying(getIsPlaying(updatedAtForIsPlaying));

    const interval = setInterval(() => {
      setIsPlaying(getIsPlaying(updatedAtForIsPlaying));
    }, 60000);

    return () => clearInterval(interval);
  }, [updatedAtForIsPlaying]);

  useEffect(() => {
    if (!pageIsVisible) return;
    if (isAnimating) return;
    if (data.image === d.image) return;

    const startAnimation = () => {
      setIsAnimating(true);
      setData(d);
    };

    // Preload the new image before starting the animation
    if (d.image) {
      const img = new Image();
      img.onload = startAnimation;
      img.onerror = startAnimation; // Still animate even if image fails to load
      img.src = d.image;
    } else {
      startAnimation();
    }
  }, [d, data, pageIsVisible, isAnimating]);

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
  }, []);

  const style = useMemo(() => {
    if (!data.color) return undefined;
    return {
      backgroundColor: `color-mix(in srgb, ${data.color} 85%, white)`,
    };
  }, [data.color]);

  return (
    <Link
      href="https://open.spotify.com/user/gurtz"
      className="size-[11.25rem]"
      contentBrightness="dark"
    >
      <div
        className="bg-neutral-400 dark:bg-neutral-800 size-full p-3.5 flex flex-col justify-between gap-4 transition-colors duration-500"
        style={style}
      >
        <div className="flex items-center justify-between">
          <SpotifyLogo className="size-6" />
          {isPlaying ? (
            <Soundbars className="mr-1" />
          ) : (
            <Timestamp
              ago
              className="text-white text-xs opacity-80"
              date={data.updatedAt}
            />
          )}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 aspect-square [perspective:500px]">
            <AlbumArt
              data={data}
              onAnimationComplete={handleAnimationComplete}
            />
          </div>
        </div>
        <div className="flex flex-col gap-0.25 text-white -mb-1">
          <ScrollingText parentPadding={14} className="font-semibold text-xs">
            {data.name}
          </ScrollingText>
          {data.by.length > 0 && (
            <ScrollingText
              parentPadding={14}
              className="font-medium text-xs opacity-80"
            >
              {data.by.join(", ")}
            </ScrollingText>
          )}
        </div>
      </div>
    </Link>
  );
};

export default Spotify;
