"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/utils/tailwind";

const DuolingoOwl = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const timeout = setTimeout(() => setIsReady(true), 2000);
    return () => clearTimeout(timeout);
  }, [isLoaded]);

  return (
    <Image
      onLoad={handleLoad}
      src="/images/duolingo/owl.webp"
      alt="Duolingo Owl"
      width={100}
      height={100}
      loading="lazy"
      unoptimized
      className={cn(
        "absolute bottom-0 right-[10%] @xs:right-[15%] @sm:right-[20%] transition-transform duration-500",
        isReady ? "translate-y-0" : "translate-y-full",
      )}
    />
  );
};

export default DuolingoOwl;
