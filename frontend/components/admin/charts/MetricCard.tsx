"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: React.ReactNode;
  prefix?: string;
  suffix?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  prefix = "",
  suffix = ""
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === "up") return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (trend === "down") return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-green-500";
    if (trend === "down") return "text-red-500";
    return "text-gray-400";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {prefix}{value}{suffix}
        </div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-2 text-sm">
            {trend && (
              <span className={`flex items-center gap-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                {trendValue && <span>{trendValue}</span>}
              </span>
            )}
            {subtitle && (
              <span className="text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


