"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export type LoaderEffect = 
  | "spin" 
  | "pulse" 
  | "bounce" 
  | "rotate-scale" 
  | "fade-rotate" 
  | "orbit" 
  | "wave"
  | "glow-pulse"
  | "shimmer"
  | "fade-spin"
  | "glow-heartbeat";

interface LogoLoaderProps {
  effect?: LoaderEffect;
  size?: "sm" | "md" | "lg" | "xl";
  showBackground?: boolean;
  className?: string;
  darkMode?: boolean;
  isLoading?: boolean; // Controls fade in/out states
}

const sizeMap = {
  sm: { logo: 40, container: 80 },
  md: { logo: 60, container: 120 },
  lg: { logo: 80, container: 160 },
  xl: { logo: 120, container: 240 },
};

export function LogoLoader({ 
  effect = "spin", 
  size = "md",
  showBackground = false,
  className = "",
  darkMode = false,
  isLoading = true
}: LogoLoaderProps) {
  const [mounted, setMounted] = useState(false);
  const dimensions = sizeMap[size];
  
  // Determine which logo to use based on dark mode
  const logoSrc = darkMode ? "/logo-dark.png" : "/logo.png";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }
  
  // Fade in/out opacity based on loading state
  const fadeOpacity = isLoading ? 1 : 0;

  const containerClasses = `
    relative flex items-center justify-center
    ${showBackground ? (darkMode ? "bg-gray-800/50" : "bg-white/10") + " rounded-full backdrop-blur-sm" : ""}
    ${className}
  `.trim();

  return (
    <div 
      className={containerClasses}
      style={{ width: dimensions.container, height: dimensions.container }}
    >
      {/* Spin Effect */}
      {effect === "spin" && (
        <div className="relative" style={{ width: dimensions.logo, height: dimensions.logo }}>
          <div className={`absolute inset-0 border-4 rounded-full animate-spin ${
            darkMode 
              ? 'border-cyan-400/30 border-t-cyan-400' 
              : 'border-cyan-500/30 border-t-cyan-500'
          }`} />
          <div className="absolute inset-2 flex items-center justify-center">
            <Image
              src={logoSrc}
              alt="Logo"
              width={dimensions.logo - 16}
              height={dimensions.logo - 16}
              className="animate-spin-reverse"
              style={{ animationDuration: "2s" }}
            />
          </div>
        </div>
      )}

      {/* Pulse Effect */}
      {effect === "pulse" && (
        <div className="relative" style={{ width: dimensions.logo, height: dimensions.logo }}>
          <div className={`absolute inset-0 rounded-full animate-ping ${
            darkMode ? 'bg-cyan-400/20' : 'bg-cyan-500/20'
          }`} />
          <div className={`absolute inset-0 rounded-full animate-pulse ${
            darkMode ? 'bg-cyan-400/10' : 'bg-cyan-500/10'
          }`} />
          <div className="relative z-10">
            <Image
              src={logoSrc}
              alt="Logo"
              width={dimensions.logo}
              height={dimensions.logo}
              className="animate-pulse"
            />
          </div>
        </div>
      )}

      {/* Bounce Effect */}
      {effect === "bounce" && (
        <div className="relative animate-bounce" style={{ width: dimensions.logo, height: dimensions.logo }}>
          <Image
            src={logoSrc}
            alt="Logo"
            width={dimensions.logo}
            height={dimensions.logo}
          />
        </div>
      )}

      {/* Rotate Scale Effect */}
      {effect === "rotate-scale" && (
        <div className="relative animate-rotate-scale" style={{ width: dimensions.logo, height: dimensions.logo }}>
          <Image
            src={logoSrc}
            alt="Logo"
            width={dimensions.logo}
            height={dimensions.logo}
          />
        </div>
      )}

      {/* Fade Rotate Effect */}
      {effect === "fade-rotate" && (
        <div className="relative animate-fade-rotate" style={{ width: dimensions.logo, height: dimensions.logo }}>
          <Image
            src={logoSrc}
            alt="Logo"
            width={dimensions.logo}
            height={dimensions.logo}
          />
        </div>
      )}

      {/* Orbit Effect */}
      {effect === "orbit" && (
        <div className="relative" style={{ width: dimensions.container, height: dimensions.container }}>
          <div className={`absolute inset-0 border-2 rounded-full animate-spin ${
            darkMode ? 'border-cyan-400/30' : 'border-cyan-500/30'
          }`} style={{ animationDuration: "3s" }} />
          <div className={`absolute inset-4 border-2 rounded-full animate-spin ${
            darkMode ? 'border-teal-400/30' : 'border-teal-500/30'
          }`} style={{ animationDuration: "2s", animationDirection: "reverse" }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Image
              src={logoSrc}
              alt="Logo"
              width={dimensions.logo}
              height={dimensions.logo}
              className="animate-pulse"
            />
          </div>
        </div>
      )}

      {/* Wave Effect */}
      {effect === "wave" && (
        <div className="relative animate-wave" style={{ width: dimensions.logo, height: dimensions.logo }}>
          <Image
            src={logoSrc}
            alt="Logo"
            width={dimensions.logo}
            height={dimensions.logo}
          />
        </div>
      )}

      {/* Glow Pulse Effect */}
      {effect === "glow-pulse" && (
        <div className="relative" style={{ width: dimensions.logo, height: dimensions.logo }}>
          <div className={`absolute inset-0 rounded-full blur-xl animate-pulse ${
            darkMode ? 'bg-cyan-400/40' : 'bg-cyan-500/40'
          }`} />
          <div className="relative z-10">
            <Image
              src={logoSrc}
              alt="Logo"
              width={dimensions.logo}
              height={dimensions.logo}
              className="drop-shadow-lg"
            />
          </div>
        </div>
      )}

      {/* Shimmer Effect */}
      {effect === "shimmer" && (
        <div className="relative overflow-hidden" style={{ width: dimensions.logo, height: dimensions.logo }}>
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent to-transparent animate-shimmer-loader ${
            darkMode ? 'via-cyan-400/50' : 'via-cyan-500/50'
          }`} />
          <div className="relative z-10">
            <Image
              src={logoSrc}
              alt="Logo"
              width={dimensions.logo}
              height={dimensions.logo}
            />
          </div>
        </div>
      )}

      {/* Fade Spin Effect */}
      {effect === "fade-spin" && (
        <div 
          className="relative flex items-center justify-center transition-opacity duration-500"
          style={{ 
            width: dimensions.logo, 
            height: dimensions.logo,
            opacity: fadeOpacity
          }}
        >
          {/* Glow heartbeat layers in background */}
          <div className={`absolute inset-0 rounded-full blur-2xl animate-glow-heartbeat ${
            darkMode ? 'bg-cyan-400/40' : 'bg-cyan-500/40'
          }`} style={{ 
            transform: 'scale(1.5)',
            animationDelay: '0s'
          }} />
          <div className={`absolute inset-0 rounded-full blur-xl animate-glow-heartbeat ${
            darkMode ? 'bg-cyan-400/50' : 'bg-cyan-500/50'
          }`} style={{ 
            transform: 'scale(1.3)',
            animationDelay: '0.1s'
          }} />
          {/* Spinning logo centered */}
          <div className="relative z-10 flex items-center justify-center">
            <Image
              src={logoSrc}
              alt="Logo"
              width={dimensions.logo}
              height={dimensions.logo}
              className="animate-fade-spin"
            />
          </div>
        </div>
      )}

      {/* Glow Heartbeat Effect */}
      {effect === "glow-heartbeat" && (
        <div 
          className="relative flex items-center justify-center transition-opacity duration-500"
          style={{ 
            width: dimensions.logo, 
            height: dimensions.logo,
            opacity: fadeOpacity
          }}
        >
          {/* Outer glow layers */}
          <div className={`absolute inset-0 rounded-full blur-2xl animate-glow-heartbeat ${
            darkMode ? 'bg-cyan-400/40' : 'bg-cyan-500/40'
          }`} style={{ 
            transform: 'scale(1.5)',
            animationDelay: '0s'
          }} />
          <div className={`absolute inset-0 rounded-full blur-xl animate-glow-heartbeat ${
            darkMode ? 'bg-cyan-400/50' : 'bg-cyan-500/50'
          }`} style={{ 
            transform: 'scale(1.3)',
            animationDelay: '0.1s'
          }} />
          {/* Logo centered */}
          <div className="relative z-10 flex items-center justify-center">
            <Image
              src={logoSrc}
              alt="Logo"
              width={dimensions.logo}
              height={dimensions.logo}
              className="animate-heartbeat-pulse"
            />
          </div>
        </div>
      )}
    </div>
  );
}

