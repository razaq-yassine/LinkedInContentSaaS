'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface CarouselSliderProps {
  slides: string[]; // Array of base64 image URLs
  className?: string;
  onRegenerateSlide?: (slideIndex: number) => void;
  regeneratingSlideIndex?: number | null;
  onSlideChange?: (slideIndex: number) => void;
  initialSlide?: number; // Initial slide index to display
}

export function CarouselSlider({ 
  slides, 
  className = '',
  onRegenerateSlide,
  regeneratingSlideIndex = null,
  onSlideChange,
  initialSlide = 0,
}: CarouselSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const isUserInitiatedChange = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const minSwipeDistance = 50; // Minimum distance in pixels to trigger a swipe

  // Update current slide when initialSlide prop changes (e.g., when slides are regenerated)
  // Also update when slides array changes to maintain position
  useEffect(() => {
    if (slides.length > 0) {
      const targetSlide = Math.min(Math.max(0, initialSlide), slides.length - 1);
      if (targetSlide !== currentSlide) {
        isUserInitiatedChange.current = false;
        setCurrentSlide(targetSlide);
      }
    }
  }, [initialSlide, slides.length]);

  // Notify parent when slide changes (only for user-initiated changes)
  useEffect(() => {
    if (isUserInitiatedChange.current) {
      onSlideChange?.(currentSlide);
      isUserInitiatedChange.current = false;
    }
  }, [currentSlide, onSlideChange]);

  // Reset to slide 0 if slides array changes length significantly (new PDF loaded)
  // But maintain current slide if it's still valid
  useEffect(() => {
    if (slides.length > 0 && currentSlide >= slides.length) {
      isUserInitiatedChange.current = false;
      setCurrentSlide(Math.max(0, slides.length - 1));
    }
  }, [slides.length, currentSlide]);

  if (!slides || slides.length === 0) {
    return (
      <div className={`bg-[#F3F2F0] aspect-square flex items-center justify-center ${className}`}>
        <p className="text-xs text-[#666666]">No slides available</p>
      </div>
    );
  }

  const goToPrevious = () => {
    if (currentSlide > 0) {
      isUserInitiatedChange.current = true;
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToNext = () => {
    if (currentSlide < slides.length - 1) {
      isUserInitiatedChange.current = true;
      setCurrentSlide(currentSlide + 1);
    }
  };

  const isFirstSlide = currentSlide === 0;
  const isLastSlide = currentSlide === slides.length - 1;

  const goToSlide = (index: number) => {
    isUserInitiatedChange.current = true;
    setCurrentSlide(index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Prevent scrolling while swiping
    if (touchStartX.current !== null && touchStartY.current !== null) {
      const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
      
      // If horizontal swipe is greater than vertical, prevent default scrolling
      if (deltaX > deltaY) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Check if it's a horizontal swipe (not vertical scroll)
    if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right - go to previous slide
        goToPrevious();
      } else {
        // Swipe left - go to next slide
        goToNext();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const isRegenerating = regeneratingSlideIndex === currentSlide;

  return (
    <div className={`relative w-full bg-black ${className}`}>
      {/* Main slide display */}
      <div 
        className="relative aspect-square overflow-hidden touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={`data:image/png;base64,${slides[currentSlide]}`}
          alt={`Slide ${currentSlide + 1} of ${slides.length}`}
          className="w-full h-full object-contain select-none"
          draggable={false}
        />

        {/* Loading overlay - only on regenerating slide */}
        {isRegenerating && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-3 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white text-xs font-semibold">Regenerating slide...</p>
            </div>
          </div>
        )}
        
        {/* Navigation buttons */}
        {slides.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (!isFirstSlide) {
                  goToPrevious();
                }
              }}
              disabled={isFirstSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 z-10 disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (!isLastSlide) {
                  goToNext();
                }
              }}
              disabled={isLastSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 z-10 disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

      </div>

      {/* Slide indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white w-4'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide counter */}
      {slides.length > 1 && (
        <div 
          className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {currentSlide + 1} / {slides.length}
        </div>
      )}
    </div>
  );
}

