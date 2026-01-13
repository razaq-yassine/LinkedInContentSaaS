"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AISuggestionProps {
  reasoning?: string;
  alternatives?: any[];
  onSelectAlternative?: (value: any) => void;
  onRegeneratesuggestion?: () => void;
  compact?: boolean;
}

export default function AISuggestion({
  reasoning,
  alternatives = [],
  onSelectAlternative,
  onRegenerateSuggestion,
  compact = false,
}: AISuggestionProps) {
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-help"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              AI
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">{reasoning || "AI-generated based on your profile"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-900">
            AI-Generated Suggestion
          </span>
        </div>
        {onRegenerateSuggestion && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerateSuggestion}
            className="h-auto py-1 px-2 text-purple-700 hover:text-purple-900 hover:bg-purple-100"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Regenerate
          </Button>
        )}
      </div>

      {/* Reasoning */}
      {reasoning && (
        <p className="text-sm text-purple-800 italic">
          💡 {reasoning}
        </p>
      )}

      {/* Alternatives */}
      {alternatives.length > 0 && onSelectAlternative && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-purple-900">
            Or try these alternatives:
          </p>
          <div className="space-y-2">
            {alternatives.map((alt, index) => (
              <button
                key={index}
                onClick={() => onSelectAlternative(alt)}
                className="w-full text-left text-sm p-3 rounded-md bg-white border border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-colors"
              >
                {typeof alt === "object" ? (
                  <div className="space-y-1">
                    {Object.entries(alt).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span>{" "}
                        <span className="text-purple-700">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-purple-900">{String(alt)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}








