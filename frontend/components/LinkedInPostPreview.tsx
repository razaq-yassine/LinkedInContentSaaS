'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  ThumbsUp, 
  MessageCircle, 
  Repeat2, 
  Send,
  Image as ImageIcon,
  Calendar,
  ExternalLink,
  MoreHorizontal,
  Copy,
  Download,
  RefreshCw,
  FileImage,
  History,
  X,
  Check,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wand2,
  CheckCircle2,
} from 'lucide-react';
import { Textarea } from './ui/textarea';
import { CarouselSlider } from './CarouselSlider';
import { CarouselPDFLoading } from './CarouselPDFLoading';
import { FullscreenImageViewer } from './FullscreenImageViewer';
import { FullscreenCarouselViewer } from './FullscreenCarouselViewer';

interface UserProfile {
  name: string;
  headline: string;
  avatar?: string;
}

interface ImageHistoryItem {
  id: string;
  image: string;
  prompt: string;
  is_current: boolean;
  created_at: string;
}

interface PDFHistoryItem {
  id: string;
  pdf: string;
  slide_count: number;
  prompts: string[];
  is_current: boolean;
  created_at: string;
}

interface LinkedInPostPreviewProps {
  postContent: string;
  formatType: string;
  imagePrompt?: string;
  imagePrompts?: string[]; // For carousel posts
  userProfile: UserProfile;
  onCopyText?: () => void;
  onCopyImagePrompt?: () => void;
  onCopySlidePrompts?: () => void; // For carousel posts
  onRegenerateImage?: () => void;
  onGenerateImageWithPrompt?: (customPrompt: string) => void; // Generate image with custom prompt
  onRegenerateImagePrompt?: () => Promise<string | undefined>; // Regenerate image prompt, returns new prompt
  onRegeneratePDF?: (slideIndices?: number[]) => void; // For carousel PDF regeneration with optional slide indices
  onRegenerateSlide?: (slideIndex: number) => void; // For regenerating a single slide
  onDownloadImage?: () => void;
  onDownloadPDF?: () => void; // For carousel PDF download
  onRegenerate?: () => void;
  onSchedule?: () => void;
  onPost?: () => void;
  currentImage?: string; // base64 image data URL
  currentPDF?: string; // base64 PDF data URL for carousel
  currentPDFSlides?: string[]; // Array of base64 slide images for carousel preview
  generatingImage?: boolean;
  generatingPDF?: boolean; // For carousel PDF generation
  generatingPDFProgress?: { current: number; total: number }; // Progress tracking
  regeneratingSlideIndex?: number | null; // Index of slide being regenerated
  currentSlideIndex?: number; // Current slide index to display
  onSlideChange?: (slideIndex: number) => void; // Callback when slide changes
  imageHistory?: ImageHistoryItem[];
  pdfHistory?: PDFHistoryItem[]; // For carousel PDF history
  showImageHistory?: boolean;
  showPdfHistory?: boolean;
  onShowImageHistory?: () => void;
  onShowPdfHistory?: () => void;
  onCloseImageHistory?: () => void;
  onClosePdfHistory?: () => void;
  onSelectImage?: (imageId: string) => void;
  onSelectPDF?: (pdfId: string) => void;
  published?: boolean; // Whether the post has been published
  onTogglePublished?: (published: boolean) => void; // Toggle published status
  className?: string;
}

// Mini PDF Carousel Component for History Modal
function PDFHistoryCarousel({ 
  slides, 
  pdfId,
  onSelectPDF,
  isCurrent 
}: { 
  slides: string[]; 
  pdfId: string;
  onSelectPDF?: (pdfId: string) => void;
  isCurrent: boolean;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const isFirstSlide = currentSlide === 0;
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="relative aspect-square bg-black">
      <img
        src={`data:image/png;base64,${slides[currentSlide]}`}
        alt={`Slide ${currentSlide + 1} of ${slides.length}`}
        className="w-full h-full object-contain select-none"
        draggable={false}
      />
      
      {/* Navigation arrows - only show if multiple slides */}
      {slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            disabled={isFirstSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 z-10 disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            disabled={isLastSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 z-10 disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Slide counter */}
      {slides.length > 1 && (
        <div 
          className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          {currentSlide + 1} / {slides.length}
        </div>
      )}

      {/* Current indicator */}
      {isCurrent && (
        <div className="absolute top-2 right-2 bg-[#0A66C2] text-white rounded-full p-1.5 z-10 pointer-events-none">
          <Check className="w-4 h-4" />
        </div>
      )}

      {/* Select overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
        {!isCurrent && (
          <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Select
          </span>
        )}
      </div>
    </div>
  );
}

export function LinkedInPostPreview({
  postContent,
  formatType,
  imagePrompt,
  imagePrompts,
  userProfile,
  onCopyText,
  onCopyImagePrompt,
  onCopySlidePrompts,
  onRegenerateImage,
  onGenerateImageWithPrompt,
  onRegenerateImagePrompt,
  onRegeneratePDF,
  onRegenerateSlide,
  onDownloadImage,
  onDownloadPDF,
  onRegenerate,
  onSchedule,
  onPost,
  currentImage,
  currentPDF,
  currentPDFSlides = [],
  generatingImage = false,
  generatingPDF = false,
  generatingPDFProgress,
  regeneratingSlideIndex = null,
  currentSlideIndex = 0,
  onSlideChange,
  imageHistory = [],
  pdfHistory = [],
  showImageHistory = false,
  showPdfHistory = false,
  onShowImageHistory,
  onShowPdfHistory,
  onCloseImageHistory,
  onClosePdfHistory,
  onSelectImage,
  onSelectPDF,
  published = false,
  onTogglePublished,
  className = '',
}: LinkedInPostPreviewProps) {
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [showFullscreenCarousel, setShowFullscreenCarousel] = useState(false);
  const [currentCarouselSlide, setCurrentCarouselSlide] = useState(currentSlideIndex);
  const [showRegenerateImageModal, setShowRegenerateImageModal] = useState(false);
  const [editableImagePrompt, setEditableImagePrompt] = useState(imagePrompt || '');
  const [isRegeneratingPrompt, setIsRegeneratingPrompt] = useState(false);

  // Update local state when prop changes (e.g., after regeneration)
  useEffect(() => {
    if (currentSlideIndex >= 0 && currentSlideIndex < (currentPDFSlides.length || 0)) {
      setCurrentCarouselSlide(currentSlideIndex);
    }
  }, [currentSlideIndex, currentPDFSlides.length]);

  // Notify parent when slide changes
  const handleSlideChange = (slideIndex: number) => {
    setCurrentCarouselSlide(slideIndex);
    onSlideChange?.(slideIndex);
  };
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format post content with bold hashtags
  const formatPostContent = (content: string) => {
    // Special formatting for video scripts
    if (formatType === 'video_script') {
      return formatVideoScript(content);
    }
    
    // Split by hashtags (including hashtags with numbers and underscores)
    // Regex matches # followed by word characters (letters, numbers, underscore)
    const parts = content.split(/(#[\w]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#') && part.length > 1) {
        return <strong key={index} className="font-semibold text-black dark:text-white">{part}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Format video script with special styling
  const formatVideoScript = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        // Empty line - add spacing
        elements.push(<br key={`br-${lineIndex}`} />);
        return;
      }
      
      // Check for header markers
      if (trimmedLine.startsWith('**HEADER**')) {
        const headerText = trimmedLine.replace('**HEADER**', '').trim();
        elements.push(
          <div key={`header-${lineIndex}`} className="mt-4 mb-2">
            <strong className="font-bold text-black text-sm">{headerText}</strong>
          </div>
        );
        return;
      }
      
      // Check for subheader markers
      if (trimmedLine.startsWith('**SUBHEADER**')) {
        const subheaderText = trimmedLine.replace('**SUBHEADER**', '').trim();
        elements.push(
          <div key={`subheader-${lineIndex}`} className="mt-3 mb-1">
            <strong className="font-semibold text-[#0A66C2] text-xs">{subheaderText}</strong>
          </div>
        );
        return;
      }
      
      // Check for visual cue markers
      if (trimmedLine.startsWith('*VISUAL*')) {
        const visualText = trimmedLine.replace('*VISUAL*', '').trim();
        elements.push(
          <div key={`visual-${lineIndex}`} className="mb-2">
            <span className="text-[#666666] text-[10px] italic bg-[#F3F2F0] px-2 py-1 rounded">
              📹 {visualText}
            </span>
          </div>
        );
        return;
      }
      
      // Check for script markers
      if (trimmedLine.startsWith('*SCRIPT*')) {
        const scriptText = trimmedLine.replace('*SCRIPT*', '').trim();
        elements.push(
          <div key={`script-${lineIndex}`} className="mb-2">
            <span className="text-black italic leading-relaxed">{scriptText}</span>
          </div>
        );
        return;
      }
      
      // Fallback for lines without markers (legacy format or plain text)
      // Check if it looks like a header (starts with [)
      if (trimmedLine.startsWith('[') && trimmedLine.includes(']')) {
        elements.push(
          <div key={`legacy-header-${lineIndex}`} className="mt-4 mb-2">
            <strong className="font-bold text-black text-sm">{trimmedLine}</strong>
          </div>
        );
      } else {
        // Regular script text
        elements.push(
          <div key={`text-${lineIndex}`} className="mb-2">
            <span className="text-black italic leading-relaxed">{trimmedLine}</span>
          </div>
        );
      }
    });
    
    return <>{elements}</>;
  };

  return (
    <Card className={`w-full max-w-lg bg-white dark:bg-slate-800 border border-[#E0DFDC] dark:border-slate-700 shadow-linkedin-sm overflow-hidden ${className}`}>
      {/* Post Header */}
      <div className="px-3 pt-2 pb-1.5">
        <div className="flex items-start gap-2.5">
          <Avatar className="w-9 h-9">
            <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
            <AvatarFallback className="bg-[#0A66C2] text-white font-semibold text-xs">
              {getInitials(userProfile.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-xs text-black dark:text-white hover:text-[#0A66C2] hover:underline cursor-pointer truncate">
                  {userProfile.name}
                </h3>
                <p className="text-[10px] text-[#666666] dark:text-slate-400 line-clamp-1 truncate">
                  {userProfile.headline}
                </p>
                <p className="text-[10px] text-[#666666] dark:text-slate-400 mt-0.5">
                  Now • <span className="inline-block">🌐</span>
                </p>
              </div>
              
              <button className="text-[#666666] dark:text-slate-400 hover:bg-[#F3F2F0] dark:hover:bg-slate-700 rounded-full p-1 transition-colors flex-shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-3 pb-2">
        <div className="text-xs text-black dark:text-white whitespace-pre-wrap leading-relaxed">
          {formatPostContent(postContent)}
        </div>
      </div>

      {/* Image/PDF Display (if applicable) */}
      {formatType === 'image' && (
        <div className="border-t border-[#E0DFDC]">
          {generatingImage ? (
            // Loading state with beautiful animation
            <div className="bg-gradient-to-br from-[#E7F3FF] to-[#F3F2F0] aspect-[1.91/1] flex items-center justify-center relative overflow-hidden">
              {/* Logo in background */}
              <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                <div className="text-[#0A66C2] font-bold text-6xl">ContentAI</div>
              </div>
              
              {/* Animated progress bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#E0DFDC]">
                <div className="h-full bg-[#0A66C2] animate-progress-bar"></div>
              </div>
              
              {/* Content */}
              <div className="relative z-10 text-center px-4">
                <div className="w-12 h-12 mx-auto mb-2 border-4 border-[#0A66C2] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-semibold text-[#0A66C2] mb-0.5">Generating image...</p>
                <p className="text-[10px] text-[#666666]">This may take 10-15 seconds</p>
              </div>
            </div>
          ) : currentImage ? (
            // Display generated image
            <div className="relative group">
              <img 
                src={currentImage} 
                alt="Generated LinkedIn post image"
                className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowFullscreenImage(true)}
              />
            </div>
          ) : (
            // Placeholder when no image yet
            <div className="bg-[#F3F2F0] aspect-[1.91/1] flex items-center justify-center">
              <div className="text-center px-4 py-6">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 text-[#666666]" />
                <p className="text-xs text-[#666666] mb-1.5">Image Post</p>
                {imagePrompt && (
                  <p className="text-[10px] text-[#999999] max-w-full mx-auto line-clamp-2">
                    {imagePrompt}
                  </p>
                )}
                <p className="text-[10px] text-[#999999] mt-1.5">Image will be generated automatically...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Carousel PDF Display */}
      {formatType === 'carousel' && (
        <div className="border-t border-[#E0DFDC]">
          {generatingPDF ? (
            // Loading state with progress
            <CarouselPDFLoading 
              currentSlide={generatingPDFProgress?.current || 0}
              totalSlides={imagePrompts?.length || 0}
            />
          ) : currentPDFSlides && currentPDFSlides.length > 0 ? (
            // Display carousel slider with slides
            <div>
              {/* Buttons above PDF preview */}
              <div className="flex items-center justify-between px-3 py-2 bg-[#F9F9F9] border-b border-[#E0DFDC]">
                {/* Regenerate Slide Button - Left side */}
                {onRegenerateSlide && (
                  <Button
                    onClick={() => {
                      onRegenerateSlide?.(currentCarouselSlide);
                    }}
                    disabled={regeneratingSlideIndex !== null && regeneratingSlideIndex !== undefined}
                    className="bg-[#0A66C2] hover:bg-[#004182] text-white rounded-full px-4 py-2 flex items-center gap-2 transition-all disabled:opacity-50 text-xs shadow-lg"
                    style={{
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${regeneratingSlideIndex !== null && regeneratingSlideIndex !== undefined ? 'animate-spin' : ''}`} />
                    <span className="font-semibold">
                      {regeneratingSlideIndex !== null && regeneratingSlideIndex !== undefined ? 'Regenerating...' : 'Regenerate slide'}
                    </span>
                    <span className="ml-1 px-1.5 py-0.5 bg-white/20 text-white rounded text-[10px] font-bold">
                      x0.2
                    </span>
                  </Button>
                )}
                
                {/* Fullscreen Button - Right side */}
                <Button
                  onClick={() => setShowFullscreenCarousel(true)}
                  variant="ghost"
                  size="sm"
                  className="text-[#666666] hover:text-[#0A66C2] hover:bg-[#F3F2F0] rounded-full px-3"
                >
                  <Maximize2 className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">Fullscreen</span>
                </Button>
              </div>
              
              <div 
                className="cursor-pointer"
                onClick={(e) => {
                  // Don't open fullscreen if clicking on a disabled button
                  const target = e.target as HTMLElement;
                  const button = target.closest('button');
                  if (button && button.disabled) {
                    return;
                  }
                  setShowFullscreenCarousel(true);
                }}
              >
                <CarouselSlider 
                  slides={currentPDFSlides}
                  onRegenerateSlide={onRegenerateSlide}
                  regeneratingSlideIndex={regeneratingSlideIndex}
                  onSlideChange={handleSlideChange}
                  initialSlide={currentCarouselSlide}
                />
              </div>
            </div>
          ) : (
            // Placeholder when no PDF yet
            <div className="bg-[#F3F2F0] aspect-square flex items-center justify-center">
              <div className="text-center px-4 py-6">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 text-[#666666]" />
                <p className="text-xs text-[#666666] mb-1.5">Carousel Post</p>
                {imagePrompts && imagePrompts.length > 0 && (
                  <p className="text-[10px] text-[#999999] max-w-full mx-auto line-clamp-2">
                    {imagePrompts.length} slides will be generated
                  </p>
                )}
                <p className="text-[10px] text-[#999999] mt-1.5">PDF will be generated automatically...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Engagement Stats */}
      <div className="px-3 py-1.5 border-t border-[#E0DFDC] dark:border-slate-700">
        <div className="flex items-center justify-between text-[10px] text-[#666666] dark:text-slate-400">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-0.5">
              <div className="w-3 h-3 rounded-full bg-[#0A66C2] flex items-center justify-center">
                <ThumbsUp className="w-2 h-2 text-white fill-white" />
              </div>
            </div>
            <span className="ml-0.5">You and others</span>
          </div>
          <div className="flex gap-2">
            <span>24 comments</span>
            <span>8 reposts</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-1 py-0.5 border-t border-[#E0DFDC] dark:border-slate-700">
        <div className="flex items-center justify-around">
          <button className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-[#F3F2F0] dark:hover:bg-slate-700 transition-colors text-[#666666] dark:text-slate-400 flex-1 justify-center">
            <ThumbsUp className="w-4 h-4" />
            <span className="text-xs font-semibold">Like</span>
          </button>
          <button className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-[#F3F2F0] dark:hover:bg-slate-700 transition-colors text-[#666666] dark:text-slate-400 flex-1 justify-center">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-semibold">Comment</span>
          </button>
          <button className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-[#F3F2F0] dark:hover:bg-slate-700 transition-colors text-[#666666] dark:text-slate-400 flex-1 justify-center">
            <Repeat2 className="w-4 h-4" />
            <span className="text-xs font-semibold">Repost</span>
          </button>
          <button className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-[#F3F2F0] dark:hover:bg-slate-700 transition-colors text-[#666666] dark:text-slate-400 flex-1 justify-center">
            <Send className="w-4 h-4" />
            <span className="text-xs font-semibold">Send</span>
          </button>
        </div>
      </div>

      {/* Action Buttons for User */}
      <div className="px-3 pt-1.5 pb-2 bg-[#F9F9F9] dark:bg-slate-700/50 border-t border-[#E0DFDC] dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Copy Text Content */}
          {onCopyText && (
            <Button
              onClick={onCopyText}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-7 text-xs px-2"
              title="Copy post text"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Text</span>
            </Button>
          )}

          {/* Copy Image Prompt - Show for image posts */}
          {formatType === 'image' && onCopyImagePrompt && (
            <Button
              onClick={onCopyImagePrompt}
              variant="outline"
              size="sm"
              disabled={!imagePrompt}
              className="flex items-center gap-1 h-7 text-xs px-2"
              title={imagePrompt ? `Copy image prompt: ${imagePrompt.substring(0, 50)}...` : "No image prompt available"}
            >
              <FileImage className="w-3 h-3" />
              <span>Copy Prompt</span>
            </Button>
          )}

          {/* Copy Slide Prompts - Show for carousel posts */}
          {formatType === 'carousel' && onCopySlidePrompts && (
            <Button
              onClick={onCopySlidePrompts}
              variant="outline"
              size="sm"
              disabled={!imagePrompts || imagePrompts.length === 0}
              className="flex items-center gap-1 h-7 text-xs px-2"
              title={imagePrompts && imagePrompts.length > 0 ? `Copy ${imagePrompts.length} slide prompts` : "No slide prompts available"}
            >
              <FileImage className="w-3 h-3" />
              <span>Copy Prompts</span>
            </Button>
          )}

          {/* Regenerate Image - Show for image posts */}
          {formatType === 'image' && (onRegenerateImage || onGenerateImageWithPrompt) && (
            <Button
              onClick={() => {
                setEditableImagePrompt(imagePrompt || '');
                setShowRegenerateImageModal(true);
              }}
              variant="outline"
              size="sm"
              disabled={!imagePrompt || generatingImage}
              className="flex items-center gap-1 h-7 text-xs px-2"
              title={imagePrompt ? "Regenerate image from prompt (x0.2)" : "No image prompt available"}
            >
              <RefreshCw className={`w-3 h-3 ${generatingImage ? 'animate-spin' : ''}`} />
              <span>{generatingImage ? 'Generating...' : 'Regenerate Image'}</span>
              <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">x0.2</span>
            </Button>
          )}

          {/* Regenerate PDF - Show for carousel posts */}
          {formatType === 'carousel' && onRegeneratePDF && (
            <Button
              onClick={() => onRegeneratePDF()}
              variant="outline"
              size="sm"
              disabled={!imagePrompts || imagePrompts.length === 0 || generatingPDF}
              className="flex items-center gap-1 h-7 text-xs px-2"
              title={imagePrompts && imagePrompts.length > 0 ? `Regenerate PDF from prompts (x${(imagePrompts.length * 0.2).toFixed(1)})` : "No prompts available"}
            >
              <RefreshCw className={`w-3 h-3 ${generatingPDF ? 'animate-spin' : ''}`} />
              <span>{generatingPDF ? 'Generating...' : 'Regenerate PDF'}</span>
              {imagePrompts && imagePrompts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">x{(imagePrompts.length * 0.2).toFixed(1)}</span>
              )}
            </Button>
          )}

          {/* Image History - Show for image posts (only when multiple versions exist) */}
          {formatType === 'image' && onShowImageHistory && imageHistory.length > 1 && (
            <Button
              onClick={onShowImageHistory}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-7 text-xs px-2"
              title="View image history"
            >
              <History className="w-3 h-3" />
              <span>History ({imageHistory.length})</span>
            </Button>
          )}

          {/* PDF History - Show for carousel posts (only when multiple versions exist) */}
          {formatType === 'carousel' && onShowPdfHistory && pdfHistory.length > 1 && (
            <Button
              onClick={onShowPdfHistory}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-7 text-xs px-2"
              title="View PDF history"
            >
              <History className="w-3 h-3" />
              <span>History ({pdfHistory.length})</span>
            </Button>
          )}

          {/* Download Image - Show for image posts */}
          {formatType === 'image' && onDownloadImage && (
            <Button
              onClick={onDownloadImage}
              variant="outline"
              size="sm"
              disabled={!currentImage}
              className="flex items-center gap-1 h-7 text-xs px-2"
              title={currentImage ? "Download current image" : "No image generated yet"}
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </Button>
          )}

          {/* Download PDF - Show for carousel posts */}
          {formatType === 'carousel' && onDownloadPDF && (
            <Button
              onClick={onDownloadPDF}
              variant="outline"
              size="sm"
              disabled={!currentPDF}
              className="flex items-center gap-1 h-7 text-xs px-2"
              title={currentPDF ? "Download current PDF" : "No PDF generated yet"}
            >
              <Download className="w-3 h-3" />
              <span>Download PDF</span>
            </Button>
          )}

          {/* Regenerate */}
          {onRegenerate && (
            <Button
              onClick={onRegenerate}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-7 text-xs px-2"
              title="Regenerate this post"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Regenerate</span>
            </Button>
          )}

          {/* Divider */}
          <div className="h-5 w-px bg-[#E0DFDC] mx-0.5" />

          {/* Schedule - Hide for video scripts and published posts */}
          {onSchedule && formatType !== "video_script" && (
            <Button
              onClick={onSchedule}
              variant="outline"
              size="sm"
              disabled={published}
              className="flex items-center gap-1 h-7 text-xs px-2"
              title={published ? "Cannot schedule published posts" : "Schedule for later"}
            >
              <Calendar className="w-3 h-3" />
              <span>Schedule</span>
            </Button>
          )}

          {/* Post to LinkedIn - Hide for video scripts */}
          {onPost && formatType !== "video_script" && (
            <div className="flex items-center gap-2">
              <Button
                onClick={onPost}
                size="sm"
                disabled={generatingImage || generatingPDF || regeneratingSlideIndex !== null}
                className={`flex items-center gap-1 h-7 text-xs px-2 ${
                  published 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : generatingImage || generatingPDF || regeneratingSlideIndex !== null
                    ? "bg-gray-400 cursor-not-allowed text-white opacity-60"
                    : "bg-[#0A66C2] hover:bg-[#004182] text-white"
                }`}
                title={
                  published 
                    ? "Published to LinkedIn" 
                    : generatingImage 
                    ? "Please wait for image generation to complete"
                    : generatingPDF
                    ? "Please wait for carousel generation to complete"
                    : regeneratingSlideIndex !== null
                    ? "Please wait for slide regeneration to complete"
                    : "Publish to LinkedIn now"
                }
              >
                {published ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Published</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3 h-3" />
                    <span>Publish</span>
                  </>
                )}
              </Button>
              
              {/* Toggle Published Status - Show next to Publish button */}
              {onTogglePublished && (
                <Button
                  onClick={() => onTogglePublished(!published)}
                  variant="outline"
                  size="sm"
                  className={`flex items-center gap-1 h-7 text-xs px-2 ${
                    published
                      ? "border-red-500 text-red-600 hover:bg-red-50"
                      : "border-green-500 text-green-600 hover:bg-green-50"
                  }`}
                  title={published ? "Mark as not published" : "Mark as published"}
                >
                  {published ? (
                    <>
                      <X className="w-3 h-3" />
                      <span>Mark Unpublished</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Mark Published</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image History Modal */}
      {showImageHistory && imageHistory.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCloseImageHistory}>
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E0DFDC]">
              <h3 className="text-lg font-semibold text-black">Image History</h3>
              <button
                onClick={onCloseImageHistory}
                className="text-[#666666] hover:text-black hover:bg-[#F3F2F0] rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imageHistory.map((img) => (
                  <div
                    key={img.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      img.is_current
                        ? 'border-[#0A66C2] ring-2 ring-[#0A66C2]/20'
                        : 'border-[#E0DFDC] hover:border-[#0A66C2]'
                    }`}
                    onClick={() => onSelectImage?.(img.id)}
                  >
                    <img
                      src={img.image}
                      alt={img.prompt}
                      className="w-full h-auto object-cover"
                    />
                    {img.is_current && (
                      <div className="absolute top-2 right-2 bg-[#0A66C2] text-white rounded-full p-1.5">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      {!img.is_current && (
                        <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Select
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs text-white line-clamp-2">{img.prompt}</p>
                      <p className="text-xs text-white/70 mt-1">
                        {new Date(img.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E0DFDC] bg-[#F9F9F9]">
              <p className="text-xs text-[#666666] text-center">
                Click on an image to set it as the current one for this post
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PDF History Modal */}
      {showPdfHistory && pdfHistory.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClosePdfHistory}>
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E0DFDC]">
              <h3 className="text-lg font-semibold text-black">PDF History</h3>
              <button
                onClick={onClosePdfHistory}
                className="text-[#666666] hover:text-black hover:bg-[#F3F2F0] rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PDF Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pdfHistory.map((pdf) => (
                  <div
                    key={pdf.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      pdf.is_current
                        ? 'border-[#0A66C2] ring-2 ring-[#0A66C2]/20'
                        : 'border-[#E0DFDC] hover:border-[#0A66C2]'
                    }`}
                    onClick={() => onSelectPDF?.(pdf.id)}
                  >
                    {/* PDF Preview with navigation */}
                    {pdf.slide_images && pdf.slide_images.length > 0 && (
                      <PDFHistoryCarousel
                        slides={pdf.slide_images}
                        pdfId={pdf.id}
                        onSelectPDF={onSelectPDF}
                        isCurrent={pdf.is_current}
                      />
                    )}
                    <div className="p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-black">
                          {pdf.slide_count} {pdf.slide_count === 1 ? 'slide' : 'slides'}
                        </p>
                        <p className="text-xs text-[#666666]">
                          {new Date(pdf.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {pdf.prompts && pdf.prompts.length > 0 && (
                        <p className="text-xs text-[#666666] line-clamp-2">
                          {pdf.prompts[0]}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E0DFDC] bg-[#F9F9F9]">
              <p className="text-xs text-[#666666] text-center">
                Click on a PDF to set it as the current one for this post
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      <FullscreenImageViewer
        imageSrc={currentImage || ''}
        isOpen={showFullscreenImage}
        onClose={() => setShowFullscreenImage(false)}
      />

      {/* Fullscreen Carousel Viewer */}
      <FullscreenCarouselViewer
        slides={currentPDFSlides}
        isOpen={showFullscreenCarousel}
        onClose={() => setShowFullscreenCarousel(false)}
        onRegenerateSlide={onRegenerateSlide}
        regeneratingSlideIndex={regeneratingSlideIndex}
        initialSlide={currentCarouselSlide}
      />

      {/* Regenerate Image Modal */}
      {showRegenerateImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRegenerateImageModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E0DFDC]">
              <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#0A66C2]" />
                Regenerate Image
              </h3>
              <button
                onClick={() => setShowRegenerateImageModal(false)}
                className="text-[#666666] hover:text-black hover:bg-[#F3F2F0] rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-2">
                  Image Prompt
                </label>
                <Textarea
                  value={editableImagePrompt}
                  onChange={(e) => setEditableImagePrompt(e.target.value)}
                  placeholder="Enter a description for the image..."
                  className="min-h-[120px] text-sm resize-none"
                  disabled={generatingImage || isRegeneratingPrompt}
                />
                <p className="text-xs text-[#666666] mt-1">
                  Edit the prompt above to customize the generated image
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E0DFDC] bg-[#F9F9F9] flex flex-col gap-2">
              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Regenerate Prompt Button */}
                {onRegenerateImagePrompt && (
                  <Button
                    onClick={async () => {
                      setIsRegeneratingPrompt(true);
                      try {
                        const newPrompt = await onRegenerateImagePrompt();
                        if (newPrompt) {
                          setEditableImagePrompt(newPrompt);
                        }
                      } finally {
                        setIsRegeneratingPrompt(false);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    disabled={generatingImage || isRegeneratingPrompt}
                    className="flex items-center gap-2 flex-1 relative"
                  >
                    <Wand2 className={`w-4 h-4 ${isRegeneratingPrompt ? 'animate-pulse' : ''}`} />
                    <span>{isRegeneratingPrompt ? 'Regenerating...' : 'Regenerate Prompt'}</span>
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                      x0.5
                    </span>
                  </Button>
                )}

                {/* Generate Image Button */}
                <Button
                  onClick={() => {
                    if (onGenerateImageWithPrompt) {
                      onGenerateImageWithPrompt(editableImagePrompt);
                      setShowRegenerateImageModal(false);
                    } else if (onRegenerateImage) {
                      onRegenerateImage();
                      setShowRegenerateImageModal(false);
                    }
                  }}
                  size="sm"
                  disabled={!editableImagePrompt.trim() || generatingImage || isRegeneratingPrompt}
                  className="flex items-center gap-2 flex-1 bg-[#0A66C2] hover:bg-[#004182] text-white"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Image</span>
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white">
                    x0.2
                  </span>
                </Button>
              </div>

              <p className="text-xs text-[#666666] text-center">
                Use &quot;Regenerate Prompt&quot; to get a new AI-generated prompt, or edit manually and click &quot;Generate Image&quot;
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

