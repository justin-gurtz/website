import startsWith from "lodash/startsWith";
import NextLink from "next/link";
import { useMemo } from "react";
import { cn } from "@/utils/tailwind";

const Link = ({
  href,
  className,
  children,
  contentBrightness,
  style,
  disabled,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  contentBrightness: "light" | "dark";
  style?: React.CSSProperties;
  disabled?: boolean;
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
        "block relative overflow-hidden rounded-squircle z-0 transition-[box-shadow,scale,z-index] duration-200",
        disabled
          ? "pointer-events-none"
          : [
              contentBrightness === "light"
                ? "hover:shadow-2xl/15 dark:hover:shadow-2xl/75"
                : "hover:shadow-2xl/75",
              "hover:z-10 hover:scale-102 active:scale-98 active:shadow-none!",
            ],
        className,
      )}
      style={style}
    >
      {children}
      <div
        className={cn(
          contentBrightness === "light"
            ? "border-[1px] sm:border-[0.5px] border-neutral-200 sm:border-neutral-300 dark:border-neutral-700"
            : "dark:border-[1px] sm:dark:border-[0.5px] dark:border-neutral-700",
          "absolute inset-0 pointer-events-none rounded-squircle",
        )}
      />
    </NextLink>
  );
};

export default Link;
