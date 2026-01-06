"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface TokenUsageChartProps {
  title: string;
  data: Array<{
    name: string;
    tokens: number;
    [key: string]: string | number;
  }>;
  color?: string;
}

export function TokenUsageChart({
  title,
  data,
  color = "#3b82f6"
}: TokenUsageChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [
                  value.toLocaleString(),
                  "Tokens"
                ]}
              />
              <Legend />
              <Bar dataKey="tokens" fill={color} name="Tokens" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

