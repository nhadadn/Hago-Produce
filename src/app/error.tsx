"use client";

import { useEffect } from "react";
import { clientLogger as logger } from "@/lib/logger/client-logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-hago-gray-100 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="text-8xl font-bold text-hago-error mb-4">500</div>
        <h1 className="text-2xl font-bold text-hago-gray-900 mb-2">
          Error del servidor
        </h1>
        <p className="text-hago-gray-600 mb-6">
          Ocurrió un error inesperado. Por favor, intenta de nuevo más tarde.
        </p>
        <button
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-md bg-hago-primary-800 px-8 text-sm font-medium text-white transition-colors hover:bg-hago-primary-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hago-primary-900 disabled:pointer-events-none disabled:opacity-50"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
