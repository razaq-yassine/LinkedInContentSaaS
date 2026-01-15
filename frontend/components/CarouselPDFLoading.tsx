'use client';

import React from 'react';
import { AppLoader } from './AppLoader';

interface CarouselPDFLoadingProps {
  currentSlide: number;
  totalSlides: number;
}

export function CarouselPDFLoading({ currentSlide, totalSlides }: CarouselPDFLoadingProps) {
  return (
    <div className="bg-gradient-to-br from-[#E7F3FF] to-[#F3F2F0] aspect-square flex items-center justify-center relative overflow-hidden">
      {/* Logo in background */}
      <div className="absolute inset-0 opacity-10 flex items-center justify-center">
        <div className="text-[#0A66C2] font-bold text-6xl">PostInAi</div>
      </div>
      
      {/* Animated progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#E0DFDC]">
        <div 
          className="h-full bg-[#0A66C2] transition-all duration-300"
          style={{ width: `${(currentSlide / totalSlides) * 100}%` }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <AppLoader size="md" />
        <p className="text-xs font-semibold text-[#0A66C2] mb-0.5 mt-4">Generating PDF...</p>
        <p className="text-[10px] text-[#666666] mb-1">
          Generated slides: <span className="font-semibold">{currentSlide}</span> / <span className="font-semibold">{totalSlides}</span>
        </p>
        <p className="text-[10px] text-[#666666]">This may take 30-60 seconds</p>
      </div>
    </div>
  );
}

