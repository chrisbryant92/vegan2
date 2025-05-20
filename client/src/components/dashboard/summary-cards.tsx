import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { HandHeart, Leaf, Share2, Megaphone } from "lucide-react";
import { calculateProgress, formatNumber } from "@/lib/utils";
import { EditGoalsDialog } from "./edit-goals-dialog";

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
            <h3 className="text-2xl font-bold">{formatNumber(value)}</h3>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-opacity-20" style={{ backgroundColor: `${progressColor}20` }}>
            {icon}
          </div>
        </div>
        <Progress value={progress} className="h-2" style={{ backgroundColor: `${progressColor}20` }} />
        {goal && (
          <p className="text-xs text-gray-500 mt-1">
            {progress.toFixed(2)}% of your goal ({formatNumber(goal)})
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

// Goals data type
interface GoalsData {
  charitable: number;
  vegan: number;
  media: number;
  campaigns: number;
}

export function SummaryCards({ stats, goals = {}, loading = false }: SummaryCardsProps) {
  // Initial default goals
  const initialDefaultGoals = {
    charitable: 250,
    vegan: 200,
    media: 150,
    campaigns: 100
  };
  
  // State for custom goals
  const [customGoals, setCustomGoals] = useState<GoalsData>(() => {
    // Try to load saved goals from localStorage
    const savedGoals = localStorage.getItem('impact-goals');
    if (savedGoals) {
      try {
        return JSON.parse(savedGoals);
      } catch (e) {
        return initialDefaultGoals;
      }
    }
    return initialDefaultGoals;
  });
  
  // Override with props if provided
  const activeGoals = {
    charitable: goals.charitable || customGoals.charitable,
    vegan: goals.vegan || customGoals.vegan,
    media: goals.media || customGoals.media,
    campaigns: goals.campaigns || customGoals.campaigns
  };

  // Save goals to localStorage when they change
  useEffect(() => {
    localStorage.setItem('impact-goals', JSON.stringify(customGoals));
  }, [customGoals]);

  // Calculate progress percentages
  const progressPercentages = {
    charitable: calculateProgress(stats.charitable, activeGoals.charitable),
    vegan: calculateProgress(stats.vegan, activeGoals.vegan),
    media: calculateProgress(stats.media, activeGoals.media),
    campaigns: calculateProgress(stats.campaigns, activeGoals.campaigns)
  };
  
  // Handle saving new goals
  const handleSaveGoals = (newGoals: GoalsData) => {
    setCustomGoals(newGoals);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Your Impact</h2>
          {/* Placeholder for edit button */}
          <div className="w-24 h-8">
            <Skeleton className="h-full w-full rounded-md" />
          </div>
        </div>
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Your Impact</h2>
        
        {/* Edit Goals Button and Dialog */}
        <EditGoalsDialog 
          currentGoals={customGoals} 
          onSaveGoals={handleSaveGoals} 
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Charitable Donations"
          value={stats.charitable}
          icon={<HandHeart className="h-5 w-5 text-primary" />}
          progress={progressPercentages.charitable}
          progressColor="bg-primary"
          goal={activeGoals.charitable}
        />
        
        <SummaryCard
          title="Conversions"
          value={stats.vegan}
          icon={<Leaf className="h-5 w-5 text-green-600" />}
          progress={progressPercentages.vegan}
          progressColor="bg-green-600"
          goal={activeGoals.vegan}
        />
        
        <SummaryCard
          title="Sharing"
          value={stats.media}
          icon={<Share2 className="h-5 w-5 text-blue-600" />}
          progress={progressPercentages.media}
          progressColor="bg-blue-600"
          goal={activeGoals.media}
        />
        
        <SummaryCard
          title="Online Campaigns"
          value={stats.campaigns}
          icon={<Megaphone className="h-5 w-5 text-amber-600" />}
          progress={progressPercentages.campaigns}
          progressColor="bg-amber-600"
          goal={activeGoals.campaigns}
        />
      </div>
    </div>
  );
}
