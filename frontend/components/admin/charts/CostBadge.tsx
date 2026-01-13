"use client";

interface CostBadgeProps {
  cost: number;
  thresholds?: {
    low: number;
    medium: number;
  };
}

export function CostBadge({
  cost,
  thresholds = { low: 0.01, medium: 0.10 }
}: CostBadgeProps) {
  const getColorClass = () => {
    if (cost < thresholds.low) {
      return "bg-green-100 text-green-800 border-green-200";
    } else if (cost < thresholds.medium) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else {
      return "bg-red-100 text-red-800 border-red-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColorClass()}`}
    >
      ${cost.toFixed(4)}
    </span>
  );
}


