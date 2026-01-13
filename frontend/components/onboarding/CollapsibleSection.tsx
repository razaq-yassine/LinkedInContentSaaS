"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface Field {
  key: string;
  label: string;
  value: any;
  type: "text" | "textarea" | "number" | "select" | "array" | "chips";
  options?: string[];
  aiGenerated?: boolean;
  aiReasoning?: string;
  alternatives?: any[];
  editable?: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  fields: Field[];
  onFieldUpdate: (fieldKey: string, value: any) => void;
  defaultExpanded?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  description,
  fields,
  onFieldUpdate,
  defaultExpanded = false,
  icon,
  children,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const aiGeneratedCount = fields.filter((f) => f.aiGenerated).length;

  return (
    <Card className={cn(
      "overflow-hidden w-full max-w-full bg-white dark:bg-slate-800",
      // Mobile: edge-to-edge cards with minimal styling, no rounded corners, subtle border
      "rounded-none border-x-0 border-t border-b-0 border-[#E8E7E5] dark:border-slate-700 shadow-none",
      // Desktop: traditional card styling with rounded corners and shadow
      "md:rounded-xl md:border md:border-[#E0DFDC] md:shadow-linkedin-sm"
    )}>
      {/* Header - Mobile: native list item feel, Desktop: traditional card header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between transition-colors touch-manipulation overflow-hidden",
          // Mobile: compact native list item (48px touch target)
          "min-h-[52px] px-4 py-2.5 active:bg-[#F0EFED] dark:active:bg-slate-700",
          // Desktop: larger padding and hover state
          "md:min-h-0 md:px-6 md:py-4 md:hover:bg-[#F3F2F0] md:dark:hover:bg-slate-700"
        )}
      >
        <div className="flex items-center gap-3 md:gap-3 flex-1 min-w-0 overflow-hidden">
          {icon && (
            <div className={cn(
              "flex-shrink-0 flex items-center justify-center",
              // Mobile: colored icon background circle
              "w-10 h-10 rounded-full bg-[#EEF3F8] dark:bg-slate-700",
              // Desktop: no background
              "md:w-auto md:h-auto md:rounded-none md:bg-transparent md:dark:bg-transparent"
            )}>
              <div className="text-[#0A66C2] [&>svg]:h-5 [&>svg]:w-5">
                {icon}
              </div>
            </div>
          )}
          <div className="text-left min-w-0 flex-1 overflow-hidden">
            <h3 className={cn(
              "font-semibold text-black dark:text-white leading-tight",
              // Mobile: slightly larger text for readability
              "text-[15px]",
              // Desktop: standard size
              "md:text-lg"
            )}>{title}</h3>
            {description && (
              <p className={cn(
                "text-[#666666] dark:text-slate-400 mt-0.5 md:mt-1",
                // Mobile: single line truncated
                "text-[13px] truncate",
                // Desktop: full text
                "md:text-sm md:whitespace-normal"
              )}>{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 ml-2">
          {/* Desktop only: AI suggested badge */}
          {aiGeneratedCount > 0 && (
            <span className="hidden md:inline-flex text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
              {aiGeneratedCount} AI-suggested
            </span>
          )}
          {/* Mobile only: compact AI indicator */}
          {aiGeneratedCount > 0 && (
            <span className="md:hidden text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
              AI
            </span>
          )}
          {/* Chevron */}
          <ChevronDown className={cn(
            "text-[#999] dark:text-slate-400 transition-transform duration-200",
            // Mobile: smaller chevron
            "h-5 w-5",
            // Desktop: standard size
            "md:h-5 md:w-5",
            isExpanded ? "rotate-180" : "rotate-0"
          )} />
        </div>
      </button>

      {/* Content - Mobile: full-width, minimal padding. Desktop: standard padding */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isExpanded ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className={cn(
          "border-t border-[#E8E7E5] dark:border-slate-700 bg-[#FAFAFA] dark:bg-slate-800/50 overflow-hidden",
          // Mobile: tighter padding
          "px-4 py-3 space-y-2",
          // Desktop: standard padding
          "md:px-6 md:py-4 md:space-y-4 md:bg-white md:dark:bg-slate-800"
        )}>
          {children || (
            // Fallback: render fields as simple text if no children provided
            fields.map((field) => (
              <div key={field.key}>
                <div className="text-sm text-[#666666]">
                  <strong>{field.label}:</strong>{" "}
                  {typeof field.value === "object"
                    ? JSON.stringify(field.value)
                    : field.value}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

