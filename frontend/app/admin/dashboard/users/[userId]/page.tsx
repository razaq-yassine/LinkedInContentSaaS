"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/admin/charts/MetricCard";
import { TokenUsageChart } from "@/components/admin/charts/TokenUsageChart";
import { TimelineChart } from "@/components/admin/charts/TimelineChart";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  DollarSign,
  Activity,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface UserUsageDetail {
  user_id: string;
  email: string;
  name: string | null;
  total_tokens: number;
  total_cost: number;
  total_requests: number;
  service_breakdown: Record<string, any>;
  model_breakdown: Record<string, any>;
  recent_usage: Array<any>;
}

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  account_type: string;
  email_verified: boolean;
  linkedin_connected: boolean;
  created_at: string;
  subscription?: {
    plan: string;
    posts_this_month: number;
    posts_limit: number;
  };
  stats?: {
    total_posts: number;
    total_comments: number;
    total_conversations: number;
  };
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [usage, setUsage] = useState<UserUsageDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");

      // Fetch user details
      const userResponse = await apiClient.get(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userResponse.data);

      // Fetch usage details
      const usageResponse = await apiClient.get(
        `/api/admin/users/${userId}/usage?period=month`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUsage(usageResponse.data);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
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

  if (!user || !usage) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Failed to load user data.</p>
      </div>
    );
  }

  // Prepare service data
  const serviceData = Object.entries(usage.service_breakdown).map(
    ([service, data]: [string, any]) => ({
      name: service.replace("_", " ").toUpperCase(),
      tokens: data.tokens || 0
    })
  );

  // Prepare model data
  const modelData = Object.entries(usage.model_breakdown).map(
    ([model, data]: [string, any]) => ({
      name: model,
      tokens: data.tokens || 0,
      cost: data.cost || 0
    })
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">User Details</h1>
          <p className="text-muted-foreground mt-1">
            Usage analytics and account information
          </p>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{user.name || "Not set"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-medium">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user.email_verified ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Email Status</p>
                <p className="font-medium">
                  {user.email_verified ? "Verified" : "Not Verified"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user.linkedin_connected ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">LinkedIn</p>
                <p className="font-medium">
                  {user.linkedin_connected ? "Connected" : "Not Connected"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscription</p>
                <p className="font-medium capitalize">
                  {user.subscription?.plan || "Free"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Tokens Used"
          value={usage.total_tokens.toLocaleString()}
          icon={<Activity />}
          subtitle="This month"
        />
        <MetricCard
          title="Total Cost Generated"
          value={usage.total_cost.toFixed(4)}
          prefix="$"
          icon={<DollarSign />}
          subtitle="AI services"
        />
        <MetricCard
          title="Posts Created"
          value={user.stats?.total_posts || 0}
          subtitle={`${usage.total_requests} API requests`}
        />
        <MetricCard
          title="Usage This Month"
          value={user.subscription?.posts_this_month || 0}
          subtitle={`of ${user.subscription?.posts_limit || 0} limit`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TokenUsageChart
          title="Token Usage by Service"
          data={serviceData}
          color="#3b82f6"
        />
        <Card>
          <CardHeader>
            <CardTitle>Usage by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modelData.slice(0, 5).map((model) => (
                <div
                  key={model.name}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{model.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {model.tokens.toLocaleString()} tokens
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${model.cost.toFixed(4)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted">
                <tr>
                  <th className="px-6 py-3">Service</th>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">Tokens</th>
                  <th className="px-6 py-3">Cost</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {usage.recent_usage.map((record: any, index: number) => (
                  <tr key={record.id || index} className="border-b">
                    <td className="px-6 py-4">
                      {record.service_type.replace("_", " ").toUpperCase()}
                    </td>
                    <td className="px-6 py-4">{record.model || "N/A"}</td>
                    <td className="px-6 py-4">{record.tokens.toLocaleString()}</td>
                    <td className="px-6 py-4">${record.cost.toFixed(4)}</td>
                    <td className="px-6 py-4">
                      {new Date(record.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

