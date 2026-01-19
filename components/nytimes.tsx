"use client";

import { AnimatePresence, motion } from "motion/react";
import localFont from "next/font/local";
import { useCallback, useEffect, useRef, useState } from "react";
import usePageIsVisible from "@/hooks/use-page-is-visible";
import type { NYTimesData } from "@/types/models";
import { cn } from "@/utils/tailwind";
import Link from "./link";

const cheltenham = localFont({
  src: [
    {
      path: "../public/fonts/cheltenham/700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-cheltenham",
});

const NYTimesLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    className={className}
    aria-label="NY Times"
    role="img"
  >
    <g transform="matrix(1.662571 0 0 1.662571 5.095437 -18.288283)">
      <path d="M13 39.2V25.5l-4.5 1.8s-1.1 2.3-.9 5.7c.1 2.7 1.7 5.8 2.9 7.2zM25.1 11c1 .1 2.7.6 3.9 1.6 1.3 1.2 1.6 3.1 1.2 4.8-.4 1.5-.9 2.3-2.5 3.4S24.9 22 24.9 22v6.6L28 31l-3.1 2.8v9s2.6-2.1 4.6-6.2c0 0 .1-.2.3-.7.2 1.1.1 3.4-1.2 6.2-1 2.2-2.7 4.2-5 5.4-3.9 2.1-6.9 2.3-10 1.7-3.7-.7-7.1-2.7-9.3-6.2C2.7 40.5 2 37.7 2 34.6c.1-6.1 4.8-11.3 10.2-13.3.7-.2.9-.4 1.8-.5-.4.3-.9.6-1.5 1-1.7 1.1-3.2 3.3-3.9 5L19 22.3v14.1l-8.3 4.1c1 1.3 3.9 3.2 6.4 3.5 4.2.5 7-1.1 7-1.1v-9.2L21 31l3.1-2.4V22c-1.8-.2-4.3-1-5.5-1.3-1.9-.4-8.1-2.1-9.1-2.3-1-.1-2.2-.1-2.9.5s-1.2 1.8-.9 2.8c.2.6.6.9.9 1.2 0 0-.4 0-1-.4-1.2-.7-2.1-2-2.2-3.7A6.2 6.2 0 0 1 6 13.4c1.6-1 3.4-1.6 5.5-1.3 3.1.4 7.2 2.1 10.9 3 1.4.3 2.5.4 3.5-.1.5-.3 1.3-1.2.6-2.3-.8-1.3-2.3-1.3-3.6-1.5 1.2-.2 1.4-.2 2.2-.2" />
    </g>
  </svg>
);

const NYTimes = ({ data: d }: { data: Pick<NYTimesData, "title" | "url"> }) => {
  const [data, setData] = useState(d);
  const [overflowHidden, setOverflowHidden] = useState(true);
  const [disabled, setDisabled] = useState(true);

  const isFirstRender = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pageIsVisible = usePageIsVisible();

  useEffect(() => {
    if (!pageIsVisible) return;
    if (disabled) return;
    if (data.title === d.title) return;

    setDisabled(true);

    timeoutRef.current = setTimeout(() => {
      setOverflowHidden(true);
      setData(d);
    }, 200);
  }, [d, data, pageIsVisible, disabled]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleAnimationComplete = useCallback(() => {
    isFirstRender.current = false;

    setOverflowHidden(false);
    setDisabled(false);
  }, []);

  return (
    <div
      className={cn(
        "relative w-full lg:w-[11.25rem] h-[11.25rem]",
        overflowHidden && "overflow-hidden rounded-squircle-outside",
      )}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={data.title}
          initial={{ transform: "translateY(100%)", marginTop: "0.75rem" }}
          animate={{ transform: "translateY(0)", marginTop: 0 }}
          exit={{
            transform: "translateY(-100%)",
            marginTop: "-0.75rem",
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 1.25,
            ease: [0.16, 1, 0.3, 1],
            opacity: { times: [0, 0.5, 1] },
            delay: isFirstRender.current ? 0.3 : 0,
          }}
          onAnimationComplete={handleAnimationComplete}
          className="size-full"
        >
          <Link
            href={data.url}
            className="@container size-full"
            standardBackground
            contentBrightness="light"
            disabled={disabled}
          >
            <div className="size-full px-3.5 pb-3.5 pt-3 @xs:px-4.5 @xs:pb-4.5 @xs:pt-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 justify-between">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Last read article
                </p>
                <NYTimesLogo className="size-5 -mr-0.5 fill-black dark:fill-white" />
              </div>
              <p
                className={cn(
                  "line-clamp-5 text-lg lg:text-base leading-tight text-pretty font-serif",
                  cheltenham.className,
                )}
              >
                {data.title}
              </p>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default NYTimes;
