"use client";

import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface TokenUsageDetails {
  [key: string]: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

interface TokenUsageProps {
  tokenUsage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    model?: string;
    provider?: string;
    details?: TokenUsageDetails;
  } | null;
  className?: string;
}

export default function TokenUsage({ tokenUsage, className = "" }: TokenUsageProps) {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);
  const [hovered, setHovered] = useState(false);

  // Auto-hide after 30 seconds (increased from 10), but keep visible if hovered
  useEffect(() => {
    if (!tokenUsage || hovered) return;
    
    const timer = setTimeout(() => {
      setVisible(false);
    }, 30000); // 30 seconds instead of 10

    return () => clearTimeout(timer);
  }, [tokenUsage, hovered]);

  // Show when new token usage arrives
  useEffect(() => {
    if (tokenUsage) {
      setVisible(true);
      setExpanded(false); // Reset expansion when new data arrives
    }
  }, [tokenUsage]);

  if (!tokenUsage) return null;

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getProviderDisplay = () => {
    if (tokenUsage.provider) {
      return tokenUsage.provider.charAt(0).toUpperCase() + tokenUsage.provider.slice(1);
    }
    return "AI";
  };

  const hasDetails = tokenUsage.details && Object.keys(tokenUsage.details).length > 0;

  return (
    <div
      className={`fixed bottom-4 right-4 z-[100] transition-opacity duration-300 ${className}`}
      onMouseEnter={() => {
        setHovered(true);
        setVisible(true);
      }}
      onMouseLeave={() => setHovered(false)}
      style={{ 
        opacity: visible || hovered ? 1 : 0.4,
        pointerEvents: 'auto'
      }}
    >
      <div className="bg-gray-900/98 backdrop-blur-sm text-white rounded-lg shadow-2xl border-2 border-gray-600/70 overflow-hidden min-w-[300px]">
        {/* Header */}
        <div
          className="px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-800/70 transition-colors bg-gray-800/30"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-200">
              {getProviderDisplay()} Usage
            </span>
            {tokenUsage.model && (
              <span className="text-xs text-gray-400">({tokenUsage.model})</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-semibold text-blue-300">
              {formatNumber(tokenUsage.total_tokens)}
            </span>
            {hasDetails && (
              expanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-gray-300" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-300" />
              )
            )}
          </div>
        </div>

        {/* Summary (always visible) */}
        <div className="px-3 pb-2.5 border-t border-gray-700/50 pt-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Input:</span>{" "}
                <span className="font-mono font-semibold text-green-300">
                  {formatNumber(tokenUsage.input_tokens)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Output:</span>{" "}
                <span className="font-mono font-semibold text-orange-300">
                  {formatNumber(tokenUsage.output_tokens)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Total:</span>{" "}
                <span className="font-mono font-semibold text-blue-300">
                  {formatNumber(tokenUsage.total_tokens)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && hasDetails && (
          <div className="px-3 pb-2 border-t border-gray-700/50 pt-2 space-y-1.5">
            <div className="text-xs font-medium text-gray-300 mb-1">Breakdown:</div>
            {Object.entries(tokenUsage.details!).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between text-xs py-0.5"
              >
                <span className="text-gray-400 capitalize">
                  {key.replace(/_/g, " ")}:
                </span>
                <span className="font-mono text-gray-200">
                  {formatNumber(value.total_tokens)} ({formatNumber(value.input_tokens)} + {formatNumber(value.output_tokens)})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

