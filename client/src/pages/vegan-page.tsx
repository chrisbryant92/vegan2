import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { VeganConversion } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { calculateVeganImpact } from "@/lib/calculations";

// Zod schema for vegan conversion form
const veganConversionSchema = z.object({
  personName: z.string().optional(),
  relationship: z.string().min(1, "Relationship is required"),
  conversionType: z.string().min(1, "Conversion type is required"),
  date: z.string().min(1, "Date is required"),
  conversation: z.boolean().optional(),
  documentary: z.boolean().optional(),
  cookedMeal: z.boolean().optional(),
  restaurant: z.boolean().optional(),
  notes: z.string().optional(),
});

type VeganConversionFormValues = z.infer<typeof veganConversionSchema>;

export default function VeganPage() {
  const { toast } = useToast();
  const [selectedConversion, setSelectedConversion] = useState<VeganConversion | null>(null);

  // Fetch vegan conversions
  const { data: veganConversions = [], isLoading } = useQuery<VeganConversion[]>({
    queryKey: ["/api/vegan-conversions"],
  });

  // Form setup
  const form = useForm<VeganConversionFormValues>({
    resolver: zodResolver(veganConversionSchema),
    defaultValues: {
      personName: "",
      relationship: "",
      conversionType: "",
      date: new Date().toISOString().split("T")[0],
      conversation: false,
      documentary: false,
      cookedMeal: false,
      restaurant: false,
      notes: "",
    },
  });

  // Create vegan conversion mutation
  const createVeganConversion = useMutation({
    mutationFn: async (data: VeganConversionFormValues) => {
      // Calculate impact based on conversion type
      // For simplicity, we'll use 1 month as default timeframe
      const animalsSaved = calculateVeganImpact(data.conversionType, 1);
      
      const res = await apiRequest("POST", "/api/vegan-conversions", {
        ...data,
        animalsSaved,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Conversion saved",
        description: "The vegan conversion has been recorded successfully.",
      });
      form.reset({
        personName: "",
        relationship: "",
        conversionType: "",
        date: new Date().toISOString().split("T")[0],
        conversation: false,
        documentary: false,
        cookedMeal: false,
        restaurant: false,
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vegan-conversions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save conversion: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete vegan conversion mutation
  const deleteVeganConversion = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/vegan-conversions/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Conversion deleted",
        description: "The vegan conversion has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vegan-conversions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setSelectedConversion(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete conversion: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: VeganConversionFormValues) => {
    createVeganConversion.mutate(data);
  };

  // Calculate total animals saved
  const totalAnimalsSaved = veganConversions.reduce((sum, conversion) => sum + conversion.animalsSaved, 0);
  
  // Prepare data for chart
  const conversionsByType = veganConversions.reduce((acc, conversion) => {
    acc[conversion.conversionType] = (acc[conversion.conversionType] || 0) + conversion.animalsSaved;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(conversionsByType).map(([name, value]) => ({
    name,
    value,
  }));

  // Colors for the chart
  const COLORS = ["#10B981", "#6EE7B7", "#3B82F6", "#FBBF24", "#4F46E5"];

  // Format conversion type for display
  const formatConversionType = (type: string) => {
    switch (type) {
      case "fullVegan": return "Full Vegan";
      case "vegetarian": return "Vegetarian";
      case "reducetarian": return "Reducetarian";
      case "veganDays": return "Vegan Days";
      case "veganMeal": return "Vegan Meal";
      default: return type;
    }
  };

  // Data table columns
  const columns = [
    {
      header: "Person",
      accessorKey: "personName",
      cell: (conversion: VeganConversion) => 
        conversion.personName || `Anonymous ${conversion.relationship}`,
    },
    {
      header: "Relationship",
      accessorKey: "relationship",
    },
    {
      header: "Type",
      accessorKey: "conversionType",
      cell: (conversion: VeganConversion) => formatConversionType(conversion.conversionType),
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: (conversion: VeganConversion) => formatDate(conversion.date),
    },
    {
      header: "Impact",
      accessorKey: "animalsSaved",
      cell: (conversion: VeganConversion) => (
        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
          {conversion.animalsSaved} animals
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (conversion: VeganConversion) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedConversion(conversion)}
        >
          View
        </Button>
      ),
    },
  ];

  // Conversion type mapping for display in the metrics
  const conversionTypeCount = {
    fullVegan: veganConversions.filter(c => c.conversionType === "fullVegan").length,
    vegetarian: veganConversions.filter(c => c.conversionType === "vegetarian").length,
    reducetarian: veganConversions.filter(c => c.conversionType === "reducetarian").length,
    veganDays: veganConversions.filter(c => c.conversionType === "veganDays").length,
    veganMeal: veganConversions.filter(c => c.conversionType === "veganMeal").length,
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <Sidebar />
      <MobileNav />
      
      <main className="flex-grow pb-20 md:pb-6">
        <div className="p-4 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1">Vegan Conversions</h2>
            <p className="text-gray-600">Track the impact of dietary changes you've influenced</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Card */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Log a Conversion</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="personName">Person's Name (Optional)</Label>
                        <Input
                          id="personName"
                          placeholder="Name (optional)"
                          {...form.register("personName")}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="relationship">Relationship</Label>
                        <Select
                          onValueChange={(value) => form.setValue("relationship", value)}
                          defaultValue={form.getValues("relationship")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="family">Family</SelectItem>
                            <SelectItem value="friend">Friend</SelectItem>
                            <SelectItem value="colleague">Colleague</SelectItem>
                            <SelectItem value="acquaintance">Acquaintance</SelectItem>
                            <SelectItem value="stranger">Stranger</SelectItem>
                            <SelectItem value="self">Self</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.relationship && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.relationship.message}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="conversionType">Conversion Type</Label>
                      <Select
                        onValueChange={(value) => form.setValue("conversionType", value)}
                        defaultValue={form.getValues("conversionType")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fullVegan">Full Vegan</SelectItem>
                          <SelectItem value="vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="reducetarian">Reducetarian</SelectItem>
                          <SelectItem value="veganDays">Vegan Days (e.g., Meatless Monday)</SelectItem>
                          <SelectItem value="veganMeal">Single Vegan Meal</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.conversionType && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.conversionType.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
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
                    
                    <div className="space-y-2">
                      <Label>How did you influence them?</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="conversation"
                            checked={form.watch("conversation")}
                            onCheckedChange={(checked) => 
                              form.setValue("conversation", checked as boolean)
                            }
                          />
                          <Label htmlFor="conversation" className="font-normal">Conversation</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="documentary"
                            checked={form.watch("documentary")}
                            onCheckedChange={(checked) => 
                              form.setValue("documentary", checked as boolean)
                            }
                          />
                          <Label htmlFor="documentary" className="font-normal">Shared documentary/video</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="cookedMeal"
                            checked={form.watch("cookedMeal")}
                            onCheckedChange={(checked) => 
                              form.setValue("cookedMeal", checked as boolean)
                            }
                          />
                          <Label htmlFor="cookedMeal" className="font-normal">Cooked vegan meal</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="restaurant"
                            checked={form.watch("restaurant")}
                            onCheckedChange={(checked) => 
                              form.setValue("restaurant", checked as boolean)
                            }
                          />
                          <Label htmlFor="restaurant" className="font-normal">Took to vegan restaurant</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Additional details about the conversion"
                        {...form.register("notes")}
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={createVeganConversion.isPending}
                    >
                      {createVeganConversion.isPending ? "Saving..." : "Save Conversion"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Your Vegan Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-6">
                  <div className="relative w-48 h-48">
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-4xl font-bold text-green-600">{totalAnimalsSaved}</span>
                      <span className="text-sm text-gray-500">Animals Saved</span>
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
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      <span className="text-sm">Full Vegan</span>
                    </div>
                    <span className="font-bold">{conversionTypeCount.fullVegan}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-green-300 rounded-full mr-2"></span>
                      <span className="text-sm">Vegetarian</span>
                    </div>
                    <span className="font-bold">{conversionTypeCount.vegetarian}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-blue-300 rounded-full mr-2"></span>
                      <span className="text-sm">Reducetarian</span>
                    </div>
                    <span className="font-bold">{conversionTypeCount.reducetarian}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-yellow-300 rounded-full mr-2"></span>
                      <span className="text-sm">Vegan Days</span>
                    </div>
                    <span className="font-bold">{conversionTypeCount.veganDays}</span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-green-50 rounded-md">
                  <h4 className="font-medium text-sm mb-2">Did you know?</h4>
                  <p className="text-sm text-gray-700">
                    A person going vegan saves approximately 365 animals per year from factory farming.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vegan Resources Card */}
            <Card>
              <CardHeader>
                <CardTitle>Resources to Share</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-md flex items-start">
                    <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Vegan Starter Kit</h4>
                      <p className="text-sm text-gray-600 mb-2">Perfect for beginners interested in plant-based eating</p>
                      <Button variant="link" className="p-0 h-auto text-primary">Download PDF</Button>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-md flex items-start">
                    <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">30 Easy Vegan Recipes</h4>
                      <p className="text-sm text-gray-600 mb-2">Simple and delicious meals anyone can make</p>
                      <Button variant="link" className="p-0 h-auto text-primary">View Recipes</Button>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-md flex items-start">
                    <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                        <line x1="7" y1="2" x2="7" y2="22"/>
                        <line x1="17" y1="2" x2="17" y2="22"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <line x1="2" y1="7" x2="7" y2="7"/>
                        <line x1="2" y1="17" x2="7" y2="17"/>
                        <line x1="17" y1="17" x2="22" y2="17"/>
                        <line x1="17" y1="7" x2="22" y2="7"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Documentaries List</h4>
                      <p className="text-sm text-gray-600 mb-2">Compelling films about animal agriculture</p>
                      <Button variant="link" className="p-0 h-auto text-primary">Get List</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Conversion History Card */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                {veganConversions.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">
                    No conversions recorded yet. Start logging your vegan influences!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {veganConversions.slice(0, 3).map((conversion) => (
                      <div key={conversion.id} className="p-4 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">
                              {conversion.personName ? conversion.personName : `Anonymous`} ({conversion.relationship})
                            </h4>
                            <p className="text-sm text-gray-600">{formatConversionType(conversion.conversionType)}</p>
                          </div>
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            {conversion.animalsSaved} animals/month
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {[
                            conversion.conversation && "Conversation",
                            conversion.documentary && "Documentary",
                            conversion.cookedMeal && "Cooked meals",
                            conversion.restaurant && "Restaurant visit"
                          ].filter(Boolean).join(", ") || "No specific method"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(conversion.date)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Conversion History Table */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion History</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={veganConversions}
                  columns={columns}
                  searchable
                  searchField="personName"
                  searchPlaceholder="Search by name..."
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Conversion Details Modal */}
          {selectedConversion && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Conversion Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="font-semibold">Person</Label>
                    <p>{selectedConversion.personName || `Anonymous ${selectedConversion.relationship}`}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Relationship</Label>
                    <p>{selectedConversion.relationship}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Conversion Type</Label>
                    <p>{formatConversionType(selectedConversion.conversionType)}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Date</Label>
                    <p>{formatDate(selectedConversion.date)}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Methods Used</Label>
                    <p>
                      {[
                        selectedConversion.conversation && "Conversation",
                        selectedConversion.documentary && "Documentary",
                        selectedConversion.cookedMeal && "Cooked meals",
                        selectedConversion.restaurant && "Restaurant visit"
                      ].filter(Boolean).join(", ") || "No specific method"}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold">Impact</Label>
                    <p>{selectedConversion.animalsSaved} animals saved per month</p>
                  </div>
                  {selectedConversion.notes && (
                    <div>
                      <Label className="font-semibold">Notes</Label>
                      <p>{selectedConversion.notes}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="destructive"
                      onClick={() => deleteVeganConversion.mutate(selectedConversion.id)}
                      disabled={deleteVeganConversion.isPending}
                    >
                      {deleteVeganConversion.isPending ? "Deleting..." : "Delete"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedConversion(null)}
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
