"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LinkedInPostPreview } from "@/components/LinkedInPostPreview";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Edit2,
  Calendar,
  ExternalLink,
  CheckCircle2,
  FileText,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";

type PostStatus = "draft" | "scheduled" | "published";

interface PostHistoryItemProps {
  post: {
    id: string;
    content: string;
    format: string;
    created_at: string;
    conversation_id?: string;
    published_to_linkedin?: boolean;
    scheduled_at?: string;
    generation_options?: {
      image_prompt?: string;
      image_prompts?: string[];
    };
  };
  userProfile: {
    name: string;
    headline: string;
    avatar?: string;
  };
  defaultOpen?: boolean;
  onPublish?: (postId: string) => void;
  onSchedule?: (postId: string) => void;
  onTogglePublished?: (postId: string, published: boolean) => void;
}

export function PostHistoryItem({
  post,
  userProfile,
  defaultOpen,
  onPublish,
  onSchedule,
  onTogglePublished,
}: PostHistoryItemProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [toggling, setToggling] = useState(false);
  const [isOpen, setIsOpen] = useState(defaultOpen ?? true);
  
  // Image/PDF state for post preview
  const [currentImage, setCurrentImage] = useState<string | undefined>();
  const [currentPDFSlides, setCurrentPDFSlides] = useState<string[]>([]);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Determine post status
  const getPostStatus = (): PostStatus => {
    if (post.published_to_linkedin) return "published";
    if (post.scheduled_at) return "scheduled";
    return "draft";
  };

  const status = getPostStatus();

  // Published posts should be collapsed by default
  useEffect(() => {
    if (defaultOpen === undefined) {
      setIsOpen(status !== "published");
    }
  }, [status, defaultOpen]);

  // Load images/PDFs on mount
  useEffect(() => {
    const loadMedia = async () => {
      try {
        if (post.format === "image") {
          const response = await api.images.getCurrent(post.id);
          if (response.data.image) {
            setCurrentImage(`data:image/png;base64,${response.data.image}`);
          }
        } else if (post.format === "carousel") {
          const response = await api.pdfs.getCurrent(post.id);
          if (response.data.slide_images && response.data.slide_images.length > 0) {
            setCurrentPDFSlides(response.data.slide_images);
          }
        }
      } catch (error) {
        // No media yet, that's okay
      }
    };
    loadMedia();
  }, [post.id, post.format]);

  // Get status badge styling
  const getStatusBadge = () => {
    switch (status) {
      case "published":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Published
          </Badge>
        );
      case "scheduled":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-[#0A66C2] border-blue-300 hover:bg-blue-100">
            <FileText className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        );
    }
  };

  // Get format badge
  const getFormatBadge = () => {
    return (
      <Badge variant="outline" className="border-[#E0DFDC] text-[#666666]">
        {post.format}
      </Badge>
    );
  };

  // Generate post title from content (first line or first 50 chars)
  const getPostTitle = () => {
    const firstLine = post.content.split("\n")[0];
    const cleanTitle = firstLine.replace(/^[#*\-\s]+/, "").trim();
    if (cleanTitle.length > 60) {
      return cleanTitle.substring(0, 60) + "...";
    }
    return cleanTitle || "Untitled Post";
  };

  // Handle edit - navigate to conversation
  const handleEdit = () => {
    if (post.conversation_id) {
      router.push(`/generate?conversation=${post.conversation_id}`);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Video scripts cannot be published or scheduled
  const canPublishOrSchedule = status === "draft" && post.format !== "video_script";
  
  const handleTogglePublished = async () => {
    if (!onTogglePublished) return;
    
    setToggling(true);
    try {
      await onTogglePublished(post.id, !post.published_to_linkedin);
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to update published status",
        variant: "error",
      });
    } finally {
      setToggling(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={`bg-white rounded-xl shadow-linkedin-sm border overflow-hidden transition-all ${
          status === "published"
            ? "border-green-200 bg-green-50/30"
            : status === "scheduled"
            ? "border-amber-200 bg-amber-50/30"
            : "border-[#E0DFDC]"
        }`}
      >
        {/* Collapsible Header */}
        <CollapsibleTrigger asChild>
          <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#F9F9F9] transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Expand/Collapse Icon */}
              <div className="text-[#666666]">
                {isOpen ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </div>

              {/* Status Badge */}
              {getStatusBadge()}

              {/* Format Badge */}
              {getFormatBadge()}

              {/* Post Title */}
              <span className="font-medium text-sm text-black truncate flex-1">
                {getPostTitle()}
              </span>

              {/* Date and Time */}
              <div className="flex items-center gap-1.5 text-xs text-[#666666] flex-shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {post.scheduled_at
                    ? new Date(post.scheduled_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : new Date(post.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                </span>
              </div>
            </div>

            {/* Quick Actions in Header */}
            <div
              className="flex items-center gap-2 ml-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Edit Button */}
              {post.conversation_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="text-[#666666] hover:text-[#0A66C2] hover:bg-[#E7F3FF]"
                  title="Edit in conversation"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}

              {/* Schedule Button - Disabled for published posts */}
              {onSchedule && !post.published_to_linkedin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSchedule(post.id)}
                  disabled={post.published_to_linkedin}
                  className="text-[#666666] hover:text-amber-600 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={post.published_to_linkedin ? "Cannot schedule published posts" : "Schedule post"}
                >
                  <Calendar className="w-4 h-4" />
                </Button>
              )}

              {/* Publish Button */}
              {canPublishOrSchedule && onPublish && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPublish(post.id)}
                  className="text-[#666666] hover:text-[#0A66C2] hover:bg-[#E7F3FF]"
                  title="Publish to LinkedIn"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Collapsible Content */}
        <CollapsibleContent>
          <div className="border-t border-[#E0DFDC] p-4">
            {/* LinkedIn Post Preview */}
            <div className="flex justify-center">
              <LinkedInPostPreview
                postContent={post.content}
                formatType={post.format}
                imagePrompt={post.generation_options?.image_prompt}
                imagePrompts={post.generation_options?.image_prompts}
                userProfile={userProfile}
                currentImage={currentImage}
                currentPDFSlides={currentPDFSlides}
                generatingImage={generatingImage}
                generatingPDF={generatingPDF}
                onCopyText={() => copyToClipboard(post.content)}
                onCopyImagePrompt={() => {
                  const imagePrompt = post.generation_options?.image_prompt;
                  if (imagePrompt) {
                    copyToClipboard(imagePrompt);
                  }
                }}
                onCopySlidePrompts={() => {
                  const imagePrompts = post.generation_options?.image_prompts;
                  if (imagePrompts && Array.isArray(imagePrompts) && imagePrompts.length > 0) {
                    const formattedPrompts = imagePrompts
                      .map((prompt: string, index: number) => `Slide ${index + 1}:\n${prompt}`)
                      .join("\n\n");
                    copyToClipboard(formattedPrompts);
                  }
                }}
                // Only show essential actions in history view
                onSchedule={canPublishOrSchedule && onSchedule ? () => onSchedule(post.id) : undefined}
                onPost={canPublishOrSchedule && onPublish ? () => onPublish(post.id) : undefined}
                className="w-full max-w-lg"
              />
            </div>

            {/* Action Buttons Below Preview */}
            <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-[#E0DFDC]">
              {/* Edit Button - Takes to conversation */}
              {post.conversation_id && (
                <Button
                  onClick={handleEdit}
                  variant="outline"
                  className="border-[#0A66C2] text-[#0A66C2] hover:bg-[#E7F3FF]"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit in Conversation
                </Button>
              )}

              {/* Publish Button */}
              {canPublishOrSchedule && onPublish && (
                <Button
                  onClick={() => onPublish(post.id)}
                  className="bg-[#0A66C2] hover:bg-[#004182] text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Publish Now
                </Button>
              )}

              {/* Schedule Button - Disabled for published posts */}
              {onSchedule && !post.published_to_linkedin && (
                <Button
                  onClick={() => onSchedule(post.id)}
                  variant="outline"
                  className="border-amber-500 text-amber-600 hover:bg-amber-50"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
              )}

              {/* Toggle Published Status Button */}
              {onTogglePublished && (
                <Button
                  onClick={handleTogglePublished}
                  variant="outline"
                  disabled={toggling}
                  className={
                    post.published_to_linkedin
                      ? "border-red-300 text-red-600 hover:bg-red-50"
                      : "border-green-300 text-green-600 hover:bg-green-50"
                  }
                >
                  {post.published_to_linkedin ? (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Mark as Not Published
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark as Published
                    </>
                  )}
                </Button>
              )}

              {/* Status indicator for published/scheduled */}
              {status === "published" && !onTogglePublished && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Published to LinkedIn</span>
                </div>
              )}

              {status === "scheduled" && post.scheduled_at && (
                <div className="flex items-center gap-2 text-amber-600">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">
                    Scheduled for{" "}
                    {new Date(post.scheduled_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
