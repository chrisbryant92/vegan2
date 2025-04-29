import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

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
      color: "#4F46E5" // primary
    },
    {
      name: "Vegan",
      animals: data.vegan,
      color: "#10B981" // secondary/green
    },
    {
      name: "Media",
      animals: data.media,
      color: "#3B82F6" // blue
    },
    {
      name: "Campaigns",
      animals: data.campaigns,
      color: "#F59E0B" // amber/accent
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
        <CardTitle>Total Animals Saved</CardTitle>
        <div className="text-2xl font-bold text-primary">{data.total}</div>
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
                formatter={(value) => [`${value} animals`, 'Impact']}
                labelFormatter={(name) => `${name} Impact`}
              />
              <Legend />
              <Bar 
                dataKey="animals" 
                name="Animals Saved" 
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
