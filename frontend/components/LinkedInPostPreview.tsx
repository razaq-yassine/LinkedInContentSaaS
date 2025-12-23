'use client';

import React from 'react';
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
  Check
} from 'lucide-react';
import { CarouselSlider } from './CarouselSlider';
import { CarouselPDFLoading } from './CarouselPDFLoading';

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
  onRegeneratePDF?: () => void; // For carousel PDF regeneration
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
  className?: string;
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
  onRegeneratePDF,
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
  className = '',
}: LinkedInPostPreviewProps) {
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
        return <strong key={index} className="font-semibold text-black">{part}</strong>;
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
    <Card className={`w-full max-w-sm bg-white border border-[#E0DFDC] shadow-linkedin-sm overflow-hidden ${className}`}>
      {/* Post Header */}
      <div className="p-3 pb-2">
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
                <h3 className="font-semibold text-xs text-black hover:text-[#0A66C2] hover:underline cursor-pointer truncate">
                  {userProfile.name}
                </h3>
                <p className="text-[10px] text-[#666666] line-clamp-1 truncate">
                  {userProfile.headline}
                </p>
                <p className="text-[10px] text-[#666666] mt-0.5">
                  Now • <span className="inline-block">🌐</span>
                </p>
              </div>
              
              <button className="text-[#666666] hover:bg-[#F3F2F0] rounded-full p-1 transition-colors flex-shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-3 pb-2">
        <div className="text-xs text-black whitespace-pre-wrap leading-relaxed">
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
                className="w-full h-auto object-cover"
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
            <CarouselSlider slides={currentPDFSlides} />
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
      <div className="px-3 py-1.5 border-t border-[#E0DFDC]">
        <div className="flex items-center justify-between text-[10px] text-[#666666]">
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
      <div className="px-1 py-0.5 border-t border-[#E0DFDC]">
        <div className="flex items-center justify-around">
          <button className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-[#F3F2F0] transition-colors text-[#666666] flex-1 justify-center">
            <ThumbsUp className="w-4 h-4" />
            <span className="text-xs font-semibold">Like</span>
          </button>
          <button className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-[#F3F2F0] transition-colors text-[#666666] flex-1 justify-center">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-semibold">Comment</span>
          </button>
          <button className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-[#F3F2F0] transition-colors text-[#666666] flex-1 justify-center">
            <Repeat2 className="w-4 h-4" />
            <span className="text-xs font-semibold">Repost</span>
          </button>
          <button className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-[#F3F2F0] transition-colors text-[#666666] flex-1 justify-center">
            <Send className="w-4 h-4" />
            <span className="text-xs font-semibold">Send</span>
          </button>
        </div>
      </div>

      {/* Action Buttons for User */}
      <div className="px-3 py-2 bg-[#F9F9F9] border-t border-[#E0DFDC]">
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
              <span className="hidden sm:inline">Copy Text</span>
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
              <span className="hidden sm:inline">Copy Prompt</span>
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
              <span className="hidden sm:inline">Copy Prompts</span>
            </Button>
          )}

          {/* Regenerate Image - Show for image posts */}
          {formatType === 'image' && onRegenerateImage && (
            <Button
              onClick={onRegenerateImage}
              variant="outline"
              size="sm"
              disabled={!imagePrompt || generatingImage}
              className="flex items-center gap-1 h-7 text-xs px-2"
              title={imagePrompt ? "Regenerate image from prompt" : "No image prompt available"}
            >
              <RefreshCw className={`w-3 h-3 ${generatingImage ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{generatingImage ? 'Generating...' : 'Regenerate Image'}</span>
            </Button>
          )}

          {/* Regenerate PDF - Show for carousel posts */}
          {formatType === 'carousel' && onRegeneratePDF && (
            <Button
              onClick={onRegeneratePDF}
              variant="outline"
              size="sm"
              disabled={!imagePrompts || imagePrompts.length === 0 || generatingPDF}
              className="flex items-center gap-1 h-7 text-xs px-2"
              title={imagePrompts && imagePrompts.length > 0 ? "Regenerate PDF from prompts" : "No prompts available"}
            >
              <RefreshCw className={`w-3 h-3 ${generatingPDF ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{generatingPDF ? 'Generating...' : 'Regenerate PDF'}</span>
            </Button>
          )}

          {/* Image History - Show for image posts */}
          {formatType === 'image' && onShowImageHistory && imageHistory.length > 0 && (
            <Button
              onClick={onShowImageHistory}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-7 text-xs px-2"
              title="View image history"
            >
              <History className="w-3 h-3" />
              <span className="hidden sm:inline">History ({imageHistory.length})</span>
            </Button>
          )}

          {/* PDF History - Show for carousel posts */}
          {formatType === 'carousel' && onShowPdfHistory && pdfHistory.length > 0 && (
            <Button
              onClick={onShowPdfHistory}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-7 text-xs px-2"
              title="View PDF history"
            >
              <History className="w-3 h-3" />
              <span className="hidden sm:inline">History ({pdfHistory.length})</span>
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
              <span className="hidden sm:inline">Download</span>
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
              <span className="hidden sm:inline">Download PDF</span>
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
              <span className="hidden sm:inline">Regenerate</span>
            </Button>
          )}

          {/* Divider */}
          <div className="h-5 w-px bg-[#E0DFDC] mx-0.5" />

          {/* Schedule */}
          {onSchedule && (
            <Button
              onClick={onSchedule}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-7 text-xs px-2"
              title="Schedule for later"
            >
              <Calendar className="w-3 h-3" />
              <span className="hidden sm:inline">Schedule</span>
            </Button>
          )}

          {/* Post to LinkedIn */}
          {onPost && (
            <Button
              onClick={onPost}
              size="sm"
              className="flex items-center gap-1 h-7 text-xs px-2 bg-[#0A66C2] hover:bg-[#004182] text-white"
              title="Publish to LinkedIn now"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Publish</span>
            </Button>
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
    </Card>
  );
}

