"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import usePageIsVisible from "@/hooks/use-page-is-visible";

const Refresh = ({ every }: { every: number }) => {
  const { refresh } = useRouter();
  const pageIsVisible = usePageIsVisible();
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!pageIsVisible) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      refresh();
    }

    const interval = setInterval(refresh, every * 1000);

    return () => clearInterval(interval);
  }, [every, refresh, pageIsVisible]);

  return null;
};

export default Refresh;
