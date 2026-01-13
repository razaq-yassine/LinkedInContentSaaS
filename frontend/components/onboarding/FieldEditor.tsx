"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldEditorProps {
  label: string;
  value: any;
  type: "text" | "textarea" | "number" | "select" | "array" | "chips";
  options?: string[];
  aiGenerated?: boolean;
  aiReasoning?: string;
  alternatives?: any[];
  editable?: boolean;
  onChange: (value: any) => void;
  onBlur?: () => void;
}

export default function FieldEditor({
  label,
  value,
  type,
  options = [],
  aiGenerated = false,
  aiReasoning,
  alternatives = [],
  editable = true,
  onChange,
  onBlur,
}: FieldEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [showAlternatives, setShowAlternatives] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSave = () => {
    onChange(localValue);
    setIsEditing(false);
    onBlur?.();
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  const handleSelectAlternative = (alt: any) => {
    onChange(alt);
    setLocalValue(alt);
    setShowAlternatives(false);
  };

  // Array editor handlers
  const handleArrayAdd = () => {
    const newArray = [...(localValue || []), ""];
    setLocalValue(newArray);
  };

  const handleArrayRemove = (index: number) => {
    const newArray = localValue.filter((_: any, i: number) => i !== index);
    setLocalValue(newArray);
    onChange(newArray);
  };

  const handleArrayItemChange = (index: number, newValue: string) => {
    const newArray = [...localValue];
    newArray[index] = newValue;
    setLocalValue(newArray);
  };

  const handleArraySave = () => {
    onChange(localValue);
    setIsEditing(false);
  };

  // Render display value (used in both mobile and desktop)
  const renderDisplayValue = () => {
    if (type === "array" || type === "chips") {
      return (
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {Array.isArray(value) && value.length > 0 ? (
            value.slice(0, 3).map((item: any, index: number) => (
              <Badge
                key={index}
                variant="outline"
                className="bg-white border-[#E0DFDC] text-[10px] sm:text-xs"
              >
                {typeof item === "object" ? JSON.stringify(item) : item}
              </Badge>
            ))
          ) : (
            <span className="text-[#999]">(empty)</span>
          )}
          {Array.isArray(value) && value.length > 3 && (
            <span className="text-[10px] text-[#666666]">+{value.length - 3}</span>
          )}
        </div>
      );
    }
    return <span className="truncate">{value || "(empty)"}</span>;
  };

  return (
    <>
      {/* ===== MOBILE: Stacked layout to prevent horizontal overflow ===== */}
      {!isEditing ? (
        <div className="md:hidden w-full overflow-hidden">
          <button
            onClick={() => editable && setIsEditing(true)}
            className={cn(
              "w-full flex flex-col items-start gap-1.5 min-h-[52px] py-3 px-0 border-b border-[#E8E7E5] dark:border-slate-700 text-left touch-manipulation overflow-hidden",
              editable && "active:bg-[#F3F2F0] dark:active:bg-slate-700"
            )}
          >
            {/* Label row */}
            <div className="w-full flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-xs font-medium text-[#666666] dark:text-slate-400 uppercase tracking-wide">{label}</span>
                {aiGenerated && (
                  <Sparkles className="h-3 w-3 text-purple-600 flex-shrink-0" />
                )}
              </div>
              {editable && (
                <span className="text-xs text-[#0A66C2] font-medium flex-shrink-0">Edit</span>
              )}
            </div>
            {/* Value row - full width with proper wrapping */}
            <div className="w-full text-sm text-black dark:text-white overflow-hidden">
              <div className="break-words line-clamp-2">
                {type === "array" || type === "chips" ? (
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(value) && value.length > 0 ? (
                      value.slice(0, 2).map((item: any, index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-white border-[#E0DFDC] text-[10px] max-w-full"
                        >
                          <span className="truncate">{typeof item === "object" ? JSON.stringify(item) : item}</span>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[#999]">(empty)</span>
                    )}
                    {Array.isArray(value) && value.length > 2 && (
                      <span className="text-[10px] text-[#666666]">+{value.length - 2} more</span>
                    )}
                  </div>
                ) : (
                  <span className="break-words">{value || "(empty)"}</span>
                )}
              </div>
            </div>
          </button>
        </div>
      ) : null}

      {/* ===== DESKTOP: Original stacked layout ===== */}
      <div className={cn("hidden md:block", isEditing && "!block")}>
        <div className="space-y-2">
          {/* Label with AI badge */}
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
              {label}
              {aiGenerated && (
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs"
                  title={aiReasoning || "AI-generated based on industry best practices"}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Suggested
                </Badge>
              )}
            </Label>
            {!isEditing && editable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-[#0A66C2] hover:text-[#004182] h-auto py-1 px-2"
              >
                Edit
              </Button>
            )}
          </div>

          {/* Field display or edit mode */}
          {!isEditing ? (
            <div className="text-sm text-[#666666] dark:text-slate-300 bg-[#F3F2F0] dark:bg-slate-700 p-3 rounded-md">
              {type === "array" || type === "chips" ? (
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(value) &&
                    value.map((item: any, index: number) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-white border-[#E0DFDC]"
                      >
                        {typeof item === "object" ? JSON.stringify(item) : item}
                      </Badge>
                    ))}
                </div>
              ) : (
                <span className="break-words">{value || "(empty)"}</span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Text input - Mobile optimized */}
              {type === "text" && (
                <Input
                  value={localValue || ""}
                  onChange={(e) => setLocalValue(e.target.value)}
                  className="border-[#E0DFDC] h-11 md:h-10 text-base md:text-sm touch-manipulation"
                  autoFocus
                />
              )}

              {/* Textarea - Mobile optimized */}
              {type === "textarea" && (
                <Textarea
                  value={localValue || ""}
                  onChange={(e) => setLocalValue(e.target.value)}
                  className="border-[#E0DFDC] min-h-[120px] md:min-h-[100px] text-base md:text-sm touch-manipulation"
                  autoFocus
                />
              )}

              {/* Number input - Mobile optimized */}
              {type === "number" && (
                <Input
                  type="number"
                  value={localValue || 0}
                  onChange={(e) => setLocalValue(parseInt(e.target.value) || 0)}
                  className="border-[#E0DFDC] h-11 md:h-10 text-base md:text-sm touch-manipulation"
                  autoFocus
                />
              )}

              {/* Select dropdown - Mobile optimized */}
              {type === "select" && (
                <Select value={localValue} onValueChange={setLocalValue}>
                  <SelectTrigger className="border-[#E0DFDC] h-11 md:h-10 text-base md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option} value={option} className="min-h-[44px] text-base md:text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Array editor */}
              {(type === "array" || type === "chips") && (
                <div className="space-y-2">
                  {Array.isArray(localValue) &&
                    localValue.map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={typeof item === "object" ? JSON.stringify(item) : item}
                          onChange={(e) => handleArrayItemChange(index, e.target.value)}
                          className="border-[#E0DFDC] flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArrayRemove(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleArrayAdd}
                    className="w-full border-dashed border-[#0A66C2] text-[#0A66C2] hover:bg-[#EEF3F8]"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
              )}

              {/* Action buttons - Mobile optimized with larger touch targets */}
              <div className="flex items-center gap-2.5 pt-3">
                <Button
                  size="sm"
                  onClick={type === "array" || type === "chips" ? handleArraySave : handleSave}
                  className="bg-[#0A66C2] hover:bg-[#004182] active:bg-[#003366] text-sm h-10 md:h-9 flex-1 md:flex-none min-w-[100px] touch-manipulation"
                >
                  <Check className="h-4 w-4 mr-1.5" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="border-[#E0DFDC] text-sm h-10 md:h-9 flex-1 md:flex-none min-w-[100px] touch-manipulation"
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* AI alternatives */}
          {aiGenerated && alternatives.length > 0 && !isEditing && (
            <div className="mt-2">
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="text-xs text-[#0A66C2] hover:underline"
              >
                {showAlternatives ? "Hide" : "Show"} alternatives
              </button>
              {showAlternatives && (
                <div className="mt-2 space-y-2">
                  {alternatives.map((alt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectAlternative(alt)}
                      className="w-full text-left text-sm p-2 rounded-md border border-[#E0DFDC] hover:bg-[#EEF3F8] hover:border-[#0A66C2] transition-colors"
                    >
                      {typeof alt === "object" ? JSON.stringify(alt) : alt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI reasoning tooltip */}
          {aiGenerated && aiReasoning && !isEditing && (
            <p className="text-xs text-[#666666] dark:text-slate-400 italic mt-1">
              💡 {aiReasoning}
            </p>
          )}
        </div>
      </div>
    </>
  );
}








