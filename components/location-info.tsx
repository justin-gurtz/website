"use client";

import {
  differenceInSeconds,
  formatDistanceToNowStrict,
  isValid,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import compact from "lodash/compact";
import filter from "lodash/filter";
import includes from "lodash/includes";
import isNumber from "lodash/isNumber";
import join from "lodash/join";
import values from "lodash/values";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { Movement } from "@/types/models";

type Location = Pick<
  Movement,
  "movedAt" | "city" | "region" | "country" | "timeZoneId"
>;

enum Mode {
  CurrentLocation,
  LastSeen,
  LocalTime,
}

const modes = filter(values(Mode), isNumber);

const getCurrentlyIn = (location: Location) => {
  const { city, region, country } = location;

  if (city || region || country) {
    let array: Array<string | null | undefined> = [];

    if (city) {
      const prefersRegion = includes(["US", "CA", "AU"], country);
      const suffix = prefersRegion ? region || country : country || region;

      array = [city, suffix];
    } else if (region) {
      array = [region, country];
    } else {
      array = [country];
    }

    const compacted = compact(array);

    if (compacted.length) {
      return join(compacted, ", ");
    }
  }

  return "unknown";
};

const getLocalTime = (location: Location) => {
  if (location.timeZoneId) {
    const now = new Date();
    const date = toZonedTime(now, location.timeZoneId);

    if (isValid(date)) {
      return date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "numeric",
        timeZoneName: "short",
      });
    }
  }

  return "unknown";
};

const getLastSeen = (location: Location) => {
  const d = new Date(location.movedAt);
  const seconds = differenceInSeconds(new Date(), d);

  if (seconds < 60) return "Just now";

  const distance = formatDistanceToNowStrict(d);
  return `${distance} ago`;
};

const LocationInfo = ({ location }: { location: Location }) => {
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
        return `Currently in: ${getCurrentlyIn(location)}`;
      case Mode.LocalTime:
        return `Local time: ${getLocalTime(location)}`;
      case Mode.LastSeen:
        return `Last seen: ${getLastSeen(location)}`;
      default:
        throw new Error(`Invalid elevator mode: ${mode}`);
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
