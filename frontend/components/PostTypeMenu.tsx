"use client";

import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { FileText, Check } from "lucide-react";

interface PostTypeMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postType: string;
  setPostType: (value: string) => void;
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

const postTypes = [
  { value: "auto", label: "Choose for me" },
  { value: "image", label: "Text + Image" },
  { value: "text", label: "Text Only" },
  { value: "carousel", label: "Carousel" },
  { value: "video_script", label: "Video script" },
];

export function PostTypeMenu({
  open,
  onOpenChange,
  postType,
  setPostType,
  triggerRef,
}: PostTypeMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
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
      
      // Calculate position - prefer below, aligned to left
      let top = triggerRect.bottom + 8;
      let left = triggerRect.left;
      
      // Adjust if menu would go off screen
      if (top + menuRect.height > viewportHeight - 8) {
        // Position above instead
        top = triggerRect.top - menuRect.height - 8;
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
        className="fixed z-[9999] w-48 bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200/50 overflow-hidden"
        style={{ top: 0, left: 0 }}
      >
        {/* Content */}
        <div className="py-2">
          {postTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => {
                setPostType(type.value);
                onOpenChange(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                postType === type.value
                  ? "bg-blue-50 text-blue-600"
                  : "text-[#666666] hover:bg-[#F3F2F0]"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>{type.label}</span>
              </div>
              {postType === type.value && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </button>
          ))}
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


