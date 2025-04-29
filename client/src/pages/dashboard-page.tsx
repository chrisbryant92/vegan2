import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { ImpactChart } from "@/components/dashboard/impact-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
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

  // Prepare data for the impact chart
  const chartData = {
    charitable: stats?.donationsAnimalsSaved || 0,
    vegan: stats?.veganAnimalsSaved || 0,
    media: stats?.mediaAnimalsSaved || 0,
    campaigns: stats?.campaignsAnimalsSaved || 0,
    total: stats?.totalAnimalsSaved || 0,
  };

  // Prepare data for summary cards
  const summaryData = {
    charitable: stats?.donationsAnimalsSaved || 0,
    vegan: stats?.veganAnimalsSaved || 0,
    media: stats?.mediaAnimalsSaved || 0,
    campaigns: stats?.campaignsAnimalsSaved || 0,
  };

  // Combine all activities for the activity feed
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    if (donations && veganConversions && mediaShared && campaigns) {
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
          title: `Shared ${m.mediaType}: "${m.title}" on ${m.platform}`,
          animalsSaved: m.animalsSaved,
          date: m.date,
        })),
        ...campaigns.map(c => ({
          id: `campaign-${c.id}`,
          type: "campaign" as const,
          title: `Participated in campaign: ${c.name}`,
          animalsSaved: c.animalsSaved,
          date: c.startDate,
        })),
      ];

      // Sort by date (most recent first) and take latest 5
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivities(combined.slice(0, 5));
    }
  }, [donations, veganConversions, mediaShared, campaigns]);

  const isLoading = statsLoading || donationsLoading || veganLoading || mediaLoading || campaignsLoading;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <Sidebar />
      <MobileNav />
      
      <main className="flex-grow pb-20 md:pb-6">
        <div className="p-4 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1">Your Impact Dashboard</h2>
            <p className="text-gray-600">Track how many animals you've helped save</p>
          </div>
          
          {/* Summary Cards */}
          <SummaryCards stats={summaryData} loading={isLoading} />
          
          {/* Chart and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <ImpactChart data={chartData} loading={isLoading} />
            <RecentActivity activities={recentActivities} loading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
}
