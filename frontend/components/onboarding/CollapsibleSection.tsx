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
    <Card className="border border-[#E0DFDC] shadow-linkedin-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#F3F2F0] transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-[#0A66C2]">{icon}</div>}
          <div className="text-left">
            <h3 className="font-semibold text-lg text-black">{title}</h3>
            {description && (
              <p className="text-sm text-[#666666] mt-1">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {aiGeneratedCount > 0 && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
              {aiGeneratedCount} AI-suggested
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-[#666666]" />
          ) : (
            <ChevronRight className="h-5 w-5 text-[#666666]" />
          )}
        </div>
      </button>

      {/* Content */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isExpanded ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-6 py-4 border-t border-[#E0DFDC] bg-white space-y-4">
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

