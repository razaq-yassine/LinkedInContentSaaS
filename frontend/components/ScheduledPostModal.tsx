"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LinkedInPostPreview } from "@/components/LinkedInPostPreview";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";
import { Calendar, Clock, X, ExternalLink, Edit2 } from "lucide-react";
import { format } from "date-fns";

interface ScheduledPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    content: string;
    format?: string;
    scheduled_at?: string;
    published_to_linkedin?: boolean;
    created_at?: string;
    conversation_id?: string;
    generation_options?: any;
  };
  userProfile?: {
    name: string;
    headline: string;
    avatar?: string;
  };
  onUpdate?: () => void;
}

export function ScheduledPostModal({
  open,
  onOpenChange,
  post,
  userProfile,
  onUpdate,
}: ScheduledPostModalProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | undefined>();
  const [currentPDFSlides, setCurrentPDFSlides] = useState<string[]>([]);

  useEffect(() => {
    if (open && post) {
      loadMedia();
    }
  }, [open, post]);

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

  const handleCancelSchedule = async () => {
    setLoading(true);
    try {
      await api.generate.cancelSchedule(post.id);
      addToast({
        title: "Success",
        description: "Schedule cancelled successfully",
        variant: "success",
      });
      onUpdate?.();
      onOpenChange(false);
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to cancel schedule",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishNow = async () => {
    setLoading(true);
    try {
      await api.generate.publishNow(post.id);
      addToast({
        title: "Success",
        description: "Post published successfully",
        variant: "success",
      });
      onUpdate?.();
      onOpenChange(false);
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to publish post",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (post.conversation_id) {
      onOpenChange(false);
      router.push(`/generate?conversation=${post.conversation_id}`);
    } else {
      addToast({
        title: "Error",
        description: "Cannot edit this post - no conversation found",
        variant: "error",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {post.published_to_linkedin ? "Published Post" : "Scheduled Post"}
          </DialogTitle>
          <DialogDescription asChild>
            <span className="flex items-center gap-2 mt-2">
              <Clock className="w-4 h-4 text-[#666666]" />
              <span className="text-[#666666]">
                {post.scheduled_at
                  ? `Scheduled for ${format(new Date(post.scheduled_at), "MMM d, yyyy 'at' h:mm a")}`
                  : post.published_to_linkedin && post.created_at
                  ? `Published on ${format(new Date(post.created_at), "MMM d, yyyy 'at' h:mm a")}`
                  : post.created_at
                  ? `Created on ${format(new Date(post.created_at), "MMM d, yyyy 'at' h:mm a")}`
                  : "Post details"}
              </span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Post Preview */}
          <div className="border rounded-lg p-4 bg-[#F9F9F9]">
            <LinkedInPostPreview
              postContent={post.content}
              formatType={post.format}
              imagePrompt={post.generation_options?.image_prompt}
              imagePrompts={post.generation_options?.image_prompts}
              userProfile={userProfile}
              currentImage={currentImage}
              currentPDFSlides={currentPDFSlides}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleEdit}
            disabled={loading || !post.conversation_id}
            className="w-full sm:w-auto"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          {post.scheduled_at && !post.published_to_linkedin && (
            <Button
              variant="outline"
              onClick={handleCancelSchedule}
              disabled={loading}
              className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Schedule
            </Button>
          )}
          <Button
            onClick={handlePublishNow}
            disabled={loading}
            className="w-full sm:w-auto bg-[#0A66C2] hover:bg-[#004182] text-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {loading ? "Publishing..." : "Publish Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

