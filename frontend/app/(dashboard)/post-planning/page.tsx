"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostHistoryItem } from "@/components/PostHistoryItem";
import { Calendar, Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PublishingModal } from "@/components/PublishingModal";

export default function HistoryPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("all");
  const [user, setUser] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [postToPublish, setPostToPublish] = useState<string | null>(null);
  const [publishingModalOpen, setPublishingModalOpen] = useState(false);
  const [publishingStatus, setPublishingStatus] = useState<"publishing" | "success" | "error">("publishing");
  const [publishingError, setPublishingError] = useState<string>("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const postsRes = await api.generate.getHistory("post", 50);
      setPosts(postsRes.data);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handlePublish = async (postId: string) => {
    // Always show confirmation dialog before publishing
    setPostToPublish(postId);
    setConfirmDialogOpen(true);
  };

  const publishPost = async (postId: string) => {
    try {
      const response = await api.generate.publish(postId);
      if (response.data.success) {
        // Reload posts to update the UI
        await loadHistory();
        // Show success toast
        addToast({
          title: "Published successfully!",
          description: "Your post has been published to LinkedIn.",
          variant: "success",
          duration: 5000,
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || "Failed to publish post";
      addToast({
        title: "Publish failed",
        description: errorMessage,
        variant: "error",
        duration: 7000,
      });
      throw error; // Re-throw to handle in modal
    }
  };

  async function publishPostWithModal(postId: string) {
    // Show publishing modal
    setPublishingModalOpen(true);
    setPublishingStatus("publishing");
    setPublishingError("");

    try {
      const response = await api.generate.publish(postId);
      if (response.data.success) {
        // Reload posts to update the UI
        await loadHistory();
        
        // Show success state
        setPublishingStatus("success");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || "Failed to publish post";
      setPublishingStatus("error");
      setPublishingError(errorMessage);
    }
  }

  const handleConfirmPublish = async () => {
    setConfirmDialogOpen(false);
    if (postToPublish) {
      await publishPostWithModal(postToPublish);
      setPostToPublish(null);
    }
  };

  // Helper functions for confirmation dialog
  const getConfirmationTitle = () => {
    if (!postToPublish) return "Publish to LinkedIn";
    const post = posts.find((p) => p.id === postToPublish);
    return post?.published_to_linkedin ? "Post Already Published" : "Publish to LinkedIn";
  };

  const getConfirmationDescription = () => {
    if (!postToPublish) return "";
    const post = posts.find((p) => p.id === postToPublish);
    return post?.published_to_linkedin
      ? "This post has already been published to LinkedIn. Are you sure you want to publish it again?"
      : "This post will be published to your LinkedIn profile and will be visible to your network. Are you sure you want to continue?";
  };

  const getConfirmButtonText = () => {
    if (!postToPublish) return "Publish to LinkedIn";
    const post = posts.find((p) => p.id === postToPublish);
    return post?.published_to_linkedin ? "Publish Again" : "Publish to LinkedIn";
  };

  const handleSchedule = (postId: string) => {
    // TODO: Implement scheduling modal
    alert("Scheduling feature coming soon!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2F0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0A66C2] mx-auto mb-4"></div>
          <p className="text-[#666666]">Loading your content...</p>
        </div>
      </div>
    );
  }

  // Count posts by status
  const publishedCount = posts.filter((p) => p.published_to_linkedin).length;
  const scheduledCount = posts.filter((p) => p.scheduled_at && !p.published_to_linkedin).length;
  const draftCount = posts.filter((p) => !p.published_to_linkedin && !p.scheduled_at).length;

  const filteredPosts = posts.filter((post) => {
    if (filterTab === "all") return true;
    if (filterTab === "scheduled") return post.scheduled_at && !post.published_to_linkedin;
    if (filterTab === "published") return post.published_to_linkedin;
    if (filterTab === "drafts") return !post.published_to_linkedin && !post.scheduled_at;
    return true;
  });

  // User profile for post previews
  const userProfile = {
    name: user?.name || "Your Name",
    headline: "Professional | Content Creator",
    avatar: user?.linkedin_profile_picture,
  };

  return (
    <div className="min-h-screen bg-[#F3F2F0] py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">Posts Planning</h1>
            <p className="text-[#666666] mt-1">
              Manage your content calendar and track your posts
            </p>
          </div>
          <Button 
            onClick={() => router.push("/generate")}
            className="bg-[#0A66C2] hover:bg-[#004182] text-white rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Post
          </Button>
        </div>

        <div className="space-y-6">
            {/* Filter Tabs with counts */}
            <div className="bg-white rounded-lg shadow-linkedin-sm border border-[#E0DFDC] p-2 flex gap-2 flex-wrap">
              {[
                { key: "all", label: "All", count: posts.length },
                { key: "drafts", label: "Drafts", count: draftCount },
                { key: "scheduled", label: "Scheduled", count: scheduledCount },
                { key: "published", label: "Published", count: publishedCount },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    filterTab === tab.key
                      ? "bg-[#0A66C2] text-white"
                      : "text-[#666666] hover:bg-[#F3F2F0]"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      filterTab === tab.key
                        ? "bg-white/20 text-white"
                        : "bg-[#E0DFDC] text-[#666666]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {filteredPosts.length === 0 ? (
                <Card className="p-12 text-center bg-white border border-[#E0DFDC] shadow-linkedin-sm">
                  <Calendar className="w-16 h-16 text-[#666666] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-black mb-2">No posts yet</h3>
                  <p className="text-[#666666] mb-4">
                    Start creating content in the Copilot to see your posts here
                  </p>
                  <Button
                    onClick={() => router.push("/generate")}
                    className="bg-[#0A66C2] hover:bg-[#004182] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Post
                  </Button>
                </Card>
              ) : (
                filteredPosts.map((post) => (
                  <PostHistoryItem
                    key={post.id}
                    post={{
                      id: post.id,
                      content: post.content,
                      format: post.format,
                      created_at: post.created_at,
                      conversation_id: post.conversation_id,
                      published_to_linkedin: post.published_to_linkedin,
                      scheduled_at: post.scheduled_at,
                      generation_options: post.generation_options,
                    }}
                    userProfile={userProfile}
                    onPublish={handlePublish}
                    onSchedule={handleSchedule}
                  />
                ))
              )}
            </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getConfirmationTitle()}</DialogTitle>
            <DialogDescription>{getConfirmationDescription()}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false);
                setPostToPublish(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#0A66C2] hover:bg-[#004182] text-white"
              onClick={handleConfirmPublish}
            >
              {getConfirmButtonText()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publishing Modal */}
      <PublishingModal
        open={publishingModalOpen}
        status={publishingStatus}
        errorMessage={publishingError}
        onClose={() => {
          setPublishingModalOpen(false);
          setPublishingStatus("publishing");
          setPublishingError("");
        }}
      />
    </div>
  );
}


