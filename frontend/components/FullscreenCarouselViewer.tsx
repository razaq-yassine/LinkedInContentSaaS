'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface FullscreenCarouselViewerProps {
  slides: string[];
  isOpen: boolean;
  onClose: () => void;
  onRegenerateSlide?: (slideIndex: number) => void;
  regeneratingSlideIndex?: number | null;
  className?: string;
}

export function FullscreenCarouselViewer({
  slides,
  isOpen,
  onClose,
  onRegenerateSlide,
  regeneratingSlideIndex = null,
  initialSlide = 0,
  className = '',
}: FullscreenCarouselViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const minSwipeDistance = 50; // Minimum distance in pixels to trigger a swipe

  // Update current slide when initialSlide changes (when opening fullscreen)
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(initialSlide);
    }
  }, [isOpen, initialSlide]);

  const goToPrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const isFirstSlide = currentSlide === 0;
  const isLastSlide = currentSlide === slides.length - 1;

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleArrowKeys = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentSlide > 0) {
        goToPrevious();
      } else if (e.key === 'ArrowRight' && currentSlide < slides.length - 1) {
        goToNext();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleArrowKeys);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleArrowKeys);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, slides.length, currentSlide]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleRegenerateSlide = () => {
    if (onRegenerateSlide) {
      onRegenerateSlide(currentSlide);
    }
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

  if (!isOpen || !slides || slides.length === 0) return null;

  const isRegenerating = regeneratingSlideIndex === currentSlide;

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative w-full h-full max-w-7xl max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 z-20"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Main slide display */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          <div 
            className="relative w-full h-full flex items-center justify-center touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={`data:image/png;base64,${slides[currentSlide]}`}
              alt={`Slide ${currentSlide + 1} of ${slides.length}`}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />

            {/* Loading overlay - only on regenerating slide */}
            {isRegenerating && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-white text-sm font-semibold">Regenerating slide...</p>
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 z-10 disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto"
                >
                  <ChevronLeft className="w-6 h-6" />
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 z-10 disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Slide indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(index);
                }}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-white w-8'
                    : 'bg-white/50 hover:bg-white/75 w-2'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Slide counter */}
        {slides.length > 1 && (
          <div className="absolute top-4 right-20 bg-black/50 text-white text-sm px-3 py-1.5 rounded z-10">
            {currentSlide + 1} / {slides.length}
          </div>
        )}

        {/* Floating Regenerate Slide Button */}
        {onRegenerateSlide && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleRegenerateSlide();
            }}
            disabled={isRegenerating}
            className={`absolute top-4 left-4 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-full px-6 py-3 z-10 flex items-center gap-2 transition-all disabled:opacity-50 shadow-xl border-2 border-white/30 ${
              !isRegenerating ? 'animate-pulse hover:animate-none' : ''
            }`}
            style={{
              boxShadow: !isRegenerating 
                ? '0 0 20px rgba(10, 102, 194, 0.8), 0 4px 12px rgba(0, 0, 0, 0.4)' 
                : '0 4px 12px rgba(0, 0, 0, 0.4)'
            }}
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span className="text-sm font-semibold drop-shadow-sm">
              {isRegenerating ? 'Regenerating...' : 'Regenerate slide'}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}

