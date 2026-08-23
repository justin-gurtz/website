"use client";

import {
  differenceInSeconds,
  format,
  formatDistanceToNowStrict,
  isAfter,
  startOfDay,
  subYears,
} from "date-fns";
import { useEffect, useState } from "react";

const getTimestamp = (date: string | Date, ago: boolean) => {
  const d = new Date(date);
  const seconds = differenceInSeconds(new Date(), d);

  let value = "1";
  let unit = "m";

  if (seconds >= 60) {
    const distance = formatDistanceToNowStrict(d);
    const parts = distance.split(" ");

    value = parts[0];
    const fullUnit = parts[1];

    // If 1 month or greater, show the date instead. Within the last year
    // a bare "Aug 23" is unambiguous; on or before this calendar day last
    // year it isn't, so include the year. Compared by calendar day so the
    // time of day can't flip it, and subYears handles Feb 29 (-> Feb 28)
    if (fullUnit.startsWith("month") || fullUnit.startsWith("year")) {
      const cutoff = startOfDay(subYears(new Date(), 1));
      const withinYear = isAfter(startOfDay(d), cutoff);
      return format(d, withinYear ? "MMM d" : "MMM d, yyyy");
    }

    unit = fullUnit.slice(0, 1);
  }

  const suffix = ago ? " ago" : "";
  return `${value}${unit}${suffix}`;
};

const Timestamp = ({
  ago = false,
  as: Component = "p",
  className,
  date,
}: {
  ago?: boolean;
  as?: "p" | "span";
  className?: string;
  date: string | Date;
}) => {
  const [timestamp, setTimestamp] = useState(getTimestamp(date, ago));

  useEffect(() => {
    setTimestamp(getTimestamp(date, ago));

    const interval = setInterval(() => {
      setTimestamp(getTimestamp(date, ago));
    }, 60000);

    return () => clearInterval(interval);
  }, [date, ago]);

  // Relative time drifts between the server render and hydration; the
  // effect above recomputes it on mount, so skip the hydration diff
  return (
    <Component className={className} suppressHydrationWarning>
      {timestamp}
    </Component>
  );
};

export default Timestamp;
