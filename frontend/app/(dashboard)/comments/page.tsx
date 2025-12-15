"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";

export default function CommentsPage() {
  const [postText, setPostText] = useState("");
  const [evaluation, setEvaluation] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "evaluation" | "comment">("input");

  const handleEvaluate = async () => {
    if (!postText.trim()) {
      alert("Please paste the LinkedIn post text");
      return;
    }

    setLoading(true);
    try {
      // For MVP, we're using text instead of actual screenshot
      const response = await api.generate.evaluateComment(postText);
      setEvaluation(response.data);
      setStep("evaluation");
    } catch (error: any) {
      alert("Evaluation failed: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await api.generate.comment(postText, {});
      setComment(response.data.content);
      setStep("comment");
    } catch (error: any) {
      alert("Generation failed: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const reset = () => {
    setPostText("");
    setEvaluation(null);
    setComment("");
    setStep("input");
  };

  const getScoreColor = (score: number) => {
    if (score >= 20) return "bg-green-500";
    if (score >= 16) return "bg-blue-500";
    if (score >= 12) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRecommendationColor = (rec: string) => {
    if (rec === "COMMENT" || rec === "DEFINITELY COMMENT") return "bg-green-100 text-green-800";
    if (rec === "BORDERLINE") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Comment Generator</h1>
        <p className="text-slate-600">
          Evaluate if a post is worth commenting on, then generate a valuable comment
        </p>
      </div>

      {step === "input" && (
        <Card className="p-6">
          <Label htmlFor="post-text">LinkedIn Post Text</Label>
          <Textarea
            id="post-text"
            placeholder="Paste the LinkedIn post you want to comment on..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            rows={10}
            className="mt-2 mb-4"
          />
          <p className="text-sm text-slate-500 mb-4">
            💡 Tip: Screenshot upload coming soon. For now, paste the post text.
          </p>
          <Button onClick={handleEvaluate} disabled={loading} size="lg" className="w-full">
            {loading ? "Evaluating..." : "Evaluate Worthiness"}
          </Button>
        </Card>
      )}

      {step === "evaluation" && evaluation && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Worthiness Evaluation</h2>

            {/* Score Display */}
            <div className="text-center mb-6">
              <div className="inline-block">
                <div className={`w-32 h-32 rounded-full ${getScoreColor(evaluation.score)} flex items-center justify-center text-white mb-2`}>
                  <div>
                    <div className="text-4xl font-bold">{evaluation.score}</div>
                    <div className="text-sm">/24</div>
                  </div>
                </div>
                <Badge className={getRecommendationColor(evaluation.recommendation)}>
                  {evaluation.recommendation}
                </Badge>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Unique Perspective</span>
                  <span className="font-medium">{evaluation.unique_perspective || "N/A"}/8</span>
                </div>
                <Progress value={(evaluation.unique_perspective || 0) * 12.5} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Value Addition</span>
                  <span className="font-medium">{evaluation.value_addition || "N/A"}/8</span>
                </div>
                <Progress value={(evaluation.value_addition || 0) * 12.5} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Expertise Match</span>
                  <span className="font-medium">{evaluation.expertise_match || "N/A"}/8</span>
                </div>
                <Progress value={(evaluation.expertise_match || 0) * 12.5} />
              </div>
            </div>

            {/* Reasoning */}
            <div className="bg-slate-50 p-4 rounded-lg mb-6">
              <h3 className="font-bold mb-2">Reasoning:</h3>
              <p className="text-slate-700">{evaluation.reasoning}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset}>
                ← Try Another Post
              </Button>
              {(evaluation.recommendation === "COMMENT" || evaluation.recommendation === "DEFINITELY COMMENT") && (
                <Button onClick={handleGenerate} disabled={loading} className="flex-1">
                  {loading ? "Generating..." : "Generate Comment"}
                </Button>
              )}
              {evaluation.recommendation === "SKIP" && (
                <div className="flex-1 text-center py-2 text-slate-600">
                  Not recommended to comment on this post
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {step === "comment" && comment && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Generated Comment</h2>
              <Badge className="bg-green-100 text-green-800">
                Score: {evaluation?.score}/24
              </Badge>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg mb-4">
              <pre className="whitespace-pre-wrap font-sans text-slate-800">{comment}</pre>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={reset}>
                ← New Comment
              </Button>
              <Button onClick={() => copyToClipboard(comment)} className="flex-1">
                📋 Copy Comment
              </Button>
            </div>
          </Card>

          {/* Original Post Reference */}
          <Card className="p-6">
            <h3 className="font-bold mb-2">Original Post:</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {postText.slice(0, 500)}...
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}


