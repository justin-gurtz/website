"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import useIsOnline from "@/hooks/use-is-online";
import usePageIsVisible from "@/hooks/use-page-is-visible";

const Refresh = ({ every }: { every: number }) => {
  const { refresh } = useRouter();

  const isOnline = useIsOnline();
  const pageIsVisible = usePageIsVisible();
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!isOnline) return;
    if (!pageIsVisible) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      refresh();
    }

    const interval = setInterval(refresh, every * 1000);

    return () => clearInterval(interval);
  }, [every, refresh, pageIsVisible, isOnline]);

  return null;
};

export default Refresh;
