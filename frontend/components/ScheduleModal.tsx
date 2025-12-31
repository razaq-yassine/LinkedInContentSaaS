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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";
import { Calendar, Clock, ExternalLink } from "lucide-react";
import { format, addDays, isBefore, startOfToday } from "date-fns";

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postContent: string;
  formatType?: string;
  published?: boolean;
  userProfile?: {
    name: string;
    headline: string;
    avatar?: string;
  };
  onScheduleSuccess?: () => void;
}

export function ScheduleModal({
  open,
  onOpenChange,
  postId,
  postContent,
  formatType,
  published = false,
  userProfile,
  onScheduleSuccess,
}: ScheduleModalProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  
  // Date/time state
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [timezone, setTimezone] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Initialize date/time to tomorrow at 9 AM
  useEffect(() => {
    if (open) {
      const tomorrow = addDays(startOfToday(), 1);
      setSelectedDate(format(tomorrow, "yyyy-MM-dd"));
      setSelectedTime("09:00");
      
      // Detect user's timezone
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(tz);
      } catch (e) {
        setTimezone("UTC");
      }
      
      // Update current time every second
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      
      loadScheduledPosts();
      
      return () => clearInterval(interval);
    }
  }, [open]);

  const loadScheduledPosts = async () => {
    try {
      const response = await api.generate.getScheduledPosts();
      setScheduledPosts(response.data.posts || []);
    } catch (error) {
      console.error("Failed to load scheduled posts:", error);
    }
  };

  const handleScheduleClick = () => {
    if (!selectedDate || !selectedTime) {
      addToast({
        title: "Error",
        description: "Please select both date and time",
        variant: "error",
      });
      return;
    }

    // Combine date and time
    const dateTimeString = `${selectedDate}T${selectedTime}`;
    const localDateTime = new Date(dateTimeString);
    
    // Validate it's in the future
    if (isBefore(localDateTime, new Date())) {
      addToast({
        title: "Error",
        description: "Scheduled time must be in the future",
        variant: "error",
      });
      return;
    }

    // Show confirmation if post is already published
    if (published) {
      setShowConfirmDialog(true);
    } else {
      handleSchedule();
    }
  };

  const handleSchedule = async () => {
    // Combine date and time
    const dateTimeString = `${selectedDate}T${selectedTime}`;
    const localDateTime = new Date(dateTimeString);
    
    // Convert to UTC ISO string for backend
    const utcDateTime = localDateTime.toISOString();

    setScheduling(true);
    try {
      await api.generate.schedulePost(postId, utcDateTime, timezone);
      addToast({
        title: "Success",
        description: "Post scheduled successfully",
        variant: "success",
      });
      onScheduleSuccess?.();
      onOpenChange(false);
      setShowConfirmDialog(false);
      loadScheduledPosts();
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to schedule post",
        variant: "error",
      });
    } finally {
      setScheduling(false);
    }
  };

  const handleViewAll = () => {
    onOpenChange(false);
    router.push("/scheduled-posts");
  };

  // Get upcoming scheduled posts (next 5)
  const upcomingPosts = scheduledPosts
    .filter((post) => new Date(post.scheduled_at) > new Date())
    .slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Post
          </DialogTitle>
          <DialogDescription>
            Choose when to publish this post to LinkedIn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Time Display */}
          <div className="bg-[#E7F3FF] border border-[#0A66C2] rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-[#0A66C2]" />
              <span className="text-[#666666]">Current time:</span>
              <span className="font-semibold text-[#0A66C2]">
                {format(currentTime, "MMM d, yyyy 'at' h:mm:ss a")}
              </span>
              {timezone && (
                <span className="text-xs text-[#666666]">({timezone})</span>
              )}
            </div>
          </div>

          {/* Date/Time Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666666]" />
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={format(startOfToday(), "yyyy-MM-dd")}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666666]" />
                  <Input
                    id="time"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            {timezone && (
              <p className="text-sm text-[#666666]">
                Timezone: {timezone}
              </p>
            )}
          </div>

          {/* Upcoming Scheduled Posts */}
          {upcomingPosts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Upcoming Scheduled Posts</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewAll}
                  className="text-[#0A66C2] hover:text-[#004182]"
                >
                  View all
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {upcomingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-2 bg-white border rounded-lg text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[#666666]">
                        {post.content.substring(0, 50)}...
                      </p>
                      <p className="text-xs text-[#666666] mt-1">
                        {format(new Date(post.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={scheduling}
          >
            Cancel
          </Button>
          <Button
            onClick={handleScheduleClick}
            disabled={scheduling || !selectedDate || !selectedTime}
            className="bg-[#0A66C2] hover:bg-[#004182] text-white"
          >
            {scheduling ? "Scheduling..." : "Schedule Post"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirmation Dialog for Published Posts */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Published Post?</DialogTitle>
            <DialogDescription>
              This post has already been published to LinkedIn. Scheduling it will create a new post at the scheduled time. Do you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={scheduling}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={scheduling}
              className="bg-[#0A66C2] hover:bg-[#004182] text-white"
            >
              {scheduling ? "Scheduling..." : "Yes, Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

