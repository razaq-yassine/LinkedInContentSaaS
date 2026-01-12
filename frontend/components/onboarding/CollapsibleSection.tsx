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
    <Card className="border border-[#E0DFDC] dark:border-slate-700 shadow-linkedin-sm overflow-hidden rounded-xl md:rounded-lg w-full max-w-full bg-white dark:bg-slate-800">
      {/* Header - Mobile optimized with larger touch target (min 56px height) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full min-h-[56px] md:min-h-0 px-3 py-3 md:px-6 md:py-4 flex items-center justify-between hover:bg-[#F3F2F0] dark:hover:bg-slate-700 transition-colors active:bg-[#E8E7E5] dark:active:bg-slate-600 touch-manipulation overflow-hidden"
      >
        <div className="flex items-center gap-2.5 md:gap-3 flex-1 min-w-0 overflow-hidden">
          {icon && (
            <div className="flex-shrink-0 w-9 h-9 md:w-auto md:h-auto rounded-full md:rounded-none bg-[#EEF3F8] dark:bg-slate-700 md:bg-transparent md:dark:bg-transparent flex items-center justify-center">
              <div className="text-[#0A66C2] [&>svg]:h-4 [&>svg]:w-4 md:[&>svg]:h-5 md:[&>svg]:w-5">
                {icon}
              </div>
            </div>
          )}
          <div className="text-left min-w-0 flex-1 overflow-hidden">
            <h3 className="font-semibold text-sm md:text-lg text-black dark:text-white leading-tight truncate">{title}</h3>
            {/* Description: compact on mobile, full on desktop */}
            {description && (
              <p className="text-[11px] md:text-sm text-[#666666] dark:text-slate-400 mt-0.5 md:mt-1 truncate md:whitespace-normal">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0 ml-1.5">
          {aiGeneratedCount > 0 && (
            <span className="hidden md:inline-flex text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
              {aiGeneratedCount} AI-suggested
            </span>
          )}
          {/* Mobile: show compact AI indicator */}
          {aiGeneratedCount > 0 && (
            <span className="md:hidden text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
              AI
            </span>
          )}
          <div className="w-7 h-7 md:w-auto md:h-auto flex items-center justify-center rounded-full md:rounded-none bg-[#F3F2F0] dark:bg-slate-700 md:bg-transparent md:dark:bg-transparent flex-shrink-0">
            <ChevronDown className={cn(
              "h-4 w-4 md:h-5 md:w-5 text-[#666666] dark:text-slate-400 transition-transform duration-200",
              isExpanded ? "rotate-180" : "rotate-0"
            )} />
          </div>
        </div>
      </button>

      {/* Content - Optimized for mobile touch and readability */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isExpanded ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-3 py-3 md:px-6 md:py-4 border-t border-[#E0DFDC] dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2 md:space-y-4 overflow-hidden">
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

