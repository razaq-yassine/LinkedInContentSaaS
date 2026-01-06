"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/admin/charts/MetricCard";
import {
  ArrowLeft,
  DollarSign,
  Activity,
  Image,
  Search,
  Loader2,
  Calendar,
  User,
  FileText
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface PostUsageDetail {
  post_id: string;
  content: string;
  format: string;
  topic: string | null;
  created_at: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  text_generation_cost: number;
  text_input_tokens: number;
  text_output_tokens: number;
  text_model: string | null;
  text_provider: string | null;
  image_generation_cost: number;
  image_count: number;
  image_model: string | null;
  search_cost: number;
  search_count: number;
  total_cost: number;
  total_tokens: number;
  generation_options: any;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  const [post, setPost] = useState<PostUsageDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPostDetail();
  }, [postId]);

  const fetchPostDetail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await apiClient.get(`/api/admin/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPost(response.data);
    } catch (error) {
      console.error("Failed to fetch post details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Failed to load post details.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Post Details</h1>
          <p className="text-muted-foreground mt-1">
            Detailed cost breakdown and usage analytics
          </p>
        </div>
      </div>

      {/* Post Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>Post Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Topic</p>
            <p className="font-medium">{post.topic || "No topic specified"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Content</p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Format</p>
                <p className="font-medium capitalize">{post.format}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(post.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">User</p>
                <p className="font-medium">{post.user_name || post.user_email}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Cost"
          value={post.total_cost.toFixed(4)}
          prefix="$"
          icon={<DollarSign />}
          subtitle="All services"
        />
        <MetricCard
          title="Text Generation"
          value={post.text_generation_cost.toFixed(4)}
          prefix="$"
          icon={<Activity />}
          subtitle={`${post.total_tokens.toLocaleString()} tokens`}
        />
        <MetricCard
          title="Image Generation"
          value={post.image_generation_cost.toFixed(4)}
          prefix="$"
          icon={<Image />}
          subtitle={`${post.image_count} image${post.image_count !== 1 ? "s" : ""}`}
        />
        <MetricCard
          title="Search API"
          value={post.search_cost.toFixed(4)}
          prefix="$"
          icon={<Search />}
          subtitle={`${post.search_count} search${post.search_count !== 1 ? "es" : ""}`}
        />
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Text Generation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Text Generation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Model</span>
                <span className="font-medium">{post.text_model || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Provider</span>
                <span className="font-medium capitalize">
                  {post.text_provider || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Input Tokens</span>
                <span className="font-medium">
                  {post.text_input_tokens.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Output Tokens</span>
                <span className="font-medium">
                  {post.text_output_tokens.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Total Cost</span>
                <span className="font-bold text-lg">
                  ${post.text_generation_cost.toFixed(4)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Generation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Image Generation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Model</span>
                <span className="font-medium">{post.image_model || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Provider</span>
                <span className="font-medium">Cloudflare</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Images Generated</span>
                <span className="font-medium">{post.image_count}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Total Cost</span>
                <span className="font-bold text-lg">
                  ${post.image_generation_cost.toFixed(4)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Service</th>
                  <th className="px-6 py-3 text-left font-medium">Model</th>
                  <th className="px-6 py-3 text-right font-medium">Input Tokens</th>
                  <th className="px-6 py-3 text-right font-medium">Output Tokens</th>
                  <th className="px-6 py-3 text-right font-medium">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {post.text_generation_cost > 0 && (
                  <tr>
                    <td className="px-6 py-4">Text Generation</td>
                    <td className="px-6 py-4">{post.text_model || "N/A"}</td>
                    <td className="px-6 py-4 text-right">
                      {post.text_input_tokens.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {post.text_output_tokens.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ${post.text_generation_cost.toFixed(4)}
                    </td>
                  </tr>
                )}
                {post.image_generation_cost > 0 && (
                  <tr>
                    <td className="px-6 py-4">Image Generation</td>
                    <td className="px-6 py-4">{post.image_model || "N/A"}</td>
                    <td className="px-6 py-4 text-right">-</td>
                    <td className="px-6 py-4 text-right">
                      {post.image_count} image{post.image_count !== 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ${post.image_generation_cost.toFixed(4)}
                    </td>
                  </tr>
                )}
                {post.search_cost > 0 && (
                  <tr>
                    <td className="px-6 py-4">Search API</td>
                    <td className="px-6 py-4">Brave Search</td>
                    <td className="px-6 py-4 text-right">-</td>
                    <td className="px-6 py-4 text-right">
                      {post.search_count} search{post.search_count !== 1 ? "es" : ""}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ${post.search_cost.toFixed(4)}
                    </td>
                  </tr>
                )}
                <tr className="bg-muted/50 font-bold">
                  <td className="px-6 py-4" colSpan={4}>
                    Total
                  </td>
                  <td className="px-6 py-4 text-right">
                    ${post.total_cost.toFixed(4)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Generation Options */}
      {post.generation_options && (
        <Card>
          <CardHeader>
            <CardTitle>Generation Options</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted/50 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(post.generation_options, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

