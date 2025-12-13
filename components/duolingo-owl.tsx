"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { cn } from "@/utils/tailwind";

const DuolingoOwl = () => {
  const [isVisible, setIsVisible] = useState(false);

  const handleLoad = useCallback(() => {
    setIsVisible(true);
  }, []);

  return (
    <Image
      onLoad={handleLoad}
      src="/images/duo-owl.webp"
      alt="Duolingo Owl"
      width={100}
      height={100}
      className={cn(
        "absolute bottom-0 right-[10%] @xs:right-[15%] @sm:right-[20%] transition-transform duration-500",
        isVisible ? "translate-y-0" : "translate-y-full",
      )}
    />
  );
};

export default DuolingoOwl;
