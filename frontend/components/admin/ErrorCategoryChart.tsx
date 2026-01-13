"use client";

import React from "react";

interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

interface Props {
  categories: CategoryBreakdown[];
}

const CATEGORY_COLORS: Record<string, string> = {
  authentication: "bg-purple-500",
  authorization: "bg-indigo-500",
  validation: "bg-blue-500",
  database: "bg-cyan-500",
  network: "bg-teal-500",
  external_service: "bg-green-500",
  file_operation: "bg-lime-500",
  payment: "bg-yellow-500",
  rate_limit: "bg-orange-500",
  resource: "bg-red-500",
  internal: "bg-pink-500",
  configuration: "bg-gray-500",
};

const CATEGORY_LABELS: Record<string, string> = {
  authentication: "Authentication",
  authorization: "Authorization",
  validation: "Validation",
  database: "Database",
  network: "Network",
  external_service: "External Services",
  file_operation: "File Operations",
  payment: "Payment",
  rate_limit: "Rate Limit",
  resource: "Resource",
  internal: "Internal",
  configuration: "Configuration",
};

export default function ErrorCategoryChart({ categories }: Props) {
  if (!categories || categories.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500">
        No category data available
      </div>
    );
  }

  const total = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="space-y-4">
      {/* Donut Chart Representation */}
      <div className="flex items-center justify-center">
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {categories.reduce((acc, category, index) => {
              const startAngle = acc.offset;
              const angle = (category.count / total) * 360;
              const endAngle = startAngle + angle;
              
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              
              const x1 = 50 + 40 * Math.cos(startRad);
              const y1 = 50 + 40 * Math.sin(startRad);
              const x2 = 50 + 40 * Math.cos(endRad);
              const y2 = 50 + 40 * Math.sin(endRad);
              
              const largeArc = angle > 180 ? 1 : 0;
              
              const colorClass = CATEGORY_COLORS[category.category] || "bg-gray-400";
              const color = colorClass.replace("bg-", "");
              
              const colorMap: Record<string, string> = {
                "purple-500": "#a855f7",
                "indigo-500": "#6366f1",
                "blue-500": "#3b82f6",
                "cyan-500": "#06b6d4",
                "teal-500": "#14b8a6",
                "green-500": "#22c55e",
                "lime-500": "#84cc16",
                "yellow-500": "#eab308",
                "orange-500": "#f97316",
                "red-500": "#ef4444",
                "pink-500": "#ec4899",
                "gray-500": "#6b7280",
                "gray-400": "#9ca3af",
              };
              
              acc.paths.push(
                <path
                  key={category.category}
                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={colorMap[color] || "#6b7280"}
                  className="transition-opacity hover:opacity-80"
                />
              );
              
              acc.offset = endAngle;
              return acc;
            }, { paths: [] as React.ReactElement[], offset: 0 }).paths}
            
            {/* Center hole */}
            <circle cx="50" cy="50" r="25" className="fill-white dark:fill-slate-800" />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{total}</span>
            <span className="text-xs text-gray-500">Total</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        {categories.slice(0, 6).map((category) => (
          <div key={category.category} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${CATEGORY_COLORS[category.category] || "bg-gray-400"}`} />
            <span className="text-gray-600 dark:text-gray-400 truncate">
              {CATEGORY_LABELS[category.category] || category.category}
            </span>
            <span className="text-gray-400 ml-auto">{category.count}</span>
          </div>
        ))}
      </div>

      {/* Show more if needed */}
      {categories.length > 6 && (
        <p className="text-xs text-center text-gray-400">
          +{categories.length - 6} more categories
        </p>
      )}
    </div>
  );
}
