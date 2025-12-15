"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Step3Props {
  styleChoice: string;
  onNext: (posts: string[]) => void;
  onBack: () => void;
}

export default function Step3ImportPosts({ styleChoice, onNext, onBack }: Step3Props) {
  const [posts, setPosts] = useState<string[]>(Array(10).fill(""));

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

