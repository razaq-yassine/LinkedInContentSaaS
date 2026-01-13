"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, isToday, getWeek } from "date-fns";
import { ScheduledPostModal } from "@/components/ScheduledPostModal";

type ViewMode = "month" | "week";

export default function ScheduledPostsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setUserProfile({
        name: user.name || "User",
        headline: user.headline || "",
        avatar: user.avatar,
      });
    }
    loadScheduledPosts();
  }, []);

  const loadScheduledPosts = async () => {
    try {
      const response = await api.generate.getScheduledPosts();
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error("Failed to load scheduled posts:", error);
      addToast({
        title: "Error",
        description: "Failed to load scheduled posts",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPostsForDate = (date: Date) => {
    return posts.filter((post) => {
      const postDate = new Date(post.scheduled_at);
      return isSameDay(postDate, date);
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
                    {dayPosts.slice(0, 2).map((post) => (
                      <div
                        key={post.id}
                        className="text-xs bg-[#E7F3FF] text-[#0A66C2] px-2 py-1 rounded truncate"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPost(post);
                        }}
                      >
                        {format(new Date(post.scheduled_at), "h:mm a")}
                      </div>
                    ))}
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
                    <p className="text-xs text-[#666666]">No posts scheduled</p>
                  ) : (
                    dayPosts.map((post) => (
                      <div
                        key={post.id}
                        className="p-2 bg-white border rounded cursor-pointer hover:bg-[#F9F9F9]"
                        onClick={() => setSelectedPost(post)}
                      >
                        <div className="text-xs text-[#666666] mb-1">
                          {format(new Date(post.scheduled_at), "h:mm a")}
                        </div>
                        <div className="text-sm text-black truncate">
                          {post.content.substring(0, 50)}...
                        </div>
                      </div>
                    ))
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-[#666666] mx-auto mb-4 animate-spin" />
          <p className="text-[#666666]">Loading scheduled posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2F0] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">
                Scheduled Posts
              </h1>
              <p className="text-[#666666]">
                Manage your scheduled LinkedIn posts
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                onClick={() => setViewMode("month")}
                className={viewMode === "month" ? "bg-[#0A66C2] text-white" : ""}
              >
                Month
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                onClick={() => setViewMode("week")}
                className={viewMode === "week" ? "bg-[#0A66C2] text-white" : ""}
              >
                Week
              </Button>
            </div>
          </div>

          {/* Navigation */}
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
            <Badge variant="outline" className="border-[#0A66C2] text-[#0A66C2]">
              {posts.length} scheduled
            </Badge>
          </div>
        </div>

        {/* Calendar View */}
        <Card className="p-6 bg-white border border-[#E0DFDC] shadow-linkedin-sm">
          {viewMode === "month" ? renderMonthView() : renderWeekView()}
        </Card>

        {/* Empty State */}
        {posts.length === 0 && (
          <Card className="p-12 text-center bg-white border border-[#E0DFDC] shadow-linkedin-sm mt-6">
            <Calendar className="w-16 h-16 text-[#666666] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-black mb-2">
              No scheduled posts
            </h3>
            <p className="text-[#666666] mb-4">
              Schedule posts from the Copilot to see them here
            </p>
            <Button
              onClick={() => router.push("/generate")}
              className="bg-[#0A66C2] hover:bg-[#004182] text-white"
            >
              Go to Copilot
            </Button>
          </Card>
        )}
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <ScheduledPostModal
          open={!!selectedPost}
          onOpenChange={(open) => !open && setSelectedPost(null)}
          post={selectedPost}
          userProfile={userProfile}
          onUpdate={loadScheduledPosts}
        />
      )}
    </div>
  );
}


