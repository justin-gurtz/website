"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import ErrorLayout from "@/components/error-layout";

const ErrorPage = ({
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
    <ErrorLayout
      title="Something went wrong"
      description="Sorry, we encountered an unexpected error."
      action={{ type: "button", onClick: reset, label: "Try again" }}
    />
  );
};

export default ErrorPage;
