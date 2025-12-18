"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { Linkedin } from "lucide-react";

interface Step3Props {
  styleChoice: string;
  onNext: (posts: string[]) => void;
  onBack: () => void;
}

export default function Step3ImportPosts({ styleChoice, onNext, onBack }: Step3Props) {
  const [posts, setPosts] = useState<string[]>(Array(10).fill(""));
  const [loading, setLoading] = useState(false);
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [linkedInName, setLinkedInName] = useState<string | null>(null);

  useEffect(() => {
    checkLinkedInStatus();
    checkForImportedPosts();
  }, []);

  const checkLinkedInStatus = async () => {
    try {
      // Check LinkedIn status via API (includes stored posts)
      const response = await api.auth.linkedInStatus();
      setLinkedInConnected(response.data.connected);
      
      if (response.data.connected) {
        setLinkedInName(response.data.profile?.name || null);
        
        // Load stored posts from backend
        if (response.data.stored_posts && response.data.stored_posts.length > 0) {
          const newPosts = Array(10).fill("");
          response.data.stored_posts.slice(0, 10).forEach((postText: string, index: number) => {
            newPosts[index] = postText || "";
          });
          setPosts(newPosts);
          console.log(`Loaded ${response.data.stored_posts.length} stored posts`);
        }
      }
    } catch (error) {
      console.error("Failed to check LinkedIn status:", error);
      
      // Fallback: check localStorage
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        if (user.linkedin_connected) {
          setLinkedInConnected(true);
          setLinkedInName(user.name);
        }
      }
    }
  };

  const checkForImportedPosts = () => {
    const importedPosts = sessionStorage.getItem("linkedin_imported_posts");
    if (importedPosts) {
      try {
        const parsedPosts = JSON.parse(importedPosts);
        if (Array.isArray(parsedPosts) && parsedPosts.length > 0) {
          const newPosts = [...posts];
          parsedPosts.slice(0, 10).forEach((post: any, index: number) => {
            newPosts[index] = post.text || post.content || "";
          });
          setPosts(newPosts);
          sessionStorage.removeItem("linkedin_imported_posts");
        }
      } catch (error) {
        console.error("Failed to parse imported posts:", error);
      }
    }
  };

  const handleLinkedInConnect = async () => {
    setLoading(true);
    try {
      const response = await api.auth.linkedInConnect("onboarding");
      window.location.href = response.data.authorization_url;
    } catch (error: any) {
      alert("Failed to connect LinkedIn: " + (error.detail || "Unknown error"));
      setLoading(false);
    }
  };

  const handlePostChange = (index: number, value: string) => {
    const newPosts = [...posts];
    newPosts[index] = value;
    setPosts(newPosts);
  };

  const handleNext = () => {
    const filledPosts = posts.filter(p => p.trim().length > 0);
    
    if (styleChoice === "my_style" && filledPosts.length < 1) {
      alert("Please provide at least 1 sample post");
      return;
    }
    
    onNext(filledPosts);
  };

  const handleSkip = () => {
    if (styleChoice === "top_creators") {
      onNext([]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">
          {styleChoice === "my_style" 
            ? "Import Your Writing Samples" 
            : "Import Writing Samples (Optional)"}
        </h2>
        <p className="text-slate-600">
          We need at least 1 of your LinkedIn posts to learn your writing style
        </p>
      </div>

      <Card className="p-6 mb-6">
        {/* LinkedIn Connection Status */}
        {linkedInConnected ? (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Linkedin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">
                  ✓ LinkedIn Connected{linkedInName ? ` as ${linkedInName}` : ""}
                </h3>
                <p className="text-sm text-green-700">
                  Please paste your best LinkedIn posts below to learn your writing style
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Connect LinkedIn (Optional)</h3>
                <p className="text-sm text-blue-700">Connect to enable posting directly to LinkedIn later</p>
              </div>
              <Button
                onClick={handleLinkedInConnect}
                disabled={loading}
                className="bg-[#0A66C2] hover:bg-[#004182] text-white"
              >
                <Linkedin className="w-4 h-4 mr-2" />
                {loading ? "Connecting..." : "Connect LinkedIn"}
              </Button>
            </div>
          </div>
        )}
        
        {/* Instructions */}
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Tip:</strong> Copy your best performing LinkedIn posts and paste them below. 
            Go to your LinkedIn profile → Activity → Posts, then copy the text of 1-3 posts you're proud of.
          </p>
        </div>

        <div className="space-y-6">
          {[0, 1, 2].map((index) => (
            <div key={index}>
              <Label htmlFor={`post-${index}`}>
                Post {index + 1} {index === 0 && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id={`post-${index}`}
                placeholder="Paste your LinkedIn post here..."
                value={posts[index]}
                onChange={(e) => handlePostChange(index, e.target.value)}
                rows={6}
                className="mt-1"
              />
            </div>
          ))}

          <details className="cursor-pointer">
            <summary className="text-sm text-blue-600 hover:underline">
              Add more posts (optional)
            </summary>
            <div className="space-y-6 mt-4">
              {[3, 4, 5, 6, 7, 8, 9].map((index) => (
                <div key={index}>
                  <Label htmlFor={`post-${index}`}>Post {index + 1}</Label>
                  <Textarea
                    id={`post-${index}`}
                    placeholder="Paste your LinkedIn post here..."
                    value={posts[index]}
                    onChange={(e) => handlePostChange(index, e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          </details>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={handleNext}>
          Continue →
        </Button>
      </div>
    </div>
  );
}

