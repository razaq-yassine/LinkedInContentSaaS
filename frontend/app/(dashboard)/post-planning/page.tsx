"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PostHistoryItem } from "@/components/PostHistoryItem";
import { Calendar, Plus, Clock, ChevronLeft, ChevronRight } from "lucide-react";
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
import { ScheduledPostModal } from "@/components/ScheduledPostModal";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, isToday } from "date-fns";

type ViewMode = "month" | "week";

export default function HistoryPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"scheduled-published" | "drafts" | "all">("scheduled-published");
  const [user, setUser] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [postToPublish, setPostToPublish] = useState<string | null>(null);
  const [publishingModalOpen, setPublishingModalOpen] = useState(false);
  const [publishingStatus, setPublishingStatus] = useState<"publishing" | "success" | "error">("publishing");
  const [publishingError, setPublishingError] = useState<string>("");
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  
  // Calendar view state
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const handleTogglePublished = async (postId: string, published: boolean) => {
    try {
      await api.generate.togglePublishedStatus(postId, published);
      await loadHistory();
      addToast({
        title: "Success",
        description: `Post marked as ${published ? "published" : "not published"}`,
        variant: "success",
      });
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update published status",
        variant: "error",
      });
    }
  };

  // Calendar functions for scheduled/published posts
  const getPostsForDate = (date: Date) => {
    return posts.filter((post) => {
      // Include scheduled posts
      if (post.scheduled_at) {
        const postDate = new Date(post.scheduled_at);
        return isSameDay(postDate, date);
      }
      // Include published posts (use created_at as fallback for date)
      if (post.published_to_linkedin && post.created_at) {
        const postDate = new Date(post.created_at);
        return isSameDay(postDate, date);
      }
      return false;
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1)
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="space-y-4">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-[#666666] py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day) => {
            const dayPosts = getPostsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] border rounded-lg p-2 cursor-pointer transition-colors ${
                  isCurrentMonth ? "bg-white" : "bg-[#F9F9F9]"
                } ${
                  isCurrentDay
                    ? "border-[#0A66C2] border-2"
                    : "border-[#E0DFDC]"
                } hover:bg-[#F3F2F0]`}
                onClick={() => {
                  if (dayPosts.length > 0) {
                    setSelectedPost(dayPosts[0]);
                  }
                }}
              >
                <div
                  className={`text-sm mb-1 ${
                    isCurrentMonth ? "text-black" : "text-[#666666]"
                  } ${isCurrentDay ? "font-bold text-[#0A66C2]" : ""}`}
                >
                  {format(day, "d")}
                </div>
                {dayPosts.length > 0 && (
                  <div className="space-y-1">
                    {dayPosts.slice(0, 2).map((post) => {
                      const displayDate = post.scheduled_at ? new Date(post.scheduled_at) : new Date(post.created_at);
                      return (
                        <div
                          key={post.id}
                          className={`text-xs px-2 py-1 rounded truncate ${
                            post.published_to_linkedin
                              ? "bg-green-100 text-green-700"
                              : "bg-[#E7F3FF] text-[#0A66C2]"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPost(post);
                          }}
                        >
                          {format(displayDate, "h:mm a")}
                        </div>
                      );
                    })}
                    {dayPosts.length > 2 && (
                      <div className="text-xs text-[#666666] px-2">
                        +{dayPosts.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="space-y-4">
        {/* Week days */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayPosts = getPostsForDate(day);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`border rounded-lg p-3 min-h-[200px] ${
                  isCurrentDay
                    ? "border-[#0A66C2] border-2 bg-[#E7F3FF]"
                    : "border-[#E0DFDC] bg-white"
                }`}
              >
                <div
                  className={`text-sm font-semibold mb-2 ${
                    isCurrentDay ? "text-[#0A66C2]" : "text-black"
                  }`}
                >
                  {format(day, "EEE d")}
                </div>
                <div className="space-y-2">
                  {dayPosts.length === 0 ? (
                    <p className="text-xs text-[#666666]">No posts</p>
                  ) : (
                    dayPosts.map((post) => {
                      const displayDate = post.scheduled_at ? new Date(post.scheduled_at) : new Date(post.created_at);
                      return (
                        <div
                          key={post.id}
                          className={`p-2 border rounded cursor-pointer hover:bg-[#F9F9F9] ${
                            post.published_to_linkedin
                              ? "bg-green-50 border-green-200"
                              : "bg-white border-[#E0DFDC]"
                          }`}
                          onClick={() => setSelectedPost(post)}
                        >
                          <div className="text-xs text-[#666666] mb-1">
                            {format(displayDate, "h:mm a")}
                          </div>
                          <div className="text-sm text-black truncate">
                            {post.content.substring(0, 50)}...
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
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
  const scheduledCount = posts.filter((p) => p.scheduled_at).length;
  const scheduledAndPublishedCount = posts.filter((p) => p.scheduled_at || p.published_to_linkedin).length;
  const draftCount = posts.filter((p) => !p.published_to_linkedin && !p.scheduled_at).length;

  // Filter posts based on selected tab
  const filteredPosts = posts.filter((post) => {
    if (filterTab === "all") return true;
    if (filterTab === "scheduled-published") return post.scheduled_at || post.published_to_linkedin;
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
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">Posts Planning</h1>
            <p className="text-[#666666] mt-1">
              Manage your content calendar and track your posts
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => router.push("/generate")}
              className="bg-[#0A66C2] hover:bg-[#004182] text-white rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Post
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Filter Tabs with counts */}
          <div className="bg-white rounded-lg shadow-linkedin-sm border border-[#E0DFDC] p-2 flex gap-2 flex-wrap">
            {[
              { key: "scheduled-published", label: "Scheduled and Published", count: scheduledAndPublishedCount },
              { key: "drafts", label: "Drafts", count: draftCount },
              { key: "all", label: "All", count: posts.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key as typeof filterTab)}
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

          {/* Content based on selected tab */}
          {filterTab === "scheduled-published" ? (
            // Calendar View for Scheduled and Published
            <div className="space-y-4">
              {/* Calendar Controls */}
              <Card className="p-4 bg-white border border-[#E0DFDC] shadow-linkedin-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        viewMode === "month" ? navigateMonth("prev") : navigateWeek("prev")
                      }
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-xl font-semibold text-black min-w-[200px] text-center">
                      {viewMode === "month"
                        ? format(currentDate, "MMMM yyyy")
                        : `Week of ${format(startOfWeek(currentDate), "MMM d")}`}
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        viewMode === "month" ? navigateMonth("next") : navigateWeek("next")
                      }
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Today
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === "month" ? "default" : "outline"}
                      onClick={() => setViewMode("month")}
                      className={viewMode === "month" ? "bg-[#0A66C2] text-white" : ""}
                      size="sm"
                    >
                      Month
                    </Button>
                    <Button
                      variant={viewMode === "week" ? "default" : "outline"}
                      onClick={() => setViewMode("week")}
                      className={viewMode === "week" ? "bg-[#0A66C2] text-white" : ""}
                      size="sm"
                    >
                      Week
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Calendar View */}
              <Card className="p-6 bg-white border border-[#E0DFDC] shadow-linkedin-sm">
                {viewMode === "month" ? renderMonthView() : renderWeekView()}
              </Card>

              {/* Empty State */}
              {filteredPosts.length === 0 && (
                <Card className="p-12 text-center bg-white border border-[#E0DFDC] shadow-linkedin-sm">
                  <Calendar className="w-16 h-16 text-[#666666] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-black mb-2">No scheduled or published posts</h3>
                  <p className="text-[#666666] mb-4">
                    Schedule or publish posts to see them in the calendar
                  </p>
                  <Button
                    onClick={() => router.push("/generate")}
                    className="bg-[#0A66C2] hover:bg-[#004182] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Post
                  </Button>
                </Card>
              )}
            </div>
          ) : (
            // List View for Drafts and All
            <div className="space-y-4">
              {filteredPosts.length === 0 ? (
                <Card className="p-12 text-center bg-white border border-[#E0DFDC] shadow-linkedin-sm">
                  <Calendar className="w-16 h-16 text-[#666666] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-black mb-2">No posts yet</h3>
                  <p className="text-[#666666] mb-4">
                    {filterTab === "drafts" 
                      ? "Start creating content in the Copilot to see your drafts here"
                      : "Start creating content in the Copilot to see your posts here"}
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
                    onTogglePublished={handleTogglePublished}
                  />
                ))
              )}
            </div>
          )}
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

      {/* Scheduled Post Modal */}
      {selectedPost && (
        <ScheduledPostModal
          open={!!selectedPost}
          onOpenChange={(open) => !open && setSelectedPost(null)}
          post={selectedPost}
          userProfile={userProfile}
          onUpdate={loadHistory}
        />
      )}
    </div>
  );
}
