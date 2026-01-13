"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TrendPoint {
  timestamp: string;
  count: number;
  critical: number;
  error: number;
  warning: number;
}

interface Props {
  timeRange: string;
}

export default function ErrorTrendChart({ timeRange }: Props) {
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxCount, setMaxCount] = useState(1);

  useEffect(() => {
    async function loadTrends() {
      setLoading(true);
      try {
        const token = localStorage.getItem("admin_token");
        const response = await fetch(
          `${API_URL}/api/admin/error-dashboard/trends?time_range=${timeRange}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.ok) {
          const result = await response.json();
          setData(result.data_points || []);
          const max = Math.max(...(result.data_points || []).map((p: TrendPoint) => p.count), 1);
          setMaxCount(max);
        }
      } catch (err) {
        console.error("Failed to load trends:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadTrends();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  const chartHeight = 160;
  const barWidth = Math.max(4, Math.floor(600 / data.length) - 2);

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="relative h-48 overflow-x-auto">
        <div className="absolute inset-0 flex items-end gap-1" style={{ minWidth: data.length * (barWidth + 2) }}>
          {data.map((point, index) => {
            const height = (point.count / maxCount) * chartHeight;
            const criticalHeight = (point.critical / maxCount) * chartHeight;
            const errorHeight = (point.error / maxCount) * chartHeight;
            const warningHeight = (point.warning / maxCount) * chartHeight;
            
            return (
              <div
                key={index}
                className="relative group"
                style={{ width: barWidth }}
              >
                {/* Stacked bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 flex flex-col-reverse rounded-t"
                  style={{ height: Math.max(height, 2) }}
                >
                  {point.critical > 0 && (
                    <div
                      className="bg-red-500 w-full"
                      style={{ height: criticalHeight }}
                    />
                  )}
                  {point.error > 0 && (
                    <div
                      className="bg-orange-500 w-full"
                      style={{ height: errorHeight }}
                    />
                  )}
                  {point.warning > 0 && (
                    <div
                      className="bg-yellow-500 w-full"
                      style={{ height: warningHeight }}
                    />
                  )}
                  {point.count - point.critical - point.error - point.warning > 0 && (
                    <div
                      className="bg-blue-500 w-full rounded-t"
                      style={{ height: Math.max(height - criticalHeight - errorHeight - warningHeight, 0) }}
                    />
                  )}
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    <p className="font-medium">{point.timestamp}</p>
                    <p>Total: {point.count}</p>
                    {point.critical > 0 && <p className="text-red-400">Critical: {point.critical}</p>}
                    {point.error > 0 && <p className="text-orange-400">Error: {point.error}</p>}
                    {point.warning > 0 && <p className="text-yellow-400">Warning: {point.warning}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-400 pointer-events-none">
          <span>{maxCount}</span>
          <span>{Math.floor(maxCount / 2)}</span>
          <span>0</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-gray-600 dark:text-gray-400">Critical</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span className="text-gray-600 dark:text-gray-400">Error</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span className="text-gray-600 dark:text-gray-400">Warning</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Info</span>
        </div>
      </div>
    </div>
  );
}
