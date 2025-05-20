import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { HandHeart, Leaf, Share2, Megaphone } from "lucide-react";
import { getRelativeTimeString, formatNumber } from "@/lib/utils";

type ActivityType = "donation" | "vegan" | "media" | "campaign";

interface Activity {
  id: number;
  type: ActivityType;
  title: string;
  animalsSaved: number;
  date: string;
}

interface RecentActivityProps {
  activities: Activity[];
  loading?: boolean;
}

export function RecentActivity({ activities, loading = false }: RecentActivityProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start">
                <Skeleton className="w-10 h-10 rounded-full mr-3 flex-shrink-0" />
                <div className="space-y-2 flex-grow">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get icon based on activity type
  const getIcon = (type: ActivityType) => {
    switch (type) {
      case "donation":
        return <HandHeart className="h-5 w-5 text-primary" />;
      case "vegan":
        return <Leaf className="h-5 w-5 text-green-600" />;
      case "media":
        return <Share2 className="h-5 w-5 text-blue-600" />;
      case "campaign":
        return <Megaphone className="h-5 w-5 text-amber-600" />;
    }
  };

  // Get background color based on activity type
  const getIconBgColor = (type: ActivityType) => {
    switch (type) {
      case "donation":
        return "bg-indigo-100";
      case "vegan":
        return "bg-green-100";
      case "media":
        return "bg-blue-100";
      case "campaign":
        return "bg-amber-100";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground">
            No activity recorded yet. Start logging your animal-saving activities!
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconBgColor(activity.type)} mr-3 flex-shrink-0`}>
                  {getIcon(activity.type)}
                </div>
                <div>
                  <h4 className="font-medium">{activity.title}</h4>
                  <p className="text-sm text-gray-500">
                    Saved approximately{" "}
                    <Badge variant="outline" className="ml-1 font-semibold">
                      {formatNumber(activity.animalsSaved)} {activity.animalsSaved === 1 ? "animal" : "animals"}
                    </Badge>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {getRelativeTimeString(activity.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
