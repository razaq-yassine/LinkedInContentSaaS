/**
 * Error types and utilities for error handling
 */

export interface AppError {
  message: string;
  actionHint?: string;
  id?: string;
  isRetryable?: boolean;
  code?: string;
  statusCode?: number;
}

/**
 * Parse an unknown error into an AppError
 */
export function parseAPIError(error: unknown): AppError {
  if (error instanceof Error) {
    return {
      message: error.message || "An unexpected error occurred",
      isRetryable: false,
    };
  }

  if (typeof error === "object" && error !== null) {
    const err = error as any;
    return {
      message: err.message || err.detail || "An unexpected error occurred",
      actionHint: err.actionHint,
      id: err.id,
      code: err.code,
      statusCode: err.statusCode || err.status,
      isRetryable: err.isRetryable ?? (err.statusCode >= 500 || err.status >= 500),
    };
  }

  return {
    message: String(error) || "An unexpected error occurred",
    isRetryable: false,
  };
}

/**
 * Check if error requires re-authentication
 */
export function requiresReauth(error: AppError): boolean {
  return error.statusCode === 401 || error.code === "UNAUTHORIZED";
}

/**
 * Check if error requires subscription upgrade
 */
export function requiresUpgrade(error: AppError): boolean {
  return error.statusCode === 403 && error.code === "SUBSCRIPTION_REQUIRED";
}

/**
 * Format error for toast notification
 */
export function formatErrorForToast(error: unknown): {
  title: string;
  description: string;
  variant: "error" | "warning" | "info";
} {
  const appError = parseAPIError(error);

  return {
    title: "Error",
    description: appError.message,
    variant: "error" as const,
  };
}
