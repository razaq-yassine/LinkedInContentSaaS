"use client";

import { useEffect, useState } from "react";
import "@khmyznikov/pwa-install";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "pwa-install": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "manifest-url"?: string;
          name?: string;
          description?: string;
          icon?: string;
        },
        HTMLElement
      >;
    }
  }
}

export function PWAInstall() {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const checkDevice = () => {
      // Check if device is mobile or tablet (width < 1024px matches Tailwind's lg breakpoint)
      const isMobile = window.innerWidth < 1024;
      setIsMobileOrTablet(isMobile);
    };

    const checkAuth = () => {
      // Check if user is logged in by checking for token in localStorage
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    };

    // Initial checks
    checkDevice();
    checkAuth();

    // Listen for resize events
    window.addEventListener("resize", checkDevice);

    // Listen for storage changes (login/logout)
    window.addEventListener("storage", checkAuth);

    // Also check auth on focus (handles same-tab logout)
    window.addEventListener("focus", checkAuth);

    return () => {
      window.removeEventListener("resize", checkDevice);
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("focus", checkAuth);
    };
  }, []);

  // Don't render on server, desktop, or when not logged in
  if (!isMounted || !isMobileOrTablet || !isLoggedIn) {
    return null;
  }

  return (
    <pwa-install
      manifest-url="/site.webmanifest"
      name="PostInAi"
      description="AI-Powered LinkedIn Content Generation"
      icon="/icons/android/android-launchericon-192-192.png"
    />
  );
}
