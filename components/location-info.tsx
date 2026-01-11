"use client";

import {
  differenceInSeconds,
  formatDistanceToNowStrict,
  isValid,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import filter from "lodash/filter";
import isNumber from "lodash/isNumber";
import values from "lodash/values";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { CurrentLocation } from "@/types/models";

enum Mode {
  CurrentLocation,
  LastSeen,
  LocalTime,
}

const modes = filter(values(Mode), isNumber);

const getLocalTime = (location: CurrentLocation) => {
  const now = new Date();
  const date = toZonedTime(now, location.timeZoneId);

  if (isValid(date)) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "numeric",
      timeZoneName: "short",
    });
  }
};

const getLastSeen = (location: CurrentLocation) => {
  const d = new Date(location.timestamp);
  const seconds = differenceInSeconds(new Date(), d);

  if (seconds < 60) return "Just now";

  const distance = formatDistanceToNowStrict(d);
  return `${distance} ago`;
};

const LocationInfo = ({ location }: { location: CurrentLocation }) => {
  const [mode, setMode] = useState(modes[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMode((prev) => (prev + 1) % modes.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const children = useMemo(() => {
    switch (mode) {
      case Mode.CurrentLocation:
        return `Currently in: ${location.name}`;
      case Mode.LocalTime:
        return `Local time: ${getLocalTime(location)}`;
      case Mode.LastSeen:
        return `Last seen: ${getLastSeen(location)}`;
      default:
        throw new Error(`Invalid mode: ${mode}`);
    }
  }, [mode, location]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.p
        key={mode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-sm text-neutral-500 leading-tight line-clamp-1"
      >
        {children}
      </motion.p>
    </AnimatePresence>
  );
};

export default LocationInfo;
