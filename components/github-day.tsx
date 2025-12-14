"use client";

import { useEffect, useMemo, useState } from "react";
import type { GitContributionLevel } from "@/types/models";
import { cn } from "@/utils/tailwind";

const Day = ({
  contributionLevel,
  animated = false,
}: {
  contributionLevel: GitContributionLevel;
  animated?: boolean;
}) => {
  const [isAnimated, setIsAnimated] = useState(!animated);

  const defaultBg = "bg-black/5 dark:bg-white/10";
  const { finalBg, delay } = useMemo(() => {
    switch (contributionLevel) {
      case "FOURTH_QUARTILE":
        return { finalBg: "bg-green-700 dark:bg-green-400", delay: 0 };
      case "THIRD_QUARTILE":
        return { finalBg: "bg-green-600 dark:bg-green-600", delay: 250 };
      case "SECOND_QUARTILE":
        return { finalBg: "bg-green-500 dark:bg-green-700", delay: 500 };
      case "FIRST_QUARTILE":
        return { finalBg: "bg-green-300 dark:bg-green-800", delay: 750 };
      default:
        return { finalBg: defaultBg, delay: 0 };
    }
  }, [contributionLevel]);

  useEffect(() => {
    if (!animated) return;

    const finalDelay = (delay + 250) * Math.random();

    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, finalDelay);

    return () => clearTimeout(timer);
  }, [delay, animated]);

  return (
    <td className="relative size-2.5 rounded-xs overflow-hidden">
      <div className={cn("absolute inset-0 rounded-xs", defaultBg)} />
      {finalBg !== defaultBg && (
        <div
          className={cn(
            "absolute inset-0 rounded-xs transition-opacity duration-1500",
            finalBg,
            isAnimated ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      <div className="absolute inset-0 rounded-xs outline outline-[rgba(0,0,0,0.05)] dark:outline-none -outline-offset-1" />
    </td>
  );
};

export default Day;
