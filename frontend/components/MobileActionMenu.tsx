"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  X,
  CheckCircle2,
  Zap,
  FileText,
  Image,
  Layers,
  Video,
  TrendingUp,
  Globe,
  Sparkles,
} from "lucide-react";

interface MobileActionMenuProps {
  hasContext: boolean;
  onContextClick: () => void;
  postType: string;
  onPostTypeClick: () => void;
  useTrendingTopic: boolean;
  onTrendingClick: () => void;
  internetSearch: boolean;
  onWebSearchClick: () => void;
  areOptionsChanged: boolean;
  onOptionsClick: () => void;
}

export function MobileActionMenu({
  hasContext,
  onContextClick,
  postType,
  onPostTypeClick,
  useTrendingTopic,
  onTrendingClick,
  internetSearch,
  onWebSearchClick,
  areOptionsChanged,
  onOptionsClick,
}: MobileActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Get post type icon and label
  const getPostTypeInfo = () => {
    const iconMap: Record<string, { icon: typeof FileText; label: string }> = {
      auto: { icon: Zap, label: "Choose for me" },
      image: { icon: Image, label: "Text + Image" },
      text: { icon: FileText, label: "Text Only" },
      carousel: { icon: Layers, label: "Carousel" },
      video_script: { icon: Video, label: "Video script" },
    };
    return iconMap[postType] || { icon: FileText, label: postType };
  };

  const postTypeInfo = getPostTypeInfo();
  const PostTypeIcon = postTypeInfo.icon;

  // Count active features for badge
  const activeCount = [hasContext, useTrendingTopic, internetSearch, areOptionsChanged].filter(Boolean).length;

  const handleActionClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const menuContent = (
    <>
      {/* Backdrop with blur */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Floating menu */}
      <div
        ref={menuRef}
        className={`fixed bottom-20 right-4 z-[9999] transition-all duration-300 ease-out ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden min-w-[200px]">
          {/* Menu items */}
          <div className="py-2">
            {/* Context */}
            <button
              onClick={() => handleActionClick(onContextClick)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                hasContext
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className={`w-5 h-5 ${hasContext ? "text-green-600" : "text-gray-400"}`}
                />
                <span className="font-medium">Context</span>
              </div>
              {hasContext && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </button>

            {/* Post Type */}
            <button
              onClick={() => handleActionClick(onPostTypeClick)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <PostTypeIcon className="w-5 h-5 text-purple-500" />
                <span className="font-medium">{postTypeInfo.label}</span>
              </div>
              <span className="text-xs text-gray-400">Tap to change</span>
            </button>

            {/* Trending */}
            <button
              onClick={() => handleActionClick(onTrendingClick)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                useTrendingTopic
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp
                  className={`w-5 h-5 ${useTrendingTopic ? "text-orange-600" : "text-gray-400"}`}
                />
                <span className="font-medium">Trending Topics</span>
              </div>
              <div
                className={`w-10 h-6 rounded-full transition-colors ${
                  useTrendingTopic ? "bg-orange-500" : "bg-gray-200"
                }`}
              >
                <div
                  className={`w-5 h-5 mt-0.5 rounded-full bg-white shadow transition-transform ${
                    useTrendingTopic ? "translate-x-4.5 ml-0.5" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>

            {/* Web Search */}
            <button
              onClick={() => handleActionClick(onWebSearchClick)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                internetSearch
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Globe
                  className={`w-5 h-5 ${internetSearch ? "text-green-600" : "text-gray-400"}`}
                />
                <span className="font-medium">Web Search</span>
              </div>
              <div
                className={`w-10 h-6 rounded-full transition-colors ${
                  internetSearch ? "bg-green-500" : "bg-gray-200"
                }`}
              >
                <div
                  className={`w-5 h-5 mt-0.5 rounded-full bg-white shadow transition-transform ${
                    internetSearch ? "translate-x-4.5 ml-0.5" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>

            {/* Options */}
            <button
              onClick={() => handleActionClick(onOptionsClick)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                areOptionsChanged
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles
                  className={`w-5 h-5 ${areOptionsChanged ? "text-purple-600" : "text-gray-400"}`}
                />
                <span className="font-medium">Advanced Options</span>
              </div>
              {areOptionsChanged && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  Modified
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* FAB Button - only visible on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`sm:hidden fixed bottom-24 right-4 z-[9997] w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? "bg-gray-800 text-white rotate-90"
            : "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
        }`}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <>
            <MoreHorizontal className="w-5 h-5" />
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Portal for menu */}
      {typeof window !== "undefined" && createPortal(menuContent, document.body)}
    </>
  );
}
