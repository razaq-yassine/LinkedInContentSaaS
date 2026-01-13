"use client";

import React from "react";
import { AlertTriangle, X, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppError } from "@/lib/error-types";

interface ErrorMessageProps {
  error: AppError | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  showErrorId?: boolean;
  className?: string;
}

/**
 * Error message component for displaying user-friendly errors
 */
export function ErrorMessage({
  error,
  onDismiss,
  onRetry,
  showErrorId = false,
  className = "",
}: ErrorMessageProps): React.ReactElement | null {
  if (!error) return null;

  return (
    <div
      className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {error.message}
          </p>
          
          {error.actionHint && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-300 flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              {error.actionHint}
            </p>
          )}
          
          {showErrorId && error.id && (
            <p className="mt-2 text-xs text-red-500 dark:text-red-400 font-mono">
              Reference: {error.id}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {onRetry && error.isRetryable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline error message for form fields
 */
export function InlineError({
  message,
  className = "",
}: {
  message: string;
  className?: string;
}): React.ReactElement {
  return (
    <p className={`text-sm text-red-600 dark:text-red-400 mt-1 ${className}`}>
      {message}
    </p>
  );
}

/**
 * Banner error for page-level errors
 */
export function ErrorBanner({
  error,
  onDismiss,
  onRetry,
}: {
  error: AppError | null;
  onDismiss?: () => void;
  onRetry?: () => void;
}): React.ReactElement | null {
  if (!error) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white py-3 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error.message}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {onRetry && error.isRetryable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="text-white hover:bg-red-600"
            >
              Try Again
            </Button>
          )}
          
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-white hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorMessage;
