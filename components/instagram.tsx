"use client";

import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { InstagramFollows, InstagramPost } from "@/types/models";
import { cn } from "@/utils/tailwind";
import Link from "./link";
import Timestamp from "./timestamp";

const InstagramLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1000 1000"
      aria-label="Instagram"
      role="img"
    >
      <path
        d="M295.42,6c-53.2,2.51-89.53,11-121.29,23.48-32.87,12.81-60.73,30-88.45,57.82S40.89,143,28.17,175.92c-12.31,31.83-20.65,68.19-23,121.42S2.3,367.68,2.56,503.46,3.42,656.26,6,709.6c2.54,53.19,11,89.51,23.48,121.28,12.83,32.87,30,60.72,57.83,88.45S143,964.09,176,976.83c31.8,12.29,68.17,20.67,121.39,23s70.35,2.87,206.09,2.61,152.83-.86,206.16-3.39S799.1,988,830.88,975.58c32.87-12.86,60.74-30,88.45-57.84S964.1,862,976.81,829.06c12.32-31.8,20.69-68.17,23-121.35,2.33-53.37,2.88-70.41,2.62-206.17s-.87-152.78-3.4-206.1-11-89.53-23.47-121.32c-12.85-32.87-30-60.7-57.82-88.45S862,40.87,829.07,28.19c-31.82-12.31-68.17-20.7-121.39-23S637.33,2.3,501.54,2.56,348.75,3.4,295.42,6m5.84,903.88c-48.75-2.12-75.22-10.22-92.86-17-23.36-9-40-19.88-57.58-37.29s-28.38-34.11-37.5-57.42c-6.85-17.64-15.1-44.08-17.38-92.83-2.48-52.69-3-68.51-3.29-202s.22-149.29,2.53-202c2.08-48.71,10.23-75.21,17-92.84,9-23.39,19.84-40,37.29-57.57s34.1-28.39,57.43-37.51c17.62-6.88,44.06-15.06,92.79-17.38,52.73-2.5,68.53-3,202-3.29s149.31.21,202.06,2.53c48.71,2.12,75.22,10.19,92.83,17,23.37,9,40,19.81,57.57,37.29s28.4,34.07,37.52,57.45c6.89,17.57,15.07,44,17.37,92.76,2.51,52.73,3.08,68.54,3.32,202s-.23,149.31-2.54,202c-2.13,48.75-10.21,75.23-17,92.89-9,23.35-19.85,40-37.31,57.56s-34.09,28.38-57.43,37.5c-17.6,6.87-44.07,15.07-92.76,17.39-52.73,2.48-68.53,3-202.05,3.29s-149.27-.25-202-2.53m407.6-674.61a60,60,0,1,0,59.88-60.1,60,60,0,0,0-59.88,60.1M245.77,503c.28,141.8,115.44,256.49,257.21,256.22S759.52,643.8,759.25,502,643.79,245.48,502,245.76,245.5,361.22,245.77,503m90.06-.18a166.67,166.67,0,1,1,167,166.34,166.65,166.65,0,0,1-167-166.34"
        transform="translate(-2.5 -2.5)"
      />
    </svg>
  );
};

type Post = Pick<InstagramPost, "id" | "images" | "caption" | "posted_at">;
type Segment = {
  id: string;
  image: string;
  caption: string | null;
  posted_at: string | null;
};

const getSegments = (posts: Post[]) => {
  const segments: Segment[] = [];

  outer: for (const post of posts) {
    const halfCount = Math.floor(post.images.length / 2);
    const imagesToInclude = Math.max(1, halfCount);
    const images = post.images.slice(0, imagesToInclude);

    for (const image of images) {
      if (segments.length >= 5) {
        break outer;
      }

      segments.push({
        id: `${post.id}-${segments.length + 1}`,
        image: image,
        caption: post.caption,
        posted_at: post.posted_at,
      });
    }
  }

  return segments;
};

const StoryBar = ({
  segments,
  index,
  setIndex,
}: {
  segments: Segment[];
  index: number;
  setIndex: Dispatch<SetStateAction<number>>;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Delay to ensure styled-jsx keyframes are injected
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((index) => (index + 1) % segments.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [segments, setIndex]);

  return (
    <div className="w-full h-0.5 flex items-center gap-0.5">
      {segments.map((segment, i) => {
        const isPast = i < index;
        const isCurrent = i === index;

        return (
          <div
            key={segment.id}
            className="relative flex-1 h-full bg-white/25 rounded-full overflow-hidden"
          >
            {isPast && (
              <div className="absolute inset-0 bg-white rounded-full" />
            )}
            {isCurrent && (
              <div
                key={`${index}-${mounted}`}
                className="absolute inset-0 bg-white rounded-full"
                style={{
                  transform: "translateX(calc(-100% - 0.125rem))",
                  animation: mounted
                    ? "story-progress 5s linear forwards"
                    : "none",
                }}
              />
            )}
          </div>
        );
      })}
      <style jsx>{`
        @keyframes story-progress {
          from {
            transform: translateX(calc(-100% - 0.125rem));
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

const Instagram = ({
  data,
}: {
  data: Pick<InstagramFollows, "follower_count"> & {
    posts: Post[];
  };
}) => {
  const segments = useRef(getSegments(data.posts));

  const [index, setIndex] = useState(0);

  const post = useMemo(() => {
    return segments.current[index];
  }, [index]);

  const formattedFollowers = useMemo(() => {
    const f = data.follower_count;
    if (f >= 1_000_000) return `${(f / 1_000_000).toFixed(1)}M`;
    if (f >= 1_000) return `${(f / 1_000).toFixed(1)}k`;
    return f.toString();
  }, [data.follower_count]);

  return (
    <Link
      href="https://www.instagram.com/gurtz"
      className="relative w-full lg:w-[11.25rem] aspect-square"
      contentBrightness="dark"
    >
      {/** biome-ignore lint/performance/noImgElement: dynamic image */}
      <img
        src={post.image}
        alt={post.caption || "Instagram post"}
        className="size-full object-cover"
      />
      <div className="absolute inset-0 flex flex-col justify-between">
        <div className="px-3.5 pt-3 pb-2.5 bg-gradient-to-b from-black/40 dark:from-black/60 to-black/0 flex flex-col gap-1.5">
          {segments.current.length > 1 && (
            <StoryBar
              segments={segments.current}
              index={index}
              setIndex={setIndex}
            />
          )}
          <div className="flex items-center gap-1.5 text-xs text-white">
            <p className="font-semibold">@gurtz</p>
            {post.posted_at && (
              <Timestamp className="opacity-75" date={post.posted_at} />
            )}
          </div>
        </div>
        <div className="p-3 bg-gradient-to-t from-black/40 dark:from-black/60 to-black/0 flex items-center gap-1.5">
          <InstagramLogo className="size-5 fill-white" />
          <p className="opacity-75 text-xs text-white">
            {formattedFollowers} followers
          </p>
        </div>
      </div>
    </Link>
  );
};

export default Instagram;
