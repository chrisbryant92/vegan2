import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, Medal, Trophy } from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

type LeaderboardEntry = {
  id: number;
  username: string;
  name: string;
  totalAnimalsSaved: number;
  donationsAnimalsSaved: number;
  veganAnimalsSaved: number;
  mediaAnimalsSaved: number;
  campaignsAnimalsSaved: number;
};

export function Leaderboard() {
  const [selectedCategory, setSelectedCategory] = useState<string>("total");
  const { user } = useAuth();
  
  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });
  
  // Sort leaderboard based on selected category
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    switch (selectedCategory) {
      case "donations":
        return b.donationsAnimalsSaved - a.donationsAnimalsSaved;
      case "vegan":
        return b.veganAnimalsSaved - a.veganAnimalsSaved;
      case "media":
        return b.mediaAnimalsSaved - a.mediaAnimalsSaved;
      case "campaigns":
        return b.campaignsAnimalsSaved - a.campaignsAnimalsSaved;
      default:
        return b.totalAnimalsSaved - a.totalAnimalsSaved;
    }
  });
  
  // Find the current user's rank in the leaderboard
  const currentUserRank = sortedLeaderboard.findIndex(entry => entry.id === user?.id) + 1;
  
  // Helper function to get medal icon based on position
  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="w-5 h-5 inline-flex items-center justify-center text-xs font-medium">{position}</span>;
    }
  };
  
  // Get category label and value based on selected category
  const getCategoryValue = (entry: LeaderboardEntry) => {
    switch (selectedCategory) {
      case "donations":
        return entry.donationsAnimalsSaved;
      case "vegan":
        return entry.veganAnimalsSaved;
      case "media":
        return entry.mediaAnimalsSaved;
      case "campaigns":
        return entry.campaignsAnimalsSaved;
      default:
        return entry.totalAnimalsSaved;
    }
  };
  
  const getCategoryLabel = () => {
    switch (selectedCategory) {
      case "donations":
        return "Donations";
      case "vegan":
        return "Vegan Conversions";
      case "media":
        return "Media Shared";
      case "campaigns":
        return "Campaigns";
      default:
        return "Total";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Leaderboard</CardTitle>
          {currentUserRank > 0 && (
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
              Your Rank: {currentUserRank}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="total" className="w-full" onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="total">Total</TabsTrigger>
            <TabsTrigger value="donations">Donations</TabsTrigger>
            <TabsTrigger value="vegan">Vegan</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedCategory} className="mt-0">
            <div className="space-y-1">
              {isLoading ? (
                // Loading state
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center py-2 border-b">
                    <Skeleton className="h-6 w-6 mr-3 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </div>
                ))
              ) : (
                // Leaderboard entries
                sortedLeaderboard.slice(0, 5).map((entry, index) => {
                  const isCurrentUser = entry.id === user?.id;
                  return (
                    <div 
                      key={entry.id} 
                      className={`flex items-center py-2 border-b ${isCurrentUser ? 'bg-blue-50 -mx-2 px-2 rounded' : ''}`}
                    >
                      <div className="mr-3">
                        {getMedalIcon(index + 1)}
                      </div>
                      <div className="flex-1 truncate">
                        <span className={`${isCurrentUser ? 'font-semibold' : ''}`}>
                          {entry.name || entry.username}
                          {isCurrentUser && ' (You)'}
                        </span>
                      </div>
                      <div className="font-medium text-right">
                        {formatNumber(getCategoryValue(entry))} 
                        <span className="text-xs text-gray-500 ml-1">animals</span>
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* Show user's position if not in top 5 */}
              {!isLoading && currentUserRank > 5 && (
                <div className="flex items-center py-2 mt-2 border-t border-b bg-blue-50 -mx-2 px-2 rounded">
                  <div className="mr-3">
                    <span className="w-5 h-5 inline-flex items-center justify-center text-xs font-medium">{currentUserRank}</span>
                  </div>
                  <div className="flex-1 truncate font-semibold">
                    {user?.username} (You)
                  </div>
                  <div className="font-medium text-right">
                    {formatNumber(getCategoryValue(sortedLeaderboard.find(entry => entry.id === user?.id) || { totalAnimalsSaved: 0, donationsAnimalsSaved: 0, veganAnimalsSaved: 0, mediaAnimalsSaved: 0, campaignsAnimalsSaved: 0 } as LeaderboardEntry))}
                    <span className="text-xs text-gray-500 ml-1">animals</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
              <span>Top savers by {getCategoryLabel()}</span>
              <span className="flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" /> Most animals saved
              </span>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}