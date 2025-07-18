import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award, Users, Tag, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

const STANDARD_TAGS = ["UK", "USA", "Canada", "New Zealand", "Australia", "Europe", "Asia"];

interface LeaderboardUser {
  id: number;
  username: string;
  name: string;
  displayName?: string;
  tags?: string[];
  totalAnimalsSaved: number;
  donationsAnimalsSaved: number;
  veganAnimalsSaved: number;
  mediaAnimalsSaved: number;
  campaignsAnimalsSaved: number;
  proBonoAnimalsSaved: number;
}

interface TaggedLeaderboardUser extends LeaderboardUser {
  hasTag: boolean;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [customTag, setCustomTag] = useState<string>("");
  const [searchTag, setSearchTag] = useState<string>("");

  // Fetch all users for leaderboard
  const { data: allUsers = [], isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ["/api/leaderboard"],
  });

  // Fetch users with a specific tag
  const { data: taggedUsers = [], isLoading: isTaggedLoading } = useQuery<TaggedLeaderboardUser[]>({
    queryKey: ["/api/leaderboard/tag", searchTag],
    enabled: !!searchTag,
  });

  const currentLeaderboard = searchTag ? taggedUsers : allUsers;
  const isLoadingData = searchTag ? isTaggedLoading : isLoading;

  const getUserRank = (userId: number) => {
    const index = currentLeaderboard.findIndex(user => user.id === userId);
    return index >= 0 ? index + 1 : null;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="h-6 w-6 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const handleTagSearch = () => {
    const tag = selectedTag || customTag.trim();
    if (tag) {
      setSearchTag(tag);
    }
  };

  const clearTagFilter = () => {
    setSearchTag("");
    setSelectedTag("");
    setCustomTag("");
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const userRank = user ? getUserRank(user.id) : null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Sidebar />
      <MobileNav />
      
      <main className="flex-grow pb-20 md:pb-6">
        <div className="p-4 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2 text-foreground flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Impact Leaderboard
            </h2>
            <p className="text-muted-foreground">
              See how your animal advocacy impact compares with others in the community.
            </p>
          </div>

          <div className="max-w-6xl space-y-6">
            {/* Filter by Tag Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Filter by Group
                </CardTitle>
                <CardDescription>
                  View leaderboards for specific groups or regions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="standard-tag">Standard Groups</Label>
                    <Select value={selectedTag} onValueChange={(value) => {
                      setSelectedTag(value);
                      setCustomTag("");
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                      <SelectContent>
                        {STANDARD_TAGS.map((tag) => (
                          <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-tag">Custom Group</Label>
                    <Input
                      id="custom-tag"
                      value={customTag}
                      onChange={(e) => {
                        setCustomTag(e.target.value);
                        setSelectedTag("");
                      }}
                      placeholder="Enter custom tag"
                    />
                  </div>
                  
                  <div className="flex items-end gap-2">
                    <Button onClick={handleTagSearch} disabled={!selectedTag && !customTag.trim()}>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                    {searchTag && (
                      <Button variant="outline" onClick={clearTagFilter}>
                        Clear Filter
                      </Button>
                    )}
                  </div>
                </div>
                
                {searchTag && (
                  <div className="mt-4">
                    <Badge variant="secondary" className="text-sm">
                      <Users className="h-3 w-3 mr-1" />
                      Showing results for: {searchTag}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Your Rank Card */}
            {user && userRank && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Your Ranking</span>
                    <div className="flex items-center gap-2">
                      {getRankIcon(userRank)}
                      <span className="text-lg font-bold">#{userRank}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground">Total Impact</p>
                      <p className="font-bold text-lg">{formatNumber(currentLeaderboard.find(u => u.id === user.id)?.totalAnimalsSaved || 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Donations</p>
                      <p className="font-bold">{formatNumber(currentLeaderboard.find(u => u.id === user.id)?.donationsAnimalsSaved || 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Conversions</p>
                      <p className="font-bold">{formatNumber(currentLeaderboard.find(u => u.id === user.id)?.veganAnimalsSaved || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {searchTag ? `${searchTag} Group Leaderboard` : "Global Leaderboard"}
                </CardTitle>
                <CardDescription>
                  Ranked by total animals saved across all advocacy activities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 rounded-lg border">
                        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                        <div className="flex-grow space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                          <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                        </div>
                        <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : currentLeaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTag ? `No users found with the tag "${searchTag}".` : "No leaderboard data available."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentLeaderboard.map((leaderUser, index) => (
                      <div
                        key={leaderUser.id}
                        className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors ${
                          user?.id === leaderUser.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center justify-center w-8">
                          {getRankIcon(index + 1)}
                        </div>
                        
                        <div className="flex-grow">
                          <p className="font-medium">
                            {leaderUser.displayName || leaderUser.name}
                            {user?.id === leaderUser.id && (
                              <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                            )}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {leaderUser.tags?.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {leaderUser.tags && leaderUser.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{leaderUser.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {formatNumber(leaderUser.totalAnimalsSaved)}
                          </p>
                          <p className="text-xs text-muted-foreground">animals saved</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}