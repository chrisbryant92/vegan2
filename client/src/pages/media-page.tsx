import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MediaShared, mediaSharedSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatNumber } from "@/lib/utils";
import { calculateMediaImpact } from "@/lib/calculations";
import { FileEdit, Info, Trash2 } from "lucide-react";

type MediaSharedFormValues = typeof mediaSharedSchema._type;

export default function MediaPage() {
  const { toast } = useToast();
  const [selectedMedia, setSelectedMedia] = useState<MediaShared | null>(null);
  const [editingMedia, setEditingMedia] = useState<MediaShared | null>(null);

  // Fetch media shared
  const { data: mediaShared = [], isLoading } = useQuery<MediaShared[]>({
    queryKey: ["/api/media-shared"],
  });

  // Form setup
  const form = useForm<MediaSharedFormValues>({
    resolver: zodResolver(mediaSharedSchema),
    defaultValues: {
      title: "",
      oneOffPieces: 0,
      postsPerMonth: 0,
      estimatedReach: 0,
      estimatedPersuasiveness: 50,
      dateStarted: new Date().toISOString().split("T")[0],
      dateEnded: "",
      description: "",
    },
  });

  // Create media shared mutation
  const createMediaShared = useMutation({
    mutationFn: async (data: MediaSharedFormValues) => {
      // Parse dates
      const dateStarted = new Date(data.dateStarted);
      const dateEnded = data.dateEnded ? new Date(data.dateEnded) : null;
      
      // Calculate impact based on the new formula
      const animalsSaved = calculateMediaImpact(
        dateStarted,
        dateEnded,
        data.oneOffPieces,
        data.postsPerMonth,
        data.estimatedReach,
        data.estimatedPersuasiveness
      );
      
      const res = await apiRequest("POST", "/api/media-shared", {
        ...data,
        animalsSaved,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Media shared",
        description: "Your media campaign has been recorded successfully.",
      });
      form.reset({
        title: "",
        oneOffPieces: 0,
        postsPerMonth: 0,
        estimatedReach: 0,
        estimatedPersuasiveness: 50,
        dateStarted: new Date().toISOString().split("T")[0],
        dateEnded: "",
        description: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/media-shared"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save media: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update media shared mutation
  const updateMediaShared = useMutation({
    mutationFn: async (data: MediaSharedFormValues & { id: number }) => {
      const { id, ...formData } = data;
      
      // Parse dates
      const dateStarted = new Date(formData.dateStarted);
      const dateEnded = formData.dateEnded ? new Date(formData.dateEnded) : null;
      
      // Calculate impact based on the formula
      const animalsSaved = calculateMediaImpact(
        dateStarted,
        dateEnded,
        formData.oneOffPieces,
        formData.postsPerMonth,
        formData.estimatedReach,
        formData.estimatedPersuasiveness
      );
      
      const res = await apiRequest("PATCH", `/api/media-shared/${id}`, {
        ...formData,
        animalsSaved,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Media updated",
        description: "Your media campaign has been updated successfully.",
      });
      form.reset({
        title: "",
        oneOffPieces: 0,
        postsPerMonth: 0,
        estimatedReach: 0,
        estimatedPersuasiveness: 50,
        dateStarted: new Date().toISOString().split("T")[0],
        dateEnded: "",
        description: "",
      });
      setEditingMedia(null);
      queryClient.invalidateQueries({ queryKey: ["/api/media-shared"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update media: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete media shared mutation
  const deleteMediaShared = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/media-shared/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Media deleted",
        description: "The media campaign has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/media-shared"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setSelectedMedia(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete media: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Effect to update form when editing a media
  useEffect(() => {
    if (editingMedia) {
      form.reset({
        title: editingMedia.title,
        oneOffPieces: editingMedia.oneOffPieces || 0,
        postsPerMonth: editingMedia.postsPerMonth || 0,
        estimatedReach: editingMedia.estimatedReach || 0,
        estimatedPersuasiveness: editingMedia.estimatedPersuasiveness || 50,
        dateStarted: new Date(editingMedia.dateStarted).toISOString().split("T")[0],
        dateEnded: editingMedia.dateEnded ? new Date(editingMedia.dateEnded).toISOString().split("T")[0] : "",
        description: editingMedia.description || "",
      });
    }
  }, [editingMedia, form]);

  // Form submission handler
  const onSubmit = (data: MediaSharedFormValues) => {
    if (editingMedia) {
      // Update existing media
      updateMediaShared.mutate({
        ...data,
        id: editingMedia.id
      });
    } else {
      // Create new media
      createMediaShared.mutate(data);
    }
  };
  
  // Cancel editing and reset form
  const cancelEdit = () => {
    setEditingMedia(null);
    form.reset({
      title: "",
      oneOffPieces: 0,
      postsPerMonth: 0,
      estimatedReach: 0,
      estimatedPersuasiveness: 50,
      dateStarted: new Date().toISOString().split("T")[0],
      dateEnded: "",
      description: "",
    });
  };

  // Calculate total animals saved
  const totalAnimalsSaved = mediaShared.reduce((sum, media) => sum + media.animalsSaved, 0);
  
  // Prepare data for chart based on animal impact
  const impactGroups = mediaShared.reduce((acc, media) => {
    // Group by impact level
    let impactLevel = "Low";
    if (media.animalsSaved > 500) impactLevel = "High";
    else if (media.animalsSaved > 100) impactLevel = "Medium";
    
    acc[impactLevel] = (acc[impactLevel] || 0) + media.animalsSaved;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(impactGroups).map(([name, value]) => ({
    name,
    value,
  }));

  // Colors for the chart
  const COLORS = ["#3B82F6", "#93C5FD", "#60A5FA", "#1D4ED8", "#4F46E5"];

  // Format date range for display
  const formatDateRange = (startDate: Date, endDate: Date | null) => {
    const start = formatDate(startDate);
    if (!endDate) return `${start} - Present`;
    return `${start} - ${formatDate(endDate)}`;
  };

  // Data table columns with required accessorKey
  type DataTableColumn = {
    header: string;
    accessorKey: keyof MediaShared;
    cell?: (item: MediaShared) => React.ReactNode;
  };
  
  const columns: DataTableColumn[] = [
    {
      header: "Title",
      accessorKey: "title",
    },
    {
      header: "Date Range",
      accessorKey: "dateStarted",
      cell: (media: MediaShared) => formatDateRange(media.dateStarted, media.dateEnded),
    },
    {
      header: "Posts",
      accessorKey: "oneOffPieces",
      cell: (media: MediaShared) => `${media.oneOffPieces} one-off + ${media.postsPerMonth}/month`,
    },
    {
      header: "Reach",
      accessorKey: "estimatedReach",
    },
    {
      header: "Persuasiveness",
      accessorKey: "estimatedPersuasiveness",
      cell: (media: MediaShared) => `${media.estimatedPersuasiveness}%`,
    },
    {
      header: "Impact",
      accessorKey: "animalsSaved",
      cell: (media: MediaShared) => (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          {formatNumber(media.animalsSaved)} animals
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (media: MediaShared) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedMedia(media)}
          >
            <Info className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600"
            onClick={() => setEditingMedia(media)}
          >
            <FileEdit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteMediaShared.mutate(media.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
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
            <h2 className="text-2xl font-bold mb-1">Media Campaigns</h2>
            <p className="text-gray-600">Track the impact of your animal advocacy content sharing</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Card */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{editingMedia ? 'Edit Media Campaign' : 'Log Media Campaign'}</CardTitle>
                  <CardDescription>
                    {editingMedia ? 'Update your media campaign details' : 'Record your media campaigns and content sharing to track their animal impact'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Campaign Title</Label>
                      <Input
                        id="title"
                        placeholder="Title of your media campaign"
                        {...form.register("title")}
                      />
                      {form.formState.errors.title && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.title.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateStarted">Date Started</Label>
                        <Input
                          id="dateStarted"
                          type="date"
                          {...form.register("dateStarted")}
                        />
                        {form.formState.errors.dateStarted && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.dateStarted.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="dateEnded">Date Ended (Optional)</Label>
                        <Input
                          id="dateEnded"
                          type="date"
                          {...form.register("dateEnded")}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="oneOffPieces">One-Off Content Pieces</Label>
                        <Input
                          id="oneOffPieces"
                          type="number"
                          placeholder="Number of one-time content pieces"
                          {...form.register("oneOffPieces", { valueAsNumber: true })}
                        />
                        {form.formState.errors.oneOffPieces && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.oneOffPieces.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="postsPerMonth">Posts Per Month</Label>
                        <Input
                          id="postsPerMonth"
                          type="number"
                          placeholder="Regular monthly content"
                          {...form.register("postsPerMonth", { valueAsNumber: true })}
                        />
                        {form.formState.errors.postsPerMonth && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.postsPerMonth.message}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="estimatedReach">Estimated Reach (People)</Label>
                      <Input
                        id="estimatedReach"
                        type="number"
                        placeholder="How many people saw this content"
                        {...form.register("estimatedReach", { valueAsNumber: true })}
                      />
                      {form.formState.errors.estimatedReach && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.estimatedReach.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label htmlFor="estimatedPersuasiveness">Estimated Persuasiveness (0-100%)</Label>
                        <span className="text-sm text-muted-foreground">
                          {form.watch("estimatedPersuasiveness")}%
                        </span>
                      </div>
                      
                      <Slider
                        id="estimatedPersuasiveness"
                        min={0}
                        max={100}
                        step={1}
                        defaultValue={[50]}
                        onValueChange={(values) => {
                          form.setValue("estimatedPersuasiveness", values[0]);
                        }}
                      />
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Not Persuasive</span>
                        <span>Moderately Persuasive</span>
                        <span>Very Persuasive</span>
                      </div>
                      
                      {form.formState.errors.estimatedPersuasiveness && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.estimatedPersuasiveness.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="p-4 bg-purple-50 border border-purple-100 rounded-md mt-2 mb-4">
                      <h4 className="text-sm font-semibold mb-2">Impact Calculation Explained:</h4>
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Formula: </span>(((Date Ended - Date Started) × Posts Per Month / 30) + One-Off Pieces) × (Estimated Persuasiveness / 100) × (Estimated Reach × 120 / 500)
                      </p>
                      <ul className="text-xs text-gray-600 space-y-1 pl-4 list-disc">
                        <li><span className="font-medium">Ongoing Content:</span> We calculate the total number of posts over the time period</li>
                        <li><span className="font-medium">One-Off Content:</span> Added directly to the total content count</li>
                        <li><span className="font-medium">Persuasiveness Factor:</span> How compelling your content is (as percentage)</li>
                        <li><span className="font-medium">Reach Calculation:</span> We estimate that for every 500 people who see content, about 120 may change behavior</li>
                        <li><span className="font-medium">Example:</span> 3 years of monthly posting (5 posts/month) with 50% persuasiveness and 350 people reached = 767 animals saved</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of the media campaign"
                        {...form.register("description")}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      {editingMedia && (
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
                        className={`${editingMedia ? 'w-2/3' : 'w-full'} bg-blue-600 hover:bg-blue-700`}
                        disabled={createMediaShared.isPending || updateMediaShared.isPending}
                      >
                        {createMediaShared.isPending || updateMediaShared.isPending 
                          ? "Saving..." 
                          : editingMedia ? "Update Campaign" : "Save Campaign"
                        }
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            {/* Stats Card */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Your Media Impact</CardTitle>
                <CardDescription>
                  You've saved approximately {formatNumber(totalAnimalsSaved)} animals through media campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-6">
                  <div className="relative w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${formatNumber(value as number)} animals`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">How Media Impact is Calculated</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Your media impact is calculated using this formula:
                        </p>
                        <code className="text-xs bg-blue-100 p-1 rounded mt-1 block overflow-x-auto">
                          (((Date Ended-Date Started)*Posts Per Month/30)+One-Off Pieces)*Persuasiveness*Reach*120/500
                        </code>
                        <p className="text-xs text-blue-600 mt-1">
                          The average meat-eater consumes approximately 120 animals per year. The formula is divided by 500 to account for realistic conversion rates (roughly 10%) and actual reach limitations (many followers don't see posts).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Records Table */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Media Campaigns</CardTitle>
                <CardDescription>
                  A complete list of all your recorded media campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading media records...</div>
                ) : mediaShared.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No media campaigns recorded yet</div>
                ) : (
                  <DataTable columns={columns} data={mediaShared} />
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Media Detail Modal */}
          {selectedMedia && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-2xl">
                <CardHeader>
                  <CardTitle>{selectedMedia.title}</CardTitle>
                  <CardDescription>
                    Created on {formatDate(selectedMedia.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium">Date Range</h4>
                      <p>{formatDateRange(selectedMedia.dateStarted, selectedMedia.dateEnded)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Animals Saved</h4>
                      <p className="font-bold text-blue-600">{formatNumber(selectedMedia.animalsSaved)} animals</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium">One-Off Pieces</h4>
                      <p>{formatNumber(selectedMedia.oneOffPieces || 0)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Posts Per Month</h4>
                      <p>{formatNumber(selectedMedia.postsPerMonth || 0)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium">Estimated Reach</h4>
                      <p>{formatNumber(selectedMedia.estimatedReach || 0)} people</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Persuasiveness</h4>
                      <p>{formatNumber(selectedMedia.estimatedPersuasiveness || 0)}%</p>
                    </div>
                  </div>
                  
                  {selectedMedia.description && (
                    <div>
                      <h4 className="text-sm font-medium">Description</h4>
                      <p className="text-sm mt-1">{selectedMedia.description}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedMedia(null)}
                  >
                    Close
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => deleteMediaShared.mutate(selectedMedia.id)}
                  >
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}