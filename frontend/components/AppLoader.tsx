"use client";

import { useEffect, useState } from "react";
import { LogoLoader } from "./LogoLoader";
import { LOADER_CONFIG } from "@/config/loader.config";

interface AppLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  isLoading?: boolean;
  className?: string;
}

export function AppLoader({
  size = LOADER_CONFIG.defaultSize,
  message,
  isLoading = true,
  className = "",
}: AppLoaderProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Auto-detect dark mode from document
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    };
    
    checkDarkMode();
    
    // Watch for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <LogoLoader
        effect={LOADER_CONFIG.defaultEffect}
        size={size}
        darkMode={darkMode}
        isLoading={isLoading}
      />
      {message && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
          {message}
        </p>
      )}
    </div>
  );
}
