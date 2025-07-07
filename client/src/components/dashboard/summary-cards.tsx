import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { HandHeart, Leaf, Share2, Megaphone, Building2 } from "lucide-react";
import { calculateProgress, formatNumber } from "@/lib/utils";
import { EditGoalsDialog } from "./edit-goals-dialog";

// Define category colors
const CATEGORY_COLORS = {
  charitable: "#22c55e", // Green
  vegan: "#eab308", // Yellow
  media: "#3b82f6", // Blue
  campaigns: "#ef4444", // Red
  proBono: "#8b5cf6", // Purple
};

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  progress: number;
  progressColor: string;
  goal?: number;
}

function SummaryCard({ title, value, icon, progress, progressColor, goal }: SummaryCardProps) {
  // Get color based on title
  let color = "";
  if (title === "Charitable Donations") color = CATEGORY_COLORS.charitable;
  else if (title === "Conversions") color = CATEGORY_COLORS.vegan;
  else if (title === "Sharing") color = CATEGORY_COLORS.media;
  else if (title === "Online Campaigns") color = CATEGORY_COLORS.campaigns;
  else if (title === "Pro Bono Work") color = CATEGORY_COLORS.proBono;
  
  return (
    <Card className="border-t-4" style={{ borderTopColor: color }}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold" style={{ color }}>{formatNumber(value)}</h3>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" 
               style={{ backgroundColor: `${color}20` }}>
            <div style={{ color }}>{icon}</div>
          </div>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: `${color}20` }}>
          <div 
            className="h-full" 
            style={{ 
              width: `${progress}%`, 
              backgroundColor: color,
              maxWidth: '100%'
            }}
          ></div>
        </div>
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
    proBono: number;
  };
  goals?: {
    charitable?: number;
    vegan?: number;
    media?: number;
    campaigns?: number;
    proBono?: number;
  };
  loading?: boolean;
}

// Goals data type
interface GoalsData {
  charitable: number;
  vegan: number;
  media: number;
  campaigns: number;
  proBono: number;
}

// Total Impact Card component with stacked bar graph
function TotalImpactCard({ 
  totalValue, 
  progressValue, 
  stats
}: { 
  totalValue: number, 
  progressValue: number,
  stats: {
    charitable: number;
    vegan: number;
    media: number;
    campaigns: number;
    proBono: number;
  }
}) {
  // Calculate percentages of each category for the stacked bar
  const getPercentage = (value: number) => (totalValue > 0 ? (value / totalValue) * 100 : 0);
  
  const percentages = {
    charitable: getPercentage(stats.charitable),
    vegan: getPercentage(stats.vegan),
    media: getPercentage(stats.media),
    campaigns: getPercentage(stats.campaigns),
    proBono: getPercentage(stats.proBono)
  };

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-4 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
      <CardContent className="pt-6">
        <div className="mb-2">
          <p className="text-sm font-medium text-slate-700">Total Animals Saved</p>
          <h3 className="text-3xl font-bold text-slate-900">
            {formatNumber(totalValue)}
          </h3>
        </div>
        
        {/* Combined progress bar: colored by category + gray for remaining */}
        <div className="h-8 w-full bg-slate-200 rounded-full overflow-hidden mt-2 mb-1">
          {/* This div is limited to progressValue width, showing actual progress toward goal */}
          <div className="h-full flex" style={{ width: `${Math.min(progressValue, 100)}%` }}>
            {/* Calculate each segment as a percentage of the total progress */}
            <div className="h-full" style={{ 
              width: `${(stats.charitable / totalValue) * 100}%`, 
              backgroundColor: CATEGORY_COLORS.charitable 
            }}></div>
            <div className="h-full" style={{ 
              width: `${(stats.vegan / totalValue) * 100}%`, 
              backgroundColor: CATEGORY_COLORS.vegan 
            }}></div>
            <div className="h-full" style={{ 
              width: `${(stats.media / totalValue) * 100}%`, 
              backgroundColor: CATEGORY_COLORS.media 
            }}></div>
            <div className="h-full" style={{ 
              width: `${(stats.campaigns / totalValue) * 100}%`, 
              backgroundColor: CATEGORY_COLORS.campaigns 
            }}></div>
            <div className="h-full" style={{ 
              width: `${(stats.proBono / totalValue) * 100}%`, 
              backgroundColor: CATEGORY_COLORS.proBono 
            }}></div>
          </div>
        </div>
        
        <p className="text-xs text-slate-700 mb-3">
          {progressValue.toFixed(2)}% of your combined goal
        </p>
        
        {/* Legend with counts */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3" style={{ backgroundColor: CATEGORY_COLORS.charitable }}></div>
            <span className="text-slate-600">Charitable: </span>
            <span className="font-medium" style={{ color: CATEGORY_COLORS.charitable }}>{formatNumber(stats.charitable)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3" style={{ backgroundColor: CATEGORY_COLORS.vegan }}></div>
            <span className="text-slate-600">Conversions: </span>
            <span className="font-medium" style={{ color: CATEGORY_COLORS.vegan }}>{formatNumber(stats.vegan)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3" style={{ backgroundColor: CATEGORY_COLORS.media }}></div>
            <span className="text-slate-600">Sharing: </span>
            <span className="font-medium" style={{ color: CATEGORY_COLORS.media }}>{formatNumber(stats.media)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3" style={{ backgroundColor: CATEGORY_COLORS.campaigns }}></div>
            <span className="text-slate-600">Campaigns: </span>
            <span className="font-medium" style={{ color: CATEGORY_COLORS.campaigns }}>{formatNumber(stats.campaigns)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SummaryCards({ stats, goals = {}, loading = false }: SummaryCardsProps) {
  // Initial default goals
  const initialDefaultGoals = {
    charitable: 250,
    vegan: 200,
    media: 150,
    campaigns: 100,
    proBono: 300
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
    campaigns: goals.campaigns || customGoals.campaigns,
    proBono: goals.proBono || customGoals.proBono
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
    campaigns: calculateProgress(stats.campaigns, activeGoals.campaigns),
    proBono: calculateProgress(stats.proBono, activeGoals.proBono)
  };
  
  // Calculate total animals saved and total goal
  const totalAnimalsSaved = stats.charitable + stats.vegan + stats.media + stats.campaigns + stats.proBono;
  const totalGoal = activeGoals.charitable + activeGoals.vegan + activeGoals.media + activeGoals.campaigns + activeGoals.proBono;
  const totalProgressPercentage = calculateProgress(totalAnimalsSaved, totalGoal);
  
  // Handle saving new goals
  const handleSaveGoals = (newGoals: GoalsData) => {
    setCustomGoals(newGoals);
  };

  const emptyStats = {
    charitable: 0,
    vegan: 0,
    media: 0,
    campaigns: 0,
    proBono: 0
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
        {/* Loading skeleton for Total card */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-gradient-to-r from-slate-50 to-slate-100">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-9 w-32" />
                </div>
                <Skeleton className="w-12 h-12 rounded-full" />
              </div>
              <Skeleton className="h-5 w-full mt-4" />
              <Skeleton className="h-3 w-40 mt-2" />
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Loading skeleton for category cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
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
      
      {/* Total Animals Saved card */}
      <div className="grid grid-cols-1 gap-4">
        <TotalImpactCard 
          totalValue={totalAnimalsSaved}
          progressValue={totalProgressPercentage}
          stats={stats}
        />
      </div>
      
      {/* Individual category cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
        
        <SummaryCard
          title="Pro Bono Work"
          value={stats.proBono}
          icon={<Building2 className="h-5 w-5 text-purple-600" />}
          progress={progressPercentages.proBono}
          progressColor="bg-purple-600"
          goal={activeGoals.proBono}
        />
      </div>
    </div>
  );
}
