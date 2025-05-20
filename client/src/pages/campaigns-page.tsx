import { useState, useEffect } from "react";
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
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

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

  // Update campaign mutation
  const updateCampaign = useMutation({
    mutationFn: async (data: CampaignFormValues & { id: number }) => {
      const { id, ...formData } = data;
      
      // Calculate the total actions
      const totalActions = formData.emails + formData.socialMediaActions + formData.letters + formData.otherActions;
      
      // Calculate impact using the formula
      const animalsSaved = calculateCampaignImpact(
        formData.emails,
        formData.socialMediaActions,
        formData.letters,
        formData.otherActions
      );
      
      const res = await apiRequest("PATCH", `/api/campaigns/${id}`, {
        ...formData,
        totalActions,
        animalsSaved,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign updated",
        description: "Your campaign has been updated successfully.",
      });
      form.reset({
        name: "",
        emails: 0,
        socialMediaActions: 0,
        letters: 0,
        otherActions: 0,
      });
      setEditingCampaign(null);
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update campaign: ${error.message}`,
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

  // Effect to update form when editing a campaign
  useEffect(() => {
    if (editingCampaign) {
      form.reset({
        name: editingCampaign.name,
        emails: editingCampaign.emails || 0,
        socialMediaActions: editingCampaign.social_media_actions || 0,
        letters: editingCampaign.letters || 0,
        otherActions: editingCampaign.other_actions || 0,
      });
    }
  }, [editingCampaign, form]);

  // Form submission handler
  const onSubmit = (data: CampaignFormValues) => {
    if (editingCampaign) {
      // Update existing campaign
      updateCampaign.mutate({
        ...data,
        id: editingCampaign.id
      });
    } else {
      // Create new campaign
      createCampaign.mutate(data);
    }
  };
  
  // Cancel editing and reset form
  const cancelEdit = () => {
    setEditingCampaign(null);
    form.reset({
      name: "",
      emails: 0,
      socialMediaActions: 0,
      letters: 0,
      otherActions: 0,
    });
  };

  // Calculate total animals saved
  const totalAnimalsSaved = campaigns.reduce((sum, campaign) => sum + (campaign.animals_saved || 0), 0);
  
  // Prepare data for chart - group by type of campaign (email, social media, etc.)
  const actionTypes = {
    emails: "Email Campaigns",
    socialMedia: "Social Media",
    letters: "Letter Writing",
    other: "Other Actions"
  };
  
  const chartData = [
    { name: actionTypes.emails, value: calculateCampaignImpact(1, 0, 0, 0) * campaigns.reduce((sum, c) => sum + (c.emails || 0), 0) },
    { name: actionTypes.socialMedia, value: calculateCampaignImpact(0, 1, 0, 0) * campaigns.reduce((sum, c) => sum + (c.social_media_actions || 0), 0) },
    { name: actionTypes.letters, value: calculateCampaignImpact(0, 0, 1, 0) * campaigns.reduce((sum, c) => sum + (c.letters || 0), 0) },
    { name: actionTypes.other, value: calculateCampaignImpact(0, 0, 0, 1) * campaigns.reduce((sum, c) => sum + (c.other_actions || 0), 0) }
  ].filter(item => item.value > 0);

  // Colors for the chart
  const COLORS = ["#F59E0B", "#FBBF24", "#FCD34D", "#F97316", "#4F46E5"];

  // Calculate success rate (campaigns with animals saved > median)
  const calculateSuccessRate = () => {
    if (campaigns.length === 0) return 0;
    
    const animalsSaved = campaigns.map(c => c.animals_saved || 0);
    const median = animalsSaved.sort((a, b) => a - b)[Math.floor(animalsSaved.length / 2)];
    const successfulCampaigns = campaigns.filter(c => (c.animals_saved || 0) > median).length;
    
    return Math.round((successfulCampaigns / campaigns.length) * 100);
  };

  // Data table columns
  const columns = [
    {
      header: "Campaign",
      accessorKey: "name" as keyof Campaign,
    },
    {
      header: "Actions Taken",
      accessorKey: "total_actions" as keyof Campaign,
      cell: (campaign: Campaign) => (
        <div className="flex flex-col">
          <span className="font-medium">{campaign.total_actions || 0} total</span>
          <span className="text-xs text-gray-500">
            {campaign.emails || 0} emails, {campaign.social_media_actions || 0} social
          </span>
        </div>
      ),
    },
    {
      header: "Letters",
      accessorKey: "letters" as keyof Campaign,
      cell: (campaign: Campaign) => campaign.letters || 0,
    },
    {
      header: "Other",
      accessorKey: "other_actions" as keyof Campaign,
      cell: (campaign: Campaign) => campaign.other_actions || 0,
    },
    {
      header: "Impact",
      accessorKey: "animals_saved" as keyof Campaign,
      cell: (campaign: Campaign) => (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
          {campaign.animals_saved} animals
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof Campaign,
      cell: (campaign: Campaign) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCampaign(campaign)}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-amber-600"
            onClick={() => setEditingCampaign(campaign)}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

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
                  <CardTitle>{editingCampaign ? 'Edit Campaign' : 'Log Campaign Participation'}</CardTitle>
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
                    
                    <div className="space-y-4">
                      <Label className="text-lg font-medium">Campaign Actions</Label>
                      <p className="text-sm text-gray-500">Enter the number of actions you've taken in this campaign</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="emails">Emails Sent</Label>
                          <Input
                            id="emails"
                            type="number"
                            min="0"
                            placeholder="0"
                            {...form.register("emails", { 
                              valueAsNumber: true,
                              setValueAs: (value) => value === "" ? 0 : parseInt(value, 10) 
                            })}
                          />
                          {form.formState.errors.emails && (
                            <p className="text-sm text-red-500">
                              {form.formState.errors.emails.message}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">Each email saves approximately 5 animals</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="socialMediaActions">Social Media Actions</Label>
                          <Input
                            id="socialMediaActions"
                            type="number"
                            min="0"
                            placeholder="0"
                            {...form.register("socialMediaActions", { 
                              valueAsNumber: true,
                              setValueAs: (value) => value === "" ? 0 : parseInt(value, 10) 
                            })}
                          />
                          {form.formState.errors.socialMediaActions && (
                            <p className="text-sm text-red-500">
                              {form.formState.errors.socialMediaActions.message}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">Each social media action saves approximately 2 animals</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="letters">Phone Calls/Letters</Label>
                          <Input
                            id="letters"
                            type="number"
                            min="0"
                            placeholder="0"
                            {...form.register("letters", { 
                              valueAsNumber: true,
                              setValueAs: (value) => value === "" ? 0 : parseInt(value, 10) 
                            })}
                          />
                          {form.formState.errors.letters && (
                            <p className="text-sm text-red-500">
                              {form.formState.errors.letters.message}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">Each phone call or letter saves approximately 10 animals</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="otherActions">Other Actions</Label>
                          <Input
                            id="otherActions"
                            type="number"
                            min="0"
                            placeholder="0"
                            {...form.register("otherActions", { 
                              valueAsNumber: true,
                              setValueAs: (value) => value === "" ? 0 : parseInt(value, 10) 
                            })}
                          />
                          {form.formState.errors.otherActions && (
                            <p className="text-sm text-red-500">
                              {form.formState.errors.otherActions.message}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">Each other action saves approximately 5 animals</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Total Actions</span>
                          <span className="text-sm font-medium">
                            {(form.watch("emails") || 0) + 
                             (form.watch("socialMediaActions") || 0) + 
                             (form.watch("letters") || 0) + 
                             (form.watch("otherActions") || 0)} actions
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Animals Saved</span>
                          <span className="text-sm font-bold">
                            {calculateCampaignImpact(
                              form.watch("emails") || 0,
                              form.watch("socialMediaActions") || 0,
                              form.watch("letters") || 0,
                              form.watch("otherActions") || 0
                            )} animals
                          </span>
                        </div>
                        
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-md my-3">
                          <h4 className="text-sm font-semibold mb-2">Impact Calculation Explained:</h4>
                          <p className="text-sm text-gray-700 mb-2">
                            <span className="font-medium">Formula: </span>(Emails × 5) + (Social Media Actions × 2) + (Phone Calls/Letters × 10) + (Other Actions × 5)
                          </p>
                          <ul className="text-xs text-gray-600 space-y-1 pl-4 list-disc">
                            <li><span className="font-medium">Emails:</span> Each email is worth 5 animals (quick but moderate impact)</li>
                            <li><span className="font-medium">Social Media:</span> Each action saves 2 animals (lower effort but broad reach)</li>
                            <li><span className="font-medium">Phone/Letters:</span> Each saves 10 animals (high effort, personalized contact)</li>
                            <li><span className="font-medium">Other Actions:</span> Each worth 5 animals (average impact across action types)</li>
                            <li><span className="font-medium">Time Value:</span> Roughly equivalent to 1 animal saved per minute of advocacy time</li>
                          </ul>
                        </div>
                        <Progress
                          value={Math.min(100, calculateCampaignImpact(
                            form.watch("emails") || 0,
                            form.watch("socialMediaActions") || 0,
                            form.watch("letters") || 0,
                            form.watch("otherActions") || 0
                          ) / 10)}
                          className="h-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">Formula: (Emails×5)+(Social Media×2)+(Phone Calls/Letters×10)+(Other Actions×5)</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {editingCampaign && (
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={cancelEdit}
                          className="w-1/3"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="submit"
                        className={`${editingCampaign ? 'w-2/3' : 'w-full'} bg-amber-600 hover:bg-amber-700`}
                        disabled={createCampaign.isPending || updateCampaign.isPending}
                      >
                        {createCampaign.isPending || updateCampaign.isPending 
                          ? "Saving..." 
                          : editingCampaign ? "Update Campaign" : "Save Campaign"
                        }
                      </Button>
                    </div>
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
                      <span className="font-medium">Total Actions</span>
                      <span className="font-bold">
                        {campaigns.reduce((sum, c) => sum + (c.total_actions || 0), 0)}
                      </span>
                    </div>
                    <Progress value={Math.min(campaigns.reduce((sum, c) => sum + (c.total_actions || 0), 0) / 2, 100)} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Success Rate</span>
                      <span className="font-bold">{calculateSuccessRate()}%</span>
                    </div>
                    <Progress value={calculateSuccessRate()} className="h-2" />
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-amber-50 rounded-md">
                  <h4 className="font-medium text-sm mb-2">Did you know?</h4>
                  <p className="text-sm text-gray-700">
                    Letter writing is the most impactful online action, with each letter saving approximately 50 animals on average.
                  </p>
                </div>
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
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600"></div>
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Megaphone className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium mb-1">No campaigns yet</p>
                    <p className="text-sm">Start logging your online activism to see your impact!</p>
                  </div>
                ) : (
                  <DataTable
                    data={campaigns}
                    columns={columns}
                    searchable
                    searchField="name"
                    searchPlaceholder="Search campaigns..."
                  />
                )}
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
                    <Label className="font-semibold">Action Summary</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Email Actions:</span>
                        <span className="font-medium">{selectedCampaign.emails || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Social Media Actions:</span>
                        <span className="font-medium">{selectedCampaign.social_media_actions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Letters Written:</span>
                        <span className="font-medium">{selectedCampaign.letters || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Actions:</span>
                        <span className="font-medium">{selectedCampaign.other_actions || 0}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="font-medium">Total Actions:</span>
                        <span className="font-medium">{selectedCampaign.total_actions || 0}</span>
                      </div>
                    </div>
                  </div>
                
                  <div>
                    <Label className="font-semibold">Impact</Label>
                    <p className="text-xl font-bold text-amber-600">{selectedCampaign.animals_saved} animals saved</p>
                    <Progress 
                      value={Math.min((selectedCampaign.animals_saved || 0) / 5, 100)} 
                      className="h-2 mt-2"
                    />
                  </div>
                  
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