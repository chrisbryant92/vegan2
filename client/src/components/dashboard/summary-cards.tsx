import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { HandHeart, Leaf, Share2, Megaphone } from "lucide-react";
import { calculateProgress } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  progress: number;
  progressColor: string;
  goal?: number;
}

function SummaryCard({ title, value, icon, progress, progressColor, goal }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-opacity-20" style={{ backgroundColor: `${progressColor}20` }}>
            {icon}
          </div>
        </div>
        <Progress value={progress} className="h-2" indicatorClassName={progressColor} />
        {goal && (
          <p className="text-xs text-gray-500 mt-1">
            {progress}% of your goal ({goal})
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface SummaryCardsProps {
  stats: {
    charitable: number;
    vegan: number;
    media: number;
    campaigns: number;
  };
  goals?: {
    charitable?: number;
    vegan?: number;
    media?: number;
    campaigns?: number;
  };
  loading?: boolean;
}

export function SummaryCards({ stats, goals = {}, loading = false }: SummaryCardsProps) {
  // Default goals if not provided
  const defaultGoals = {
    charitable: goals.charitable || 250,
    vegan: goals.vegan || 200,
    media: goals.media || 150,
    campaigns: goals.campaigns || 100
  };

  // Calculate progress percentages
  const progressPercentages = {
    charitable: calculateProgress(stats.charitable, defaultGoals.charitable),
    vegan: calculateProgress(stats.vegan, defaultGoals.vegan),
    media: calculateProgress(stats.media, defaultGoals.media),
    campaigns: calculateProgress(stats.campaigns, defaultGoals.campaigns)
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="w-10 h-10 rounded-full" />
              </div>
              <Skeleton className="h-2 w-full mt-4" />
              <Skeleton className="h-3 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Charitable Donations"
        value={stats.charitable}
        icon={<HandHeart className="h-5 w-5 text-primary" />}
        progress={progressPercentages.charitable}
        progressColor="bg-primary"
        goal={defaultGoals.charitable}
      />
      
      <SummaryCard
        title="Conversions"
        value={stats.vegan}
        icon={<Leaf className="h-5 w-5 text-green-600" />}
        progress={progressPercentages.vegan}
        progressColor="bg-green-600"
        goal={defaultGoals.vegan}
      />
      
      <SummaryCard
        title="Sharing"
        value={stats.media}
        icon={<Share2 className="h-5 w-5 text-blue-600" />}
        progress={progressPercentages.media}
        progressColor="bg-blue-600"
        goal={defaultGoals.media}
      />
      
      <SummaryCard
        title="Online Campaigns"
        value={stats.campaigns}
        icon={<Megaphone className="h-5 w-5 text-amber-600" />}
        progress={progressPercentages.campaigns}
        progressColor="bg-amber-600"
        goal={defaultGoals.campaigns}
      />
    </div>
  );
}
