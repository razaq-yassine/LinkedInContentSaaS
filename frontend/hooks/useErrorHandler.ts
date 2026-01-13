"use client";

import { useState, useCallback, useEffect } from "react";
import { 
  parseAPIError, 
  requiresReauth, 
  requiresUpgrade, 
  AppError,
  formatErrorForToast 
} from "@/lib/error-types";
import { useRouter } from "next/navigation";

interface UseErrorHandlerOptions {
  showToast?: boolean;
  redirectOnAuth?: boolean;
  onUpgradeRequired?: () => void;
}

interface ErrorHandlerState {
  error: AppError | null;
  isError: boolean;
  isLoading: boolean;
}

interface ErrorHandlerActions {
  handleError: (error: unknown) => AppError;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  wrapAsync: <T>(fn: () => Promise<T>) => Promise<T | null>;
}

type UseErrorHandlerReturn = ErrorHandlerState & ErrorHandlerActions;

/**
 * React hook for handling errors in components
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { error, isError, handleError, clearError, wrapAsync } = useErrorHandler();
 *   
 *   const handleSubmit = async () => {
 *     const result = await wrapAsync(async () => {
 *       return await api.someAction();
 *     });
 *     
 *     if (result) {
 *       // Success
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       {isError && <ErrorMessage error={error} onDismiss={clearError} />}
 *       <button onClick={handleSubmit}>Submit</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const { showToast = true, redirectOnAuth = true, onUpgradeRequired } = options;
  const router = useRouter();
  
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((rawError: unknown): AppError => {
    const parsed = parseAPIError(rawError);
    setError(parsed);

    // Handle authentication errors
    if (requiresReauth(parsed) && redirectOnAuth) {
      // Clear stored credentials
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Redirect to login
      router.push("/login");
    }

    // Handle subscription errors
    if (requiresUpgrade(parsed) && onUpgradeRequired) {
      onUpgradeRequired();
    }

    return parsed;
  }, [redirectOnAuth, onUpgradeRequired, router]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const wrapAsync = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    clearError();
    
    try {
      const result = await fn();
      return result;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  return {
    error,
    isError: error !== null,
    isLoading,
    handleError,
    clearError,
    setLoading,
    wrapAsync,
  };
}

/**
 * Hook for displaying error toasts
 */
export function useErrorToast() {
  const showErrorToast = useCallback((error: unknown, addToast: (options: any) => void) => {
    const toastData = formatErrorForToast(error);
    addToast({
      title: toastData.title,
      description: toastData.description,
      variant: toastData.variant,
      duration: toastData.variant === "error" ? 7000 : 5000,
    });
  }, []);

  return { showErrorToast };
}

/**
 * Hook for retry logic
 */
export function useRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    onRetry?: (attempt: number) => void;
  } = {}
) {
  const { maxRetries = 3, delayMs = 1000, onRetry } = options;
  const [attempt, setAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const { error, handleError, clearError } = useErrorHandler({ showToast: false });

  const execute = useCallback(async (): Promise<T | null> => {
    setIsRetrying(true);
    let lastError: unknown = null;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        setAttempt(i);
        const result = await fn();
        clearError();
        setIsRetrying(false);
        return result;
      } catch (err) {
        lastError = err;
        const parsed = parseAPIError(err);
        
        if (!parsed.isRetryable || i >= maxRetries) {
          handleError(err);
          setIsRetrying(false);
          return null;
        }

        if (onRetry) {
          onRetry(i + 1);
        }

        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }

    if (lastError) {
      handleError(lastError);
    }
    setIsRetrying(false);
    return null;
  }, [fn, maxRetries, delayMs, onRetry, handleError, clearError]);

  return {
    execute,
    attempt,
    isRetrying,
    error,
  };
}

export default useErrorHandler;
