import startsWith from "lodash/startsWith";
import NextLink from "next/link";
import { useMemo } from "react";
import { cn } from "@/utils/tailwind";

const Link = ({
  href,
  className,
  children,
  contentBrightness,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  contentBrightness: "light" | "dark";
}) => {
  const target = useMemo(() => {
    if (startsWith(href, "http")) {
      return "_blank";
    }

    return undefined;
  }, [href]);

  return (
    <NextLink
      target={target}
      href={href}
      className={cn(
        contentBrightness === "light"
          ? "border-[0.5px] border-neutral-300 dark:border-neutral-700 hover:shadow-2xl/25 dark:hover:shadow-2xl/75"
          : "dark:border-[0.5px] dark:border-neutral-700 hover:shadow-2xl/75",
        "block relative overflow-hidden rounded-xl z-0 hover:z-10 hover:scale-102 active:scale-98 active:!shadow-none transition-[box-shadow,scale,z-index] duration-200",
        className,
      )}
    >
      {children}
    </NextLink>
  );
};

export default Link;
