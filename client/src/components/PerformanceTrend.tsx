import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PerformanceTrendProps {
  playerId?: number;
}

export function PerformanceTrend({ playerId }: PerformanceTrendProps) {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");

  const { data: trendsData, isLoading } = useQuery({
    queryKey: ["/api/trends", { period, playerId }],
  });

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    return period === "weekly" 
      ? `Week of ${format(date, "MMM d")}`
      : format(date, "MMMM");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-[300px] flex items-center justify-center">
            Loading trends data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Trends</CardTitle>
        <CardDescription>
          Track your performance over time
        </CardDescription>
        <div className="flex gap-2">
          <Button
            variant={period === "weekly" ? "default" : "outline"}
            onClick={() => setPeriod("weekly")}
          >
            Weekly
          </Button>
          <Button
            variant={period === "monthly" ? "default" : "outline"}
            onClick={() => setPeriod("monthly")}
          >
            Monthly
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer>
            <LineChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period" 
                tickFormatter={formatDate}
                interval={0}
              />
              <YAxis />
              <Tooltip
                labelFormatter={formatDate}
                formatter={(value: number) => [
                  value.toFixed(2),
                  value.toString().includes("Rate") ? "Win Rate %" : "Games",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="winRate"
                stroke="#10b981"
                name="Win Rate %"
              />
              <Line
                type="monotone"
                dataKey="gamesWon"
                stroke="#3b82f6"
                name="Games Won"
              />
              <Line
                type="monotone"
                dataKey="gamesLost"
                stroke="#ef4444"
                name="Games Lost"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
