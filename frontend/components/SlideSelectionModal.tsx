'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from './ui/button';

interface SlideSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: string[];
  prompts: string[];
  onConfirm: (selectedIndices: number[]) => void;
}

export function SlideSelectionModal({
  isOpen,
  onClose,
  slides,
  prompts,
  onConfirm,
}: SlideSelectionModalProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen) {
      // Reset selection when modal opens
      setSelectedIndices(new Set());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSlide = (index: number) => {
    setSelectedIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === slides.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(slides.map((_, i) => i)));
    }
  };

  const handleConfirm = () => {
    if (selectedIndices.size > 0) {
      onConfirm(Array.from(selectedIndices).sort((a, b) => a - b));
    }
    onClose();
  };

  const allSelected = selectedIndices.size === slides.length;
  const someSelected = selectedIndices.size > 0 && selectedIndices.size < slides.length;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E0DFDC]">
          <div>
            <h3 className="text-xl font-semibold text-black">Select Slides to Regenerate</h3>
            <p className="text-sm text-[#666666] mt-1">
              Choose which slides you want to regenerate
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#666666] hover:text-black hover:bg-[#F3F2F0] rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Select All Button */}
        <div className="px-6 py-4 border-b border-[#E0DFDC]">
          <Button
            variant="outline"
            onClick={toggleSelectAll}
            className="w-full justify-start"
          >
            <div className={`w-5 h-5 border-2 rounded mr-3 flex items-center justify-center ${
              allSelected
                ? 'bg-[#0A66C2] border-[#0A66C2]'
                : someSelected
                ? 'bg-[#0A66C2] border-[#0A66C2]'
                : 'border-[#E0DFDC]'
            }`}>
              {allSelected && <Check className="w-3 h-3 text-white" />}
              {someSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
            </div>
            <span className="font-medium">
              {allSelected ? 'Deselect All' : 'Select All'}
            </span>
          </Button>
        </div>

        {/* Slides Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {slides.map((slide, index) => {
              const isSelected = selectedIndices.has(index);
              return (
                <div
                  key={index}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected
                      ? 'border-[#0A66C2] ring-2 ring-[#0A66C2]/20'
                      : 'border-[#E0DFDC] hover:border-[#0A66C2]'
                  }`}
                  onClick={() => toggleSlide(index)}
                >
                  {/* Slide Preview */}
                  <div className="aspect-square bg-black relative">
                    <img
                      src={`data:image/png;base64,${slide}`}
                      alt={`Slide ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                    {/* Selection Checkbox Overlay */}
                    <div className="absolute top-2 right-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#0A66C2]'
                          : 'bg-white/80'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    {/* Slide Number */}
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      Slide {index + 1}
                    </div>
                  </div>
                  {/* Prompt Preview */}
                  {prompts[index] && (
                    <div className="p-3 bg-[#F9F9F9]">
                      <p className="text-xs text-[#666666] line-clamp-2">
                        {prompts[index]}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-[#E0DFDC] bg-[#F9F9F9] flex items-center justify-between">
          <p className="text-sm text-[#666666]">
            {selectedIndices.size === 0
              ? 'Select at least one slide to regenerate'
              : `${selectedIndices.size} slide${selectedIndices.size === 1 ? '' : 's'} selected`}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedIndices.size === 0}
              className="bg-[#0A66C2] hover:bg-[#004182] text-white"
            >
              Regenerate Selected
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}



