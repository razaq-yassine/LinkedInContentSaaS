'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface CarouselSliderProps {
  slides: string[]; // Array of base64 image URLs
  className?: string;
}

export function CarouselSlider({ slides, className = '' }: CarouselSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!slides || slides.length === 0) {
    return (
      <div className={`bg-[#F3F2F0] aspect-square flex items-center justify-center ${className}`}>
        <p className="text-xs text-[#666666]">No slides available</p>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className={`relative w-full bg-black ${className}`}>
      {/* Main slide display */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={`data:image/png;base64,${slides[currentSlide]}`}
          alt={`Slide ${currentSlide + 1} of ${slides.length}`}
          className="w-full h-full object-contain"
        />
        
        {/* Navigation buttons */}
        {slides.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8"
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
              onClick={() => goToSlide(index)}
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
        <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded">
          {currentSlide + 1} / {slides.length}
        </div>
      )}
    </div>
  );
}

