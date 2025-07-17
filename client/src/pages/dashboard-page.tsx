import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { ImpactChart } from "@/components/dashboard/impact-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Leaderboard } from "@/components/dashboard/leaderboard";
import { Donation, VeganConversion, MediaShared, Campaign } from "@shared/schema";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  // Fetch user statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Fetch recent data for activity feed
  const { data: donations, isLoading: donationsLoading } = useQuery<Donation[]>({
    queryKey: ["/api/donations"],
  });

  const { data: veganConversions, isLoading: veganLoading } = useQuery<VeganConversion[]>({
    queryKey: ["/api/vegan-conversions"],
  });

  const { data: mediaShared, isLoading: mediaLoading } = useQuery<MediaShared[]>({
    queryKey: ["/api/media-shared"],
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: proBonoWork, isLoading: proBonoLoading } = useQuery({
    queryKey: ["/api/pro-bono"],
  });

  // Prepare data for the impact chart
  const chartData = {
    charitable: stats?.donationsAnimalsSaved || 0,
    vegan: stats?.veganAnimalsSaved || 0,
    media: stats?.mediaAnimalsSaved || 0,
    campaigns: stats?.campaignsAnimalsSaved || 0,
    proBono: stats?.proBonoAnimalsSaved || 0,
    total: stats?.totalAnimalsSaved || 0,
  };

  // Prepare data for summary cards
  const summaryData = {
    charitable: stats?.donationsAnimalsSaved || 0,
    vegan: stats?.veganAnimalsSaved || 0,
    media: stats?.mediaAnimalsSaved || 0,
    campaigns: stats?.campaignsAnimalsSaved || 0,
    proBono: stats?.proBonoAnimalsSaved || 0,
  };

  // Combine all activities for the activity feed
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    if (donations && veganConversions && mediaShared && campaigns && proBonoWork) {
      const combined = [
        ...donations.map(d => ({
          id: `donation-${d.id}`,
          type: "donation" as const,
          title: `Donated ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(d.amount)} to ${d.organization}`,
          animalsSaved: d.animalsSaved,
          date: d.date,
        })),
        ...veganConversions.map(v => ({
          id: `vegan-${v.id}`,
          type: "vegan" as const,
          title: `${v.personName ? v.personName : v.relationship} ${v.conversionType} conversion`,
          animalsSaved: v.animalsSaved,
          date: v.date,
        })),
        ...mediaShared.map(m => ({
          id: `media-${m.id}`,
          type: "media" as const,
          title: `Shared "${m.title}" media campaign`,
          animalsSaved: m.animalsSaved,
          date: m.dateStarted,
        })),
        ...campaigns.map(c => ({
          id: `campaign-${c.id}`,
          type: "campaign" as const,
          title: `Participated in campaign: ${c.name}`,
          animalsSaved: c.animals_saved,
          date: c.start_date || c.created_at,
        })),
        ...proBonoWork.map(p => ({
          id: `proBono-${p.id}`,
          type: "proBono" as const,
          title: `Pro bono ${p.role} work at ${p.organization}`,
          animalsSaved: p.animalsSaved,
          date: p.dateStarted,
        })),
      ];

      // Sort by date (most recent first) and take latest 5
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivities(combined.slice(0, 5));
    }
  }, [donations, veganConversions, mediaShared, campaigns, proBonoWork]);

  const isLoading = statsLoading || donationsLoading || veganLoading || mediaLoading || campaignsLoading || proBonoLoading;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Sidebar />
      <MobileNav />
      
      <main className="flex-grow pb-20 md:pb-6">
        <div className="p-4 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1 text-foreground">Your Impact Dashboard</h2>
            <p className="text-muted-foreground">
              Track how many animals you've helped save • {" "}
              <a 
                href="https://docs.google.com/spreadsheets/d/1KUcEWd50HoJ3i89azb1O1-HRWGChkRU18xPvRN2zGKQ/edit?gid=1826119359#gid=1826119359" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Data underlying our model is here
              </a>
            </p>
          </div>
          
          {/* Summary Cards */}
          <SummaryCards stats={summaryData} loading={isLoading} />
          
          {/* Recent Activity */}
          <div className="grid grid-cols-1 gap-6 mt-8">
            <RecentActivity activities={recentActivities} loading={isLoading} />
          </div>
          
          {/* Leaderboard */}
          <div className="mt-8">
            <Leaderboard />
          </div>
        </div>
      </main>
    </div>
  );
}
