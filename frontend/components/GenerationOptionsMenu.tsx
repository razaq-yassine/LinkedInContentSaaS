"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Globe } from "lucide-react";

interface GenerationOptionsMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tone: string;
  setTone: (value: string) => void;
  length: string;
  setLength: (value: string) => void;
  hashtagCount: number;
  setHashtagCount: (value: number) => void;
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

export function GenerationOptionsMenu({
  open,
  onOpenChange,
  tone,
  setTone,
  length,
  setLength,
  hashtagCount,
  setHashtagCount,
  triggerRef,
}: GenerationOptionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [internetSearch, setInternetSearch] = useState(false);

  // Close menu when clicking outside (but not when clicking on select dropdowns)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking on select dropdowns or their content
      if (
        target.closest('[role="listbox"]') ||
        target.closest('[data-slot="select-content"]') ||
        target.closest('[data-slot="select-trigger"]') ||
        target.closest('[data-radix-select-content]') ||
        target.closest('[data-radix-select-viewport]') ||
        target.closest('[data-radix-select-item]')
      ) {
        return;
      }
      
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(target)
      ) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, onOpenChange, triggerRef]);

  // Position menu relative to trigger
  useEffect(() => {
    if (open && triggerRef?.current && menuRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate position - prefer above, aligned to right
      let top = triggerRect.top - menuRect.height - 8;
      let left = triggerRect.right - menuRect.width;
      
      // Adjust if menu would go off screen
      if (top < 8) {
        // Position below instead
        top = triggerRect.bottom + 8;
      }
      if (left < 8) {
        left = 8;
      }
      if (left + menuRect.width > viewportWidth - 8) {
        left = viewportWidth - menuRect.width - 8;
      }
      
      menuRef.current.style.top = `${top}px`;
      menuRef.current.style.left = `${left}px`;
    }
  }, [open, triggerRef]);

  if (!open) return null;

  const menuContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={() => onOpenChange(false)}
      />

      {/* Menu Tile */}
      <div
        ref={menuRef}
        className="fixed z-[9999] w-80 bg-gradient-to-br from-purple-50 via-blue-50 to-white rounded-xl shadow-2xl border border-purple-200/50 overflow-hidden"
        style={{ top: 0, left: 0 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white" />
          <h3 className="text-sm font-bold text-white">More AI Options</h3>
        </div>

        {/* Content */}
        <div className="px-4 py-3 space-y-3">
          {/* Internet Search Toggle */}
          <div className="flex items-center justify-between p-2.5 bg-white/60 rounded-lg border border-purple-100 hover:border-purple-300 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                <Globe className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-black">Web Search</p>
                <p className="text-[10px] text-[#666666]">Access real-time web information</p>
              </div>
            </div>
            <button
              onClick={() => setInternetSearch(!internetSearch)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                internetSearch ? "bg-green-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                  internetSearch ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-purple-200" />

          {/* Generation Options - Compact Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Tone */}
            <div>
              <Label className="text-[10px] font-medium text-[#666666] mb-1 block">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-8 text-xs bg-white border-purple-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="thought-leader">Thought Leader</SelectItem>
                  <SelectItem value="educator">Educator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Length */}
            <div>
              <Label className="text-[10px] font-medium text-[#666666] mb-1 block">Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger className="h-8 text-xs bg-white border-purple-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hashtag Count */}
            <div>
              <Label className="text-[10px] font-medium text-[#666666] mb-1 block">Hashtags</Label>
              <Input
                type="number"
                min="0"
                max="6"
                value={hashtagCount}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  // Handle empty input
                  if (inputValue === "" || inputValue === null || inputValue === undefined) {
                    setHashtagCount(0);
                    return;
                  }
                  // Parse and validate
                  const numValue = parseInt(inputValue, 10);
                  if (!isNaN(numValue)) {
                    const clampedValue = Math.min(Math.max(numValue, 0), 6);
                    setHashtagCount(clampedValue);
                  }
                }}
                onBlur={(e) => {
                  // Ensure value is properly formatted on blur
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value)) {
                    setHashtagCount(Math.min(Math.max(value, 0), 6));
                  } else {
                    setHashtagCount(0);
                  }
                }}
                className="h-8 text-xs bg-white border-purple-200"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Render in portal to ensure it's above everything, including sidebar
  if (typeof window !== "undefined") {
    return createPortal(menuContent, document.body);
  }
  
  return null;
}

