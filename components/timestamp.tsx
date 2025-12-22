"use client";

import {
  differenceInSeconds,
  format,
  formatDistanceToNowStrict,
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

    // If 1 month or greater, show the date instead
    if (fullUnit.startsWith("month") || fullUnit.startsWith("year")) {
      return format(d, "MMM d");
    }

    unit = fullUnit.slice(0, 1);
  }

  const suffix = ago ? " ago" : "";
  return `${value}${unit}${suffix}`;
};

const Timestamp = ({
  ago = false,
  className,
  date,
}: {
  ago?: boolean;
  className?: string;
  date: string | Date;
}) => {
  const [timestamp, setTimestamp] = useState(getTimestamp(date, ago));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(getTimestamp(date, ago));
    }, 60000);

    return () => clearInterval(interval);
  }, [date, ago]);

  return <p className={className}>{timestamp}</p>;
};

export default Timestamp;
