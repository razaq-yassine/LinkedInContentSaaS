"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LinkedInPostPreview } from "@/components/LinkedInPostPreview";
import { Calendar, Clock, Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { api } from "@/lib/api-client";

export default function HistoryPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("all");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const [postsRes, commentsRes] = await Promise.all([
        api.generate.getHistory("post", 50),
        api.generate.getHistory("comment", 50),
      ]);
      setPosts(postsRes.data);
      setComments(commentsRes.data);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification
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

  const filteredPosts = posts.filter((post) => {
    if (filterTab === "all") return true;
    if (filterTab === "scheduled") return false; // TODO: Add scheduled field
    if (filterTab === "published") return post.published_to_linkedin;
    if (filterTab === "drafts") return !post.published_to_linkedin;
    return true;
  });

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
          <Button className="bg-[#0A66C2] hover:bg-[#004182] text-white rounded-full">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Post
          </Button>
        </div>

        <Tabs defaultValue="posts" className="space-y-6">
          <div className="bg-white rounded-xl shadow-linkedin-md border border-[#E0DFDC] p-1">
            <TabsList className="grid w-full grid-cols-2 bg-transparent gap-1">
              <TabsTrigger 
                value="posts"
                className="data-[state=active]:bg-[#E7F3FF] data-[state=active]:text-[#0A66C2] rounded-lg"
              >
                Posts ({posts.length})
              </TabsTrigger>
              <TabsTrigger 
                value="comments"
                className="data-[state=active]:bg-[#E7F3FF] data-[state=active]:text-[#0A66C2] rounded-lg"
              >
                Comments ({comments.length})
              </TabsTrigger>
        </TabsList>
          </div>

          <TabsContent value="posts" className="space-y-6">
            {/* Filter Tabs */}
            <div className="bg-white rounded-lg shadow-linkedin-sm border border-[#E0DFDC] p-2 flex gap-2">
              {["all", "scheduled", "published", "drafts"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterTab === tab
                      ? "bg-[#0A66C2] text-white"
                      : "text-[#666666] hover:bg-[#F3F2F0]"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Posts List */}
            <div className="space-y-6">
              {filteredPosts.length === 0 ? (
                <Card className="p-12 text-center bg-white border border-[#E0DFDC] shadow-linkedin-sm">
                  <Calendar className="w-16 h-16 text-[#666666] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-black mb-2">No posts yet</h3>
                  <p className="text-[#666666]">
                    Start creating content in the Copilot to see your posts here
                  </p>
              </Card>
            ) : (
                filteredPosts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl shadow-linkedin-md border border-[#E0DFDC] overflow-hidden">
                    {/* Post Header */}
                    <div className="px-6 py-4 border-b border-[#E0DFDC] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className="border-[#0A66C2] text-[#0A66C2] bg-[#E7F3FF]"
                        >
                          {post.format}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-[#666666]">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(post.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#666666] hover:text-[#0A66C2]"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#666666] hover:text-[#CC1016]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#666666]"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Post Preview */}
                    <div className="p-6">
                      <LinkedInPostPreview
                        postContent={post.content}
                        formatType={post.format}
                        imagePrompt={post.generation_options?.image_prompt}
                        imagePrompts={post.generation_options?.image_prompts}
                        userProfile={{
                          name: user?.name || "Your Name",
                          headline: "Professional | Content Creator",
                          avatar: user?.linkedin_profile_picture,
                        }}
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
                            // Format slide prompts nicely: one per line with slide numbers
                            const formattedPrompts = imagePrompts
                              .map((prompt: string, index: number) => `Slide ${index + 1}:\n${prompt}`)
                              .join('\n\n');
                            copyToClipboard(formattedPrompts);
                          }
                        }}
                        onRegenerateImage={() => {
                          alert("Image generation coming soon! The prompt will be sent to an AI image generator.");
                        }}
                        onDownloadImage={() => alert("Image download coming soon!")}
                        onRegenerate={() => alert("Regenerate from history coming soon!")}
                        onSchedule={() => alert("Schedule feature coming soon!")}
                        onPost={() => alert("LinkedIn posting coming soon!")}
                        className="max-w-full"
                      />
                  </div>
                  </div>
              ))
            )}
          </div>
        </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            {comments.length === 0 ? (
              <Card className="p-12 text-center bg-white border border-[#E0DFDC] shadow-linkedin-sm">
                <p className="text-[#666666]">No comments generated yet.</p>
              </Card>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="p-6 bg-white border border-[#E0DFDC] shadow-linkedin-sm">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className="bg-[#E7F3FF] text-[#0A66C2] border border-[#0A66C2]">
                      Score: {comment.worthiness_score}/24
                    </Badge>
                    <span className="text-xs text-[#666666]">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="bg-[#F3F2F0] p-4 rounded-lg mb-4">
                    <p className="whitespace-pre-wrap text-sm text-black">
                      {comment.content}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(comment.content)}
                    className="border-[#E0DFDC] hover:border-[#0A66C2]"
                  >
                    📋 Copy
                  </Button>
                </Card>
              ))
            )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}


