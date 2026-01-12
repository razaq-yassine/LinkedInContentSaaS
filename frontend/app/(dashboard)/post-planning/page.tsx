"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PostHistoryItem } from "@/components/PostHistoryItem";
import { Calendar, Plus, Clock, ChevronLeft, ChevronRight, ChevronDown, Filter } from "lucide-react";
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
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);

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
    const weekDaysShort = ["S", "M", "T", "W", "T", "F", "S"];

    return (
      <div className="space-y-2 sm:space-y-4">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Week day headers - short on mobile */}
          {weekDays.map((day, idx) => (
            <div key={day} className="text-center text-xs sm:text-sm font-semibold text-[#666666] dark:text-slate-400 py-1 sm:py-2">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{weekDaysShort[idx]}</span>
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
                className={`min-h-[50px] sm:min-h-[80px] border rounded-md sm:rounded-lg p-1 sm:p-2 cursor-pointer transition-colors ${
                  isCurrentMonth ? "bg-white dark:bg-slate-800" : "bg-[#F9F9F9] dark:bg-slate-700"
                } ${
                  isCurrentDay
                    ? "border-[#0A66C2] border-2"
                    : "border-[#E0DFDC] dark:border-slate-600"
                } hover:bg-[#F3F2F0] dark:hover:bg-slate-700`}
                onClick={() => {
                  if (dayPosts.length > 0) {
                    setSelectedPost(dayPosts[0]);
                  }
                }}
              >
                <div
                  className={`text-xs sm:text-sm mb-0.5 sm:mb-1 ${
                    isCurrentMonth ? "text-black dark:text-white" : "text-[#666666] dark:text-slate-400"
                  } ${isCurrentDay ? "font-bold text-[#0A66C2]" : ""}`}
                >
                  {format(day, "d")}
                </div>
                {/* Desktop: show time labels */}
                {dayPosts.length > 0 && (
                  <>
                    <div className="hidden sm:block space-y-1">
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
                        <div className="text-xs text-[#666666] dark:text-slate-400 px-2">
                          +{dayPosts.length - 2} more
                        </div>
                      )}
                    </div>
                    {/* Mobile: show dot indicators */}
                    <div className="sm:hidden flex justify-center gap-0.5 mt-1">
                      {dayPosts.slice(0, 3).map((post, idx) => (
                        <div
                          key={post.id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            post.published_to_linkedin
                              ? "bg-green-500"
                              : "bg-[#0A66C2]"
                          }`}
                        />
                      ))}
                      {dayPosts.length > 3 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      )}
                    </div>
                  </>
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
                    ? "border-[#0A66C2] border-2 bg-[#E7F3FF] dark:bg-slate-700"
                    : "border-[#E0DFDC] dark:border-slate-600 bg-white dark:bg-slate-800"
                }`}
              >
                <div
                  className={`text-sm font-semibold mb-2 ${
                    isCurrentDay ? "text-[#0A66C2]" : "text-black dark:text-white"
                  }`}
                >
                  {format(day, "EEE d")}
                </div>
                <div className="space-y-2">
                  {dayPosts.length === 0 ? (
                    <p className="text-xs text-[#666666] dark:text-slate-400">No posts</p>
                  ) : (
                    dayPosts.map((post) => {
                      const displayDate = post.scheduled_at ? new Date(post.scheduled_at) : new Date(post.created_at);
                      return (
                        <div
                          key={post.id}
                          className={`p-2 border rounded cursor-pointer hover:bg-[#F9F9F9] dark:hover:bg-slate-700 ${
                            post.published_to_linkedin
                              ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                              : "bg-white dark:bg-slate-800 border-[#E0DFDC] dark:border-slate-600"
                          }`}
                          onClick={() => setSelectedPost(post)}
                        >
                          <div className="text-xs text-[#666666] dark:text-slate-400 mb-1">
                            {format(displayDate, "h:mm a")}
                          </div>
                          <div className="text-sm text-black dark:text-white truncate">
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
      <div className="min-h-screen bg-[#F3F2F0] dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0A66C2] mx-auto mb-4"></div>
          <p className="text-[#666666] dark:text-slate-400">Loading your content...</p>
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

  // Get current filter label
  const getFilterLabel = () => {
    const labels: Record<string, string> = {
      "scheduled-published": "Scheduled & Published",
      "drafts": "Drafts",
      "all": "All Posts",
    };
    return labels[filterTab] || "Filter";
  };

  const getFilterCount = () => {
    if (filterTab === "scheduled-published") return scheduledAndPublishedCount;
    if (filterTab === "drafts") return draftCount;
    return posts.length;
  };

  return (
    <div className="min-h-screen bg-[#F3F2F0] dark:bg-slate-900 py-4 sm:py-8">
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        {/* Header - responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-8 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">Posts Planning</h1>
            <p className="text-sm sm:text-base text-[#666666] dark:text-slate-400 mt-1">
              Manage your content calendar and track your posts
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => router.push("/generate")}
              className="bg-[#0A66C2] hover:bg-[#004182] text-white rounded-full text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Create New Post</span>
              <span className="sm:hidden">New Post</span>
            </Button>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Desktop Filter Tabs - hidden on mobile */}
          <div className="hidden sm:flex bg-white dark:bg-slate-800 rounded-lg shadow-linkedin-sm border border-[#E0DFDC] dark:border-slate-700 p-2 gap-2 flex-wrap">
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
                    : "text-[#666666] dark:text-slate-300 hover:bg-[#F3F2F0] dark:hover:bg-slate-700"
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

          {/* Mobile Filter Dropdown */}
          <div className="sm:hidden relative">
            <button
              onClick={() => setShowMobileFilterMenu(!showMobileFilterMenu)}
              className="w-full bg-white dark:bg-slate-800 rounded-lg shadow-linkedin-sm border border-[#E0DFDC] dark:border-slate-700 p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#0A66C2]" />
                <span className="font-medium text-black dark:text-white">{getFilterLabel()}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#0A66C2] text-white">
                  {getFilterCount()}
                </span>
              </div>
              <ChevronDown className={`w-5 h-5 text-[#666666] transition-transform ${showMobileFilterMenu ? "rotate-180" : ""}`} />
            </button>

            {/* Mobile Filter Menu */}
            {showMobileFilterMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-[#E0DFDC] dark:border-slate-700 z-50 overflow-hidden">
                {[
                  { key: "scheduled-published", label: "Scheduled & Published", count: scheduledAndPublishedCount },
                  { key: "drafts", label: "Drafts", count: draftCount },
                  { key: "all", label: "All Posts", count: posts.length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setFilterTab(tab.key as typeof filterTab);
                      setShowMobileFilterMenu(false);
                    }}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors ${
                      filterTab === tab.key
                        ? "bg-[#E7F3FF] dark:bg-slate-700 text-[#0A66C2] dark:text-blue-400"
                        : "text-[#666666] dark:text-slate-300 hover:bg-[#F3F2F0] dark:hover:bg-slate-700"
                    }`}
                  >
                    <span className="font-medium">{tab.label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        filterTab === tab.key
                          ? "bg-[#0A66C2] text-white"
                          : "bg-[#E0DFDC] text-[#666666]"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content based on selected tab */}
          {filterTab === "scheduled-published" ? (
            // Calendar View for Scheduled and Published
            <div className="space-y-4">
              {/* Calendar Controls - Responsive */}
              <Card className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-[#E0DFDC] dark:border-slate-700 shadow-linkedin-sm">
                {/* Mobile: stacked layout */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  {/* Navigation row */}
                  <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        viewMode === "month" ? navigateMonth("prev") : navigateWeek("prev")
                      }
                      className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-base sm:text-xl font-semibold text-black dark:text-white min-w-[120px] sm:min-w-[200px] text-center">
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
                      className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                      className="text-xs sm:text-sm px-2 sm:px-3"
                    >
                      Today
                    </Button>
                  </div>
                  {/* View toggle - hidden on mobile (month only on mobile) */}
                  <div className="hidden sm:flex items-center gap-2">
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
              <Card className="p-3 sm:p-6 bg-white dark:bg-slate-800 border border-[#E0DFDC] dark:border-slate-700 shadow-linkedin-sm">
                {viewMode === "month" ? renderMonthView() : renderWeekView()}
              </Card>

              {/* Empty State */}
              {filteredPosts.length === 0 && (
                <Card className="p-12 text-center bg-white dark:bg-slate-800 border border-[#E0DFDC] dark:border-slate-700 shadow-linkedin-sm">
                  <Calendar className="w-16 h-16 text-[#666666] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-black dark:text-white mb-2">No scheduled or published posts</h3>
                  <p className="text-[#666666] dark:text-slate-400 mb-4">
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
                <Card className="p-12 text-center bg-white dark:bg-slate-800 border border-[#E0DFDC] dark:border-slate-700 shadow-linkedin-sm">
                  <Calendar className="w-16 h-16 text-[#666666] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-black dark:text-white mb-2">No posts yet</h3>
                  <p className="text-[#666666] dark:text-slate-400 mb-4">
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
