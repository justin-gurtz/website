"use client";

import { AnimatePresence, motion } from "motion/react";
import NextImage, { getImageProps } from "next/image";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { instagramUrl } from "@/constants";
import usePageIsVisible from "@/hooks/use-page-is-visible";
import type {
  InstagramDisplayImage,
  InstagramFollows,
  InstagramPost,
} from "@/types/models";
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

type Post = Pick<InstagramPost, "id" | "caption" | "postedAt"> & {
  images: InstagramDisplayImage[];
};

const imageSizes = "(min-width: 1024px) 180px, 100vw";

// How many images ahead of the current one to keep warm. Each shows for 5s,
// so 2 gives a 10s window for the fetch to land on slow connections.
const warmLookahead = 2;

// Warm the cache for an upcoming image so the transition to it is instant.
// Uses getImageProps so the URL/srcSet match what NextImage will request.
// Fetched via an off-DOM Image rather than <link rel="preload"> — the image
// isn't consumed for several seconds, so preload links trigger "preloaded but
// not used within a few seconds" console warnings.
const warmImage = (image: InstagramDisplayImage) => {
  const { props } = getImageProps({
    src: image.url,
    alt: "",
    width: 180,
    height: 180,
    sizes: imageSizes,
  });
  const img = new Image();
  img.fetchPriority = "low";
  // sizes must be set before srcset so candidate selection uses it
  if (props.sizes) img.sizes = props.sizes;
  if (props.srcSet) img.srcset = props.srcSet;
  img.src = props.src;
};

const StoryBar = ({
  index,
  images,
  running,
}: {
  index: number;
  images: InstagramDisplayImage[];
  running: boolean;
}) => {
  const [mounted, setMounted] = useState(false);
  const pageIsVisible = usePageIsVisible();

  useEffect(() => {
    // Delay to ensure styled-jsx keyframes are injected
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <div className="w-full h-0.5 flex items-center gap-0.5">
      {images.map((image, i) => {
        const isPast = i < index;
        const isCurrent = i === index;

        return (
          <div
            key={image.url}
            className="relative flex-1 h-full bg-white/25 rounded-full overflow-hidden"
          >
            {isPast && (
              <div className="absolute inset-0 bg-white rounded-full" />
            )}
            {isCurrent && pageIsVisible && (
              <div
                key={`${index}-${mounted}`}
                className="absolute inset-0 bg-white rounded-full"
                style={{
                  transform: "translateX(calc(-100% - 0.125rem))",
                  animation:
                    mounted && running
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

// The intro is modelled on Pow's "snapshot" transition: the photo starts
// blown out and comes down through the exposure so the darkest tones
// resolve first, while it sharpens and gains contrast and colour. The
// exposure is an additive white layer (plus-lighter), since CSS brightness()
// only scales, and scaling can't clip highlights.
const developDuration = "1.8s ease-in-out forwards";
const undevelopedFilter = "saturate(0.5) contrast(0.5) blur(3px)";
// Blur samples past the edge of the image, leaving a soft fringe that the
// placeholder shows through. Oversizing the image while it's blurred pushes
// the fringe outside the clip (Pow's `opaque: true`).
const undevelopedTransform = "scale(1.07)";
const undevelopedExposure = 0.85;
// The text, gradients and story bar fade in alongside the photo rather than
// sitting on the blown-out print
const undevelopedChromeOpacity = 0;

const PostView = ({
  followerCount,
  post,
  setPostIndex,
  postsCount,
  nextPostImages,
  isInitial,
  intro,
  onIntroDone,
}: {
  followerCount: number;
  post: Post;
  setPostIndex: Dispatch<SetStateAction<number>>;
  postsCount: number;
  nextPostImages: InstagramDisplayImage[];
  isInitial: boolean;
  intro: boolean;
  onIntroDone: () => void;
}) => {
  const [imageIndex, setImageIndex] = useState(0);
  const pageIsVisible = usePageIsVisible();

  // Intro: the first photo develops like an instant print once it has
  // loaded. The story timer waits for it so the finished photo still gets
  // its full turn.
  const [develop, setDevelop] = useState<"pending" | "running" | "done">(
    intro ? "pending" : "done",
  );
  const developDone = () => {
    setDevelop("done");
    onIntroDone();
  };

  const formattedFollowers = useMemo(() => {
    const f = followerCount;
    if (f >= 1_000_000) return `${(f / 1_000_000).toFixed(1)}M`;
    if (f >= 1_000) return `${(f / 1_000).toFixed(1)}k`;
    return f.toString();
  }, [followerCount]);

  const hasMultipleImages = useMemo(() => {
    return !!(postsCount > 1 || post.images.length > 1);
  }, [post.images.length, postsCount]);

  useEffect(() => {
    if (!hasMultipleImages) return;
    if (!pageIsVisible) return;
    if (develop !== "done") return;

    const interval = setInterval(() => {
      if (imageIndex < post.images.length - 1) {
        setImageIndex(imageIndex + 1);
      } else if (postsCount === 1) {
        setImageIndex(0);
      } else {
        setPostIndex((postIndex) => (postIndex + 1) % postsCount);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [
    post.images,
    imageIndex,
    setPostIndex,
    postsCount,
    pageIsVisible,
    hasMultipleImages,
    develop,
  ]);

  // Keep the next few images warm, whichever post they belong to. Bounded per
  // transition rather than warming everything up front, since the number of
  // posts/images is unbounded.
  useEffect(() => {
    if (!hasMultipleImages) return;
    const upcoming = [...post.images.slice(imageIndex + 1), ...nextPostImages];
    for (const image of upcoming.slice(0, warmLookahead)) warmImage(image);
  }, [post.images, imageIndex, nextPostImages, hasMultipleImages]);

  return (
    <div className="relative isolate block size-full rounded-squircle-outside overflow-hidden bg-neutral-400 dark:bg-neutral-800">
      {/* Each image gets its own element (keyed by url) and earlier images stay
          mounted underneath — reusing one img and swapping src makes the old
          pixels briefly render with the next image's focal point while the new
          src decodes */}
      {post.images.slice(0, imageIndex + 1).map((image, i) => {
        const developing = i === 0 && develop !== "done";
        return (
          <NextImage
            key={image.url}
            src={image.url}
            alt={post.caption || "Instagram post"}
            fill
            sizes={imageSizes}
            preload={isInitial && i === 0}
            fetchPriority={isInitial && i === 0 ? "high" : undefined}
            className="object-cover"
            style={{
              objectPosition: `${image.focus.x}% ${image.focus.y}%`,
              // The undeveloped look is also set statically so no developed
              // frame can slip in between the image loading and the
              // animation starting
              ...(developing && {
                filter: undevelopedFilter,
                transform: undevelopedTransform,
                animation:
                  develop === "running"
                    ? `develop ${developDuration}`
                    : undefined,
              }),
            }}
            onLoad={developing ? () => setDevelop("running") : undefined}
            onError={developing ? developDone : undefined}
            onAnimationEnd={developing ? developDone : undefined}
          />
        );
      })}
      {develop !== "done" && (
        <div
          aria-hidden
          className="absolute inset-0 bg-white mix-blend-plus-lighter"
          style={{
            opacity: undevelopedExposure,
            animation:
              develop === "running"
                ? `develop-exposure ${developDuration}`
                : undefined,
          }}
        />
      )}
      {/* The blown-out print is nearly the page colour in light mode, so a
          hairline outlines it until the photo has developed enough to stand
          on its own. Dark mode already has a permanent border. */}
      {develop !== "done" && (
        <div
          aria-hidden
          className="absolute inset-0 rounded-squircle-outside border-[1px] lg:border-[0.5px] border-neutral-200 lg:border-neutral-300 dark:hidden pointer-events-none"
          style={{
            animation:
              develop === "running"
                ? `develop-hairline ${developDuration}`
                : undefined,
          }}
        />
      )}
      <style jsx>{`
        @keyframes develop {
          from {
            filter: ${undevelopedFilter};
            transform: ${undevelopedTransform};
          }
          to {
            filter: saturate(1) contrast(1) blur(0);
            transform: scale(1);
          }
        }
        @keyframes develop-exposure {
          from {
            opacity: ${undevelopedExposure};
          }
          to {
            opacity: 0;
          }
        }
        @keyframes develop-hairline {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        @keyframes develop-chrome {
          from {
            opacity: ${undevelopedChromeOpacity};
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
      <div
        className="absolute inset-0 flex flex-col justify-between"
        style={
          develop !== "done"
            ? {
                opacity: undevelopedChromeOpacity,
                animation:
                  develop === "running"
                    ? `develop-chrome ${developDuration}`
                    : undefined,
              }
            : undefined
        }
      >
        <div className="relative px-3.5 pt-3.5 pb-2.5 @xs:px-4.5 @xs:pt-4.5 @xs:pb-3.5 flex flex-col gap-1.5 @xs:gap-2.5">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 dark:from-black/60 to-black/0" />
          {hasMultipleImages && (
            <StoryBar
              index={imageIndex}
              images={post.images}
              running={develop === "done"}
            />
          )}
          <div className="relative flex items-center gap-1.5 text-xs text-white">
            <p className="font-semibold">@gurtz</p>
            {post.postedAt && (
              <Timestamp className="opacity-75" date={post.postedAt} />
            )}
          </div>
        </div>
        <div className="relative p-3 @xs:p-4 flex items-center gap-1.5">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 dark:from-black/60 to-black/0" />
          <InstagramLogo className="relative size-5 fill-white" />
          <p className="relative opacity-75 text-xs text-white">
            {formattedFollowers} followers
          </p>
        </div>
      </div>
    </div>
  );
};

// 50cqw = 50% of container width (using CSS container query units)
const faceDepth = "50cqw";

const Instagram = ({
  data,
}: {
  data: Pick<InstagramFollows, "followerCount"> & {
    posts: Post[];
  };
}) => {
  const posts = useRef(data.posts);

  const [postIndex, setPostIndex] = useState(0);
  const [introPending, setIntroPending] = useState(true);

  const post = useMemo(() => {
    return posts.current[postIndex];
  }, [postIndex]);

  const nextPostImages = useMemo(() => {
    return posts.current[(postIndex + 1) % posts.current.length].images;
  }, [postIndex]);

  return (
    <Link
      href={instagramUrl}
      // Black backs the cube flips, but while the intro's blown-out print is
      // near white it would show as dark anti-aliased pixels in the corners
      className={cn(
        "@container w-full lg:w-45 aspect-square",
        introPending ? "bg-white" : "bg-black",
      )}
      contentBrightness="dark"
      style={{ containerType: "inline-size" }}
    >
      <div className="size-full" style={{ perspective: "300cqw" }}>
        <div
          className="relative size-full"
          style={{
            transformStyle: "preserve-3d",
            transform: `translateZ(calc(-1 * ${faceDepth}))`,
          }}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={post.id}
              className="absolute inset-0"
              style={{ backfaceVisibility: "hidden" }}
              initial={{ transform: `rotateY(90deg) translateZ(${faceDepth})` }}
              animate={{ transform: `rotateY(0deg) translateZ(${faceDepth})` }}
              exit={{ transform: `rotateY(-90deg) translateZ(${faceDepth})` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <PostView
                followerCount={data.followerCount}
                post={post}
                setPostIndex={setPostIndex}
                postsCount={posts.current.length}
                nextPostImages={nextPostImages}
                isInitial={postIndex === 0}
                intro={introPending}
                onIntroDone={() => setIntroPending(false)}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Link>
  );
};

export default Instagram;
