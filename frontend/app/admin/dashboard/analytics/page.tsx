"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/admin/charts/MetricCard";
import { CostBreakdownDonut } from "@/components/admin/charts/CostBreakdownDonut";
import { TokenUsageChart } from "@/components/admin/charts/TokenUsageChart";
import { TimelineChart } from "@/components/admin/charts/TimelineChart";
import {
  TrendingUp,
  DollarSign,
  Coins,
  Activity,
  Loader2
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface UsageSummary {
  total_tokens: number;
  total_cost: number;
  total_requests: number;
  total_monthly_revenue: number;
  total_yearly_revenue: number;
  net_profit_monthly: number;
  net_profit_yearly: number;
  service_breakdown: Record<string, any>;
  model_breakdown: Record<string, any>;
}

interface TimelineData {
  date: string;
  tokens: number;
  cost: number;
  requests: number;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("month");
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");

      // Fetch summary
      const summaryResponse = await apiClient.get(
        `/api/admin/analytics/summary?period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSummary(summaryResponse.data);

      // Fetch timeline
      const days = period === "week" ? 7 : period === "month" ? 30 : 90;
      const timelineResponse = await apiClient.get(
        `/api/admin/analytics/timeline?days=${days}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setTimeline(timelineResponse.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
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

  if (!summary) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Failed to load analytics data.</p>
      </div>
    );
  }

  // Prepare service breakdown data
  const serviceData = Object.entries(summary.service_breakdown).map(
    ([service, data]: [string, any]) => ({
      name: service.replace("_", " ").toUpperCase(),
      value: data.cost || 0
    })
  );

  // Prepare model breakdown data
  const modelData = Object.entries(summary.model_breakdown)
    .map(([model, data]: [string, any]) => ({
      name: model,
      tokens: data.tokens || 0,
      cost: data.cost || 0
    }))
    .slice(0, 10); // Top 10 models

  const profitMargin =
    summary.total_monthly_revenue > 0
      ? ((summary.net_profit_monthly / summary.total_monthly_revenue) * 100).toFixed(1)
      : "0";

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usage Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track token usage, costs, and profitability
          </p>
        </div>
      </div>

      {/* Time Period Filter */}
      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Tokens Used"
          value={summary.total_tokens.toLocaleString()}
          icon={<Activity />}
          subtitle={`${summary.total_requests} requests`}
        />
        <MetricCard
          title="Total Cost"
          value={summary.total_cost.toFixed(2)}
          prefix="$"
          icon={<DollarSign />}
          subtitle="AI services"
        />
        <MetricCard
          title="Monthly Revenue"
          value={summary.total_monthly_revenue.toFixed(2)}
          prefix="$"
          icon={<Coins />}
          subtitle="From subscriptions"
        />
        <MetricCard
          title="Net Profit (Monthly)"
          value={summary.net_profit_monthly.toFixed(2)}
          prefix="$"
          icon={<TrendingUp />}
          trend={summary.net_profit_monthly > 0 ? "up" : "down"}
          subtitle={`${profitMargin}% margin`}
        />
      </div>

      {/* Service & Model Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostBreakdownDonut title="Cost by Service" data={serviceData} />
        <TokenUsageChart
          title="Token Usage by Model"
          data={modelData.map((m) => ({ name: m.name, tokens: m.tokens }))}
        />
      </div>

      {/* Timeline Chart */}
      <TimelineChart
        title="Daily Usage Timeline"
        data={timeline}
        dataKeys={[
          { key: "cost", name: "Cost ($)", color: "#3b82f6" },
          { key: "tokens", name: "Tokens (÷1000)", color: "#10b981" }
        ]}
      />

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(summary.service_breakdown).map(
                ([service, data]: [string, any]) => (
                  <div key={service} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {service.replace("_", " ").toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {data.tokens?.toLocaleString() || 0} tokens · {data.count || 0}{" "}
                        requests
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${(data.cost || 0).toFixed(4)}</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Models by Cost</CardTitle>
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

      {/* Profit Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Profitability Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Monthly</p>
              <p className="text-2xl font-bold mt-1">
                ${summary.net_profit_monthly.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Revenue: ${summary.total_monthly_revenue.toFixed(2)} - Cost: $
                {summary.total_cost.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Yearly (Projected)</p>
              <p className="text-2xl font-bold mt-1">
                ${summary.net_profit_yearly.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Based on current subscriptions
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profit Margin</p>
              <p className="text-2xl font-bold mt-1">{profitMargin}%</p>
              <p className="text-sm text-muted-foreground mt-1">
                {Number(profitMargin) > 70
                  ? "Excellent"
                  : Number(profitMargin) > 50
                  ? "Good"
                  : "Needs improvement"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

