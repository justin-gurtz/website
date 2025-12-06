"use client";

import { differenceInSeconds, formatDistanceToNowStrict } from "date-fns";
import { useEffect, useState } from "react";

const getTimestamp = (date: string | Date) => {
  const d = new Date(date);
  const seconds = differenceInSeconds(new Date(), d);

  let value = "1";
  let unit = "m";

  if (seconds >= 60) {
    const distance = formatDistanceToNowStrict(d);
    const parts = distance.split(" ");

    value = parts[0];
    unit = parts[1].slice(0, 1);
  }

  return `${value}${unit} ago`;
};

const Timestamp = ({
  date,
  className,
}: {
  date: string | Date;
  className?: string;
}) => {
  const [timestamp, setTimestamp] = useState(getTimestamp(date));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(getTimestamp(date));
    }, 60000);

    return () => clearInterval(interval);
  }, [date]);

  return <p className={className}>{timestamp}</p>;
};

export default Timestamp;
