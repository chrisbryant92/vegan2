import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Campaign } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { calculateCampaignImpact } from "@/lib/calculations";
import { Megaphone } from "lucide-react";

// Zod schema for campaign form
const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  emails: z.number().min(0, "Must be a positive number").default(0),
  socialMediaActions: z.number().min(0, "Must be a positive number").default(0),
  letters: z.number().min(0, "Must be a positive number").default(0),
  otherActions: z.number().min(0, "Must be a positive number").default(0),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

export default function CampaignsPage() {
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  // Form setup
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      emails: 0,
      socialMediaActions: 0,
      letters: 0,
      otherActions: 0,
    },
  });

  // Create campaign mutation
  const createCampaign = useMutation({
    mutationFn: async (data: CampaignFormValues) => {
      // Calculate the total actions
      const totalActions = data.emails + data.socialMediaActions + data.letters + data.otherActions;
      
      // Calculate impact using the new formula
      const animalsSaved = calculateCampaignImpact(
        data.emails,
        data.socialMediaActions,
        data.letters,
        data.otherActions
      );
      
      const res = await apiRequest("POST", "/api/campaigns", {
        ...data,
        totalActions,
        animalsSaved,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign saved",
        description: "Your campaign participation has been recorded successfully.",
      });
      form.reset({
        name: "",
        emails: 0,
        socialMediaActions: 0,
        letters: 0,
        otherActions: 0,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save campaign: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete campaign mutation
  const deleteCampaign = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/campaigns/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Campaign deleted",
        description: "The campaign has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setSelectedCampaign(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete campaign: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: CampaignFormValues) => {
    createCampaign.mutate(data);
  };

  // Calculate total animals saved
  const totalAnimalsSaved = campaigns.reduce((sum, campaign) => sum + campaign.animalsSaved, 0);
  
  // Calculate total people recruited
  const totalPeopleRecruited = campaigns.reduce((sum, campaign) => sum + (campaign.peopleRecruited || 0), 0);
  
  // Prepare data for chart
  const campaignsByType = campaigns.reduce((acc, campaign) => {
    acc[campaign.campaignType] = (acc[campaign.campaignType] || 0) + campaign.animalsSaved;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(campaignsByType).map(([name, value]) => ({
    name,
    value,
  }));

  // Colors for the chart
  const COLORS = ["#F59E0B", "#FBBF24", "#FCD34D", "#F97316", "#4F46E5"];

  // Format campaign type for display
  const formatCampaignType = (type: string) => {
    switch (type) {
      case "petition": return "Petition";
      case "boycott": return "Boycott";
      case "protest": return "Virtual Protest";
      case "callToAction": return "Call to Action";
      case "fundraiser": return "Fundraiser";
      case "awareness": return "Awareness Campaign";
      default: return type;
    }
  };

  // Count campaigns by participation
  const participationStats = {
    signed: campaigns.filter(c => c.signed).length,
    shared: campaigns.filter(c => c.shared).length,
    contacted: campaigns.filter(c => c.contacted).length,
    recruited: campaigns.filter(c => c.recruited).length,
    donated: campaigns.filter(c => c.donated).length,
  };

  // Calculate success rate (campaigns with animals saved > median)
  const calculateSuccessRate = () => {
    if (campaigns.length === 0) return 0;
    
    const animalsSaved = campaigns.map(c => c.animalsSaved);
    const median = animalsSaved.sort((a, b) => a - b)[Math.floor(animalsSaved.length / 2)];
    const successfulCampaigns = campaigns.filter(c => c.animalsSaved > median).length;
    
    return Math.round((successfulCampaigns / campaigns.length) * 100);
  };

  // Data table columns
  const columns = [
    {
      header: "Campaign",
      accessorKey: "name",
    },
    {
      header: "Type",
      accessorKey: "campaignType",
      cell: (campaign: Campaign) => formatCampaignType(campaign.campaignType),
    },
    {
      header: "Organization",
      accessorKey: "organization",
      cell: (campaign: Campaign) => campaign.organization || "N/A",
    },
    {
      header: "Start Date",
      accessorKey: "startDate",
      cell: (campaign: Campaign) => formatDate(campaign.startDate),
    },
    {
      header: "Participation",
      accessorKey: "signed",
      cell: (campaign: Campaign) => {
        const activities = [
          campaign.signed && "Signed",
          campaign.shared && "Shared",
          campaign.contacted && "Contacted",
          campaign.recruited && "Recruited",
          campaign.donated && "Donated"
        ].filter(Boolean);
        
        return activities.length > 0
          ? activities.join(", ")
          : "Not specified";
      },
    },
    {
      header: "Impact",
      accessorKey: "animalsSaved",
      cell: (campaign: Campaign) => (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
          {campaign.animalsSaved} animals
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (campaign: Campaign) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedCampaign(campaign)}
        >
          View
        </Button>
      ),
    },
  ];

  // Get active campaigns (no end date or end date in the future)
  const activeCampaigns = campaigns.filter(campaign => 
    !campaign.endDate || new Date(campaign.endDate) > new Date()
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <Sidebar />
      <MobileNav />
      
      <main className="flex-grow pb-20 md:pb-6">
        <div className="p-4 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1">Online Campaigns</h2>
            <p className="text-gray-600">Track the impact of your online activism and campaigns</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Card */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Log Campaign Participation</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Campaign Name</Label>
                      <Input
                        id="name"
                        placeholder="E.g., #EndFactoryFarming"
                        {...form.register("name")}
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="campaignType">Campaign Type</Label>
                        <Select
                          onValueChange={(value) => form.setValue("campaignType", value)}
                          defaultValue={form.getValues("campaignType")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="petition">Petition</SelectItem>
                            <SelectItem value="boycott">Boycott</SelectItem>
                            <SelectItem value="protest">Virtual Protest</SelectItem>
                            <SelectItem value="callToAction">Call to Action</SelectItem>
                            <SelectItem value="fundraiser">Fundraiser</SelectItem>
                            <SelectItem value="awareness">Awareness Campaign</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.campaignType && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.campaignType.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="organization">Organization (Optional)</Label>
                        <Input
                          id="organization"
                          placeholder="Organization running the campaign"
                          {...form.register("organization")}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          {...form.register("startDate")}
                        />
                        {form.formState.errors.startDate && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.startDate.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date (Optional)</Label>
                        <Input
                          id="endDate"
                          type="date"
                          {...form.register("endDate")}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Your Participation</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="signed"
                            checked={form.watch("signed")}
                            onCheckedChange={(checked) => 
                              form.setValue("signed", checked as boolean)
                            }
                          />
                          <Label htmlFor="signed" className="font-normal">Signed/Supported</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="shared"
                            checked={form.watch("shared")}
                            onCheckedChange={(checked) => 
                              form.setValue("shared", checked as boolean)
                            }
                          />
                          <Label htmlFor="shared" className="font-normal">Shared on social media</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="contacted"
                            checked={form.watch("contacted")}
                            onCheckedChange={(checked) => 
                              form.setValue("contacted", checked as boolean)
                            }
                          />
                          <Label htmlFor="contacted" className="font-normal">Contacted officials/companies</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="recruited"
                            checked={form.watch("recruited")}
                            onCheckedChange={(checked) => 
                              form.setValue("recruited", checked as boolean)
                            }
                          />
                          <Label htmlFor="recruited" className="font-normal">Recruited others</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="donated"
                            checked={form.watch("donated")}
                            onCheckedChange={(checked) => 
                              form.setValue("donated", checked as boolean)
                            }
                          />
                          <Label htmlFor="donated" className="font-normal">Donated to campaign</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="peopleRecruited">People Recruited (if any)</Label>
                      <Input
                        id="peopleRecruited"
                        type="number"
                        placeholder="Number of people"
                        {...form.register("peopleRecruited", { valueAsNumber: true })}
                      />
                      {form.formState.errors.peopleRecruited && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.peopleRecruited.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Additional details about the campaign and your participation"
                        {...form.register("notes")}
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-700"
                      disabled={createCampaign.isPending}
                    >
                      {createCampaign.isPending ? "Saving..." : "Save Campaign"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Your Campaign Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-6">
                  <div className="relative w-48 h-48">
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-4xl font-bold text-amber-600">{totalAnimalsSaved}</span>
                      <span className="text-sm text-gray-500">Animals Impacted</span>
                    </div>
                    
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          dataKey="value"
                          label={false}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} animals`, 'Impact']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Campaigns Joined</span>
                      <span className="font-bold">{campaigns.length}</span>
                    </div>
                    <Progress value={Math.min(campaigns.length * 5, 100)} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">People Recruited</span>
                      <span className="font-bold">{totalPeopleRecruited}</span>
                    </div>
                    <Progress value={Math.min(totalPeopleRecruited * 2, 100)} className="h-2" indicatorClassName="bg-green-600" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Success Rate</span>
                      <span className="font-bold">{calculateSuccessRate()}%</span>
                    </div>
                    <Progress value={calculateSuccessRate()} className="h-2" indicatorClassName="bg-blue-600" />
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-amber-50 rounded-md">
                  <h4 className="font-medium text-sm mb-2">Did you know?</h4>
                  <p className="text-sm text-gray-700">
                    Online petitions with over 100,000 signatures are 50% more likely to achieve their stated goals.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Active Campaigns */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                {activeCampaigns.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">
                    No active campaigns found. Start logging your campaign participation!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeCampaigns.slice(0, 4).map((campaign) => (
                      <div key={campaign.id} className="border border-gray-200 rounded-md overflow-hidden">
                        <div className="h-40 bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white">
                          <Megaphone className="h-16 w-16 opacity-50" />
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-lg">{campaign.name}</h4>
                            <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
                          </div>
                          <p className="text-sm text-gray-600 my-2">
                            {formatCampaignType(campaign.campaignType)}
                            {campaign.organization ? ` by ${campaign.organization}` : ''}
                          </p>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-500">Your impact: {campaign.animalsSaved} animals</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${Math.min(campaign.animalsSaved, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90"
                              onClick={() => setSelectedCampaign(campaign)}
                            >
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                            >
                              Share
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {activeCampaigns.length > 4 && (
                  <div className="mt-4 text-center">
                    <Button variant="link" className="text-primary">
                      Browse More Campaigns
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Campaign History Table */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign History</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={campaigns}
                  columns={columns}
                  searchable
                  searchField="name"
                  searchPlaceholder="Search campaigns..."
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Campaign Details Modal */}
          {selectedCampaign && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="font-semibold">Campaign Name</Label>
                    <p>{selectedCampaign.name}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Type</Label>
                    <p>{formatCampaignType(selectedCampaign.campaignType)}</p>
                  </div>
                  {selectedCampaign.organization && (
                    <div>
                      <Label className="font-semibold">Organization</Label>
                      <p>{selectedCampaign.organization}</p>
                    </div>
                  )}
                  <div>
                    <Label className="font-semibold">Start Date</Label>
                    <p>{formatDate(selectedCampaign.startDate)}</p>
                  </div>
                  {selectedCampaign.endDate && (
                    <div>
                      <Label className="font-semibold">End Date</Label>
                      <p>{formatDate(selectedCampaign.endDate)}</p>
                    </div>
                  )}
                  <div>
                    <Label className="font-semibold">Your Participation</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="flex items-center">
                        <Checkbox id="view-signed" checked={selectedCampaign.signed} disabled />
                        <Label htmlFor="view-signed" className="ml-2 font-normal">Signed</Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox id="view-shared" checked={selectedCampaign.shared} disabled />
                        <Label htmlFor="view-shared" className="ml-2 font-normal">Shared</Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox id="view-contacted" checked={selectedCampaign.contacted} disabled />
                        <Label htmlFor="view-contacted" className="ml-2 font-normal">Contacted</Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox id="view-recruited" checked={selectedCampaign.recruited} disabled />
                        <Label htmlFor="view-recruited" className="ml-2 font-normal">Recruited</Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox id="view-donated" checked={selectedCampaign.donated} disabled />
                        <Label htmlFor="view-donated" className="ml-2 font-normal">Donated</Label>
                      </div>
                    </div>
                  </div>
                  {selectedCampaign.peopleRecruited > 0 && (
                    <div>
                      <Label className="font-semibold">People Recruited</Label>
                      <p>{selectedCampaign.peopleRecruited}</p>
                    </div>
                  )}
                  <div>
                    <Label className="font-semibold">Impact</Label>
                    <p>{selectedCampaign.animalsSaved} animals saved</p>
                  </div>
                  {selectedCampaign.notes && (
                    <div>
                      <Label className="font-semibold">Notes</Label>
                      <p>{selectedCampaign.notes}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="destructive"
                      onClick={() => deleteCampaign.mutate(selectedCampaign.id)}
                      disabled={deleteCampaign.isPending}
                    >
                      {deleteCampaign.isPending ? "Deleting..." : "Delete"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCampaign(null)}
                    >
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
