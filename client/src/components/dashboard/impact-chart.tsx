import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";

interface ImpactChartProps {
  data: {
    charitable: number;
    vegan: number;
    media: number;
    campaigns: number;
    total: number;
  };
  loading?: boolean;
}

export function ImpactChart({ data, loading = false }: ImpactChartProps) {
  const chartData = [
    {
      name: "Charitable",
      animals: data.charitable,
      color: "#22c55e" // Green - match with summary cards
    },
    {
      name: "Conversions",
      animals: data.vegan,
      color: "#eab308" // Yellow - match with summary cards
    },
    {
      name: "Sharing",
      animals: data.media,
      color: "#3b82f6" // Blue - match with summary cards
    },
    {
      name: "Campaigns",
      animals: data.campaigns,
      color: "#ef4444" // Red - match with summary cards
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Total Animals Saved</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Skeleton className="w-full h-[250px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Animals Saved by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${formatNumber(value as number)} animals`, 'Impact']}
                labelFormatter={(name) => `${name} Impact`}
              />
              <Legend />
              <Bar 
                dataKey="animals" 
                name="Animals Saved" 
                radius={[4, 4, 0, 0]}
                fill="#4F46E5"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
