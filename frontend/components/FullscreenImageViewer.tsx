'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface FullscreenImageViewerProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FullscreenImageViewer({
  imageSrc,
  isOpen,
  onClose,
}: FullscreenImageViewerProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 z-10"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Image */}
        <img
          src={imageSrc}
          alt="Fullscreen preview"
          className="max-w-full max-h-[90vh] object-contain"
        />
      </div>
    </div>
  );
}







