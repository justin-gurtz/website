"use client";

import "@/globals.css";
import * as Sentry from "@sentry/nextjs";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { useEffect } from "react";
import ErrorLayout from "@/components/error-layout";
import { getBodyClassName } from "@/constants";

const bodyClassName = getBodyClassName(
  `${GeistSans.variable} ${GeistMono.variable}`,
);

const GlobalError = ({
  error,
  reset,
}: {
  error: globalThis.Error & { digest?: string };
  reset: () => void;
}) => {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className={bodyClassName}>
        <ErrorLayout
          title="Something went wrong"
          description="Sorry, we encountered an unexpected error."
          action={{ type: "button", onClick: reset, label: "Try again" }}
        />
      </body>
    </html>
  );
};

export default GlobalError;
