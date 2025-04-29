import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { formatDate } from "@/lib/utils";
import { calculateMediaImpact } from "@/lib/calculations";

type MediaSharedFormValues = typeof mediaSharedSchema._type;

export default function MediaPage() {
  const { toast } = useToast();
  const [selectedMedia, setSelectedMedia] = useState<MediaShared | null>(null);

  // Fetch media shared
  const { data: mediaShared = [], isLoading } = useQuery<MediaShared[]>({
    queryKey: ["/api/media-shared"],
  });

  // Form setup
  const form = useForm<MediaSharedFormValues>({
    resolver: zodResolver(mediaSharedSchema),
    defaultValues: {
      mediaType: "",
      title: "",
      platform: "",
      date: new Date().toISOString().split("T")[0],
      reach: 0,
      engagement: 0,
      description: "",
    },
  });

  // Create media shared mutation
  const createMediaShared = useMutation({
    mutationFn: async (data: MediaSharedFormValues) => {
      // Calculate impact based on media type, reach, and engagement
      const animalsSaved = calculateMediaImpact(
        data.mediaType, 
        data.reach || 0, 
        data.engagement || 0
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
        description: "Your media share has been recorded successfully.",
      });
      form.reset({
        mediaType: "",
        title: "",
        platform: "",
        date: new Date().toISOString().split("T")[0],
        reach: 0,
        engagement: 0,
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

  // Delete media shared mutation
  const deleteMediaShared = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/media-shared/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Media deleted",
        description: "The media share has been deleted successfully.",
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

  // Form submission handler
  const onSubmit = (data: MediaSharedFormValues) => {
    createMediaShared.mutate(data);
  };

  // Calculate total animals saved
  const totalAnimalsSaved = mediaShared.reduce((sum, media) => sum + media.animalsSaved, 0);
  
  // Prepare data for chart
  const mediaByType = mediaShared.reduce((acc, media) => {
    acc[media.mediaType] = (acc[media.mediaType] || 0) + media.animalsSaved;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(mediaByType).map(([name, value]) => ({
    name,
    value,
  }));

  // Colors for the chart
  const COLORS = ["#3B82F6", "#93C5FD", "#60A5FA", "#1D4ED8", "#4F46E5"];

  // Format media type for display
  const formatMediaType = (type: string) => {
    switch (type) {
      case "documentary": return "Documentary";
      case "video": return "Video";
      case "article": return "Article";
      case "podcast": return "Podcast";
      case "book": return "Book";
      case "social": return "Social Media Post";
      default: return type;
    }
  };

  // Get icon based on media type
  const getMediaIcon = (type: string) => {
    switch (type) {
      case "documentary":
        return <Tv className="h-5 w-5 text-blue-600" />;
      case "video":
        return <Video className="h-5 w-5 text-blue-600" />;
      case "article":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "podcast":
        return <FileSpreadsheet className="h-5 w-5 text-blue-600" />;
      case "book":
        return <FileSpreadsheet className="h-5 w-5 text-blue-600" />;
      case "social":
        return <Twitter className="h-5 w-5 text-blue-600" />;
      default:
        return <FileText className="h-5 w-5 text-blue-600" />;
    }
  };

  // Get icon based on platform
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "facebook":
        return <Facebook className="h-5 w-5 text-blue-600" />;
      case "instagram":
        return <Instagram className="h-5 w-5 text-pink-600" />;
      case "twitter":
        return <Twitter className="h-5 w-5 text-blue-400" />;
      case "youtube":
        return <Youtube className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  // Count by media type
  const mediaTypeCount = {
    documentary: mediaShared.filter(m => m.mediaType === "documentary").length,
    video: mediaShared.filter(m => m.mediaType === "video").length,
    article: mediaShared.filter(m => m.mediaType === "article").length,
    podcast: mediaShared.filter(m => m.mediaType === "podcast").length,
    book: mediaShared.filter(m => m.mediaType === "book").length,
    social: mediaShared.filter(m => m.mediaType === "social").length,
  };

  // Data table columns
  const columns = [
    {
      header: "Title",
      accessorKey: "title",
    },
    {
      header: "Type",
      accessorKey: "mediaType",
      cell: (media: MediaShared) => formatMediaType(media.mediaType),
    },
    {
      header: "Platform",
      accessorKey: "platform",
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: (media: MediaShared) => formatDate(media.date),
    },
    {
      header: "Reach",
      accessorKey: "reach",
      cell: (media: MediaShared) => media.reach || "N/A",
    },
    {
      header: "Impact",
      accessorKey: "animalsSaved",
      cell: (media: MediaShared) => (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          {media.animalsSaved} animals
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (media: MediaShared) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedMedia(media)}
        >
          View
        </Button>
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
            <h2 className="text-2xl font-bold mb-1">Media Shared</h2>
            <p className="text-gray-600">Track the impact of animal advocacy content you've shared</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Card */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Log Shared Media</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mediaType">Media Type</Label>
                      <Select
                        onValueChange={(value) => form.setValue("mediaType", value)}
                        defaultValue={form.getValues("mediaType")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="documentary">Documentary</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="podcast">Podcast</SelectItem>
                          <SelectItem value="book">Book</SelectItem>
                          <SelectItem value="social">Social Media Post</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.mediaType && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.mediaType.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title">Title/Name</Label>
                      <Input
                        id="title"
                        placeholder="Title of media shared"
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
                        <Label htmlFor="platform">Platform</Label>
                        <Select
                          onValueChange={(value) => form.setValue("platform", value)}
                          defaultValue={form.getValues("platform")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="twitter">Twitter</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="tiktok">TikTok</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.platform && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.platform.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="date">Date Shared</Label>
                        <Input
                          id="date"
                          type="date"
                          {...form.register("date")}
                        />
                        {form.formState.errors.date && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.date.message}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="reach">Estimated Reach</Label>
                        <Input
                          id="reach"
                          type="number"
                          placeholder="Number of people"
                          {...form.register("reach", { valueAsNumber: true })}
                        />
                        {form.formState.errors.reach && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.reach.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="engagement">Engagement</Label>
                        <Input
                          id="engagement"
                          type="number"
                          placeholder="Likes, comments, shares"
                          {...form.register("engagement", { valueAsNumber: true })}
                        />
                        {form.formState.errors.engagement && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.engagement.message}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of the media content"
                        {...form.register("description")}
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={createMediaShared.isPending}
                    >
                      {createMediaShared.isPending ? "Saving..." : "Save Media"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Your Media Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-6">
                  <div className="relative w-48 h-48">
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-4xl font-bold text-blue-600">{totalAnimalsSaved}</span>
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
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <Tv className="text-blue-500 mr-2 h-4 w-4" />
                      <span className="text-sm">Documentaries</span>
                    </div>
                    <span className="font-bold">{mediaTypeCount.documentary}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <Video className="text-blue-500 mr-2 h-4 w-4" />
                      <span className="text-sm">Videos</span>
                    </div>
                    <span className="font-bold">{mediaTypeCount.video}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <FileText className="text-blue-500 mr-2 h-4 w-4" />
                      <span className="text-sm">Articles</span>
                    </div>
                    <span className="font-bold">{mediaTypeCount.article}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <Twitter className="text-blue-500 mr-2 h-4 w-4" />
                      <span className="text-sm">Social Posts</span>
                    </div>
                    <span className="font-bold">{mediaTypeCount.social}</span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-md">
                  <h4 className="font-medium text-sm mb-2">Did you know?</h4>
                  <p className="text-sm text-gray-700">
                    Sharing animal welfare content can influence 1 in 10 viewers to make more compassionate choices.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Media Library */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Media Library</CardTitle>
              </CardHeader>
              <CardContent>
                {mediaShared.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">
                    No media shares recorded yet. Start logging your animal advocacy content!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mediaShared.slice(0, 6).map((media) => (
                      <div key={media.id} className="border border-gray-200 rounded-md overflow-hidden">
                        <div className="bg-blue-50 h-40 flex items-center justify-center">
                          {getMediaIcon(media.mediaType)}
                          <div className="text-4xl text-blue-200">{getMediaIcon(media.mediaType)}</div>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium truncate">{media.title}</h4>
                            <Badge variant="outline" className="ml-2 whitespace-nowrap">
                              {formatMediaType(media.mediaType)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 flex items-center">
                            {getPlatformIcon(media.platform)}
                            <span className="ml-1">Shared on {media.platform}</span>
                          </p>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{formatDate(media.date)}</span>
                            <span>Reach: {media.reach || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {mediaShared.length > 6 && (
                  <div className="mt-4 text-center">
                    <Button variant="link" className="text-primary">
                      Show More
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Media History Table */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Media History</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={mediaShared}
                  columns={columns}
                  searchable
                  searchField="title"
                  searchPlaceholder="Search by title..."
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Media Details Modal */}
          {selectedMedia && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Media Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="font-semibold">Title</Label>
                    <p>{selectedMedia.title}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Type</Label>
                    <p>{formatMediaType(selectedMedia.mediaType)}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Platform</Label>
                    <p>{selectedMedia.platform}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Date Shared</Label>
                    <p>{formatDate(selectedMedia.date)}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Reach</Label>
                    <p>{selectedMedia.reach || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Engagement</Label>
                    <p>{selectedMedia.engagement || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Impact</Label>
                    <p>{selectedMedia.animalsSaved} animals impacted</p>
                  </div>
                  {selectedMedia.description && (
                    <div>
                      <Label className="font-semibold">Description</Label>
                      <p>{selectedMedia.description}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="destructive"
                      onClick={() => deleteMediaShared.mutate(selectedMedia.id)}
                      disabled={deleteMediaShared.isPending}
                    >
                      {deleteMediaShared.isPending ? "Deleting..." : "Delete"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedMedia(null)}
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
