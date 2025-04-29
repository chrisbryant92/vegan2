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
import { Slider } from "@/components/ui/slider";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { VeganConversion, veganConversionSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { calculateVeganImpact } from "@/lib/calculations";

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
      dateStarted: new Date().toISOString().split("T")[0],
      dateEnded: "",
      meatinessBefore: 100,
      meatinessAfter: 0,
      influence: 100,
      notes: "",
    },
  });

  // Create vegan conversion mutation
  const createVeganConversion = useMutation({
    mutationFn: async (data: VeganConversionFormValues) => {
      // Parse dates
      const dateStarted = new Date(data.dateStarted);
      const dateEnded = data.dateEnded ? new Date(data.dateEnded) : null;
      
      // Calculate impact based on formula
      const animalsSaved = calculateVeganImpact(
        dateStarted,
        dateEnded,
        data.meatinessBefore,
        data.meatinessAfter,
        data.influence
      );
      
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
        dateStarted: new Date().toISOString().split("T")[0],
        dateEnded: "",
        meatinessBefore: 100,
        meatinessAfter: 0,
        influence: 100,
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
  
  // Prepare data for chart - using meatiness reduction % ranges as categories
  const conversionsByImpact = veganConversions.reduce((acc, conversion) => {
    const impact = conversion.meatinessBefore - conversion.meatinessAfter;
    
    let category = '';
    if (impact >= 80) {
      category = "Major reduction (80-100%)";
    } else if (impact >= 50) {
      category = "Significant reduction (50-79%)";
    } else if (impact >= 30) {
      category = "Moderate reduction (30-49%)";
    } else {
      category = "Minor reduction (0-29%)";
    }
    
    acc[category] = (acc[category] || 0) + conversion.animalsSaved;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(conversionsByImpact).map(([name, value]) => ({
    name,
    value,
  }));

  // Colors for the chart
  const COLORS = ["#10B981", "#6EE7B7", "#3B82F6", "#FBBF24", "#4F46E5"];

  // Format impact level for display
  const formatImpactLevel = (meatinessBefore: number, meatinessAfter: number) => {
    const impact = meatinessBefore - meatinessAfter;
    
    if (impact >= 80) {
      return "Major reduction";
    } else if (impact >= 50) {
      return "Significant reduction";
    } else if (impact >= 30) {
      return "Moderate reduction";
    } else {
      return "Minor reduction";
    }
  };

  // Data table columns
  const columns = [
    {
      header: "Person",
      accessorKey: "personName",
      cell: (conversion: VeganConversion) => 
        conversion.personName || "Anonymous",
    },
    {
      header: "Impact Level",
      accessorKey: "meatinessBefore",
      cell: (conversion: VeganConversion) => 
        formatImpactLevel(conversion.meatinessBefore, conversion.meatinessAfter),
    },
    {
      header: "Date Started",
      accessorKey: "dateStarted",
      cell: (conversion: VeganConversion) => formatDate(conversion.dateStarted),
    },
    {
      header: "Meatiness Change",
      accessorKey: "meatinessBefore",
      cell: (conversion: VeganConversion) => 
        `${conversion.meatinessBefore}% → ${conversion.meatinessAfter}%`,
    },
    {
      header: "Animals Saved",
      accessorKey: "animalsSaved",
      cell: (conversion: VeganConversion) => (
        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
          {conversion.animalsSaved}
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

  // Categorize conversions by impact level
  const impactLevels = {
    major: veganConversions.filter(c => (c.meatinessBefore - c.meatinessAfter) >= 80).length,
    significant: veganConversions.filter(c => (c.meatinessBefore - c.meatinessAfter) >= 50 && (c.meatinessBefore - c.meatinessAfter) < 80).length,
    moderate: veganConversions.filter(c => (c.meatinessBefore - c.meatinessAfter) >= 30 && (c.meatinessBefore - c.meatinessAfter) < 50).length,
    minor: veganConversions.filter(c => (c.meatinessBefore - c.meatinessAfter) < 30).length,
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
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="personName">Person's Name (Optional)</Label>
                      <Input
                        id="personName"
                        placeholder="Name (optional)"
                        {...form.register("personName")}
                      />
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
                        <p className="text-xs text-gray-500">Leave blank if still ongoing</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <Label htmlFor="meatinessBefore">Meatiness Before Conversion (%)</Label>
                          <span className="text-sm text-gray-500">{form.watch("meatinessBefore")}%</span>
                        </div>
                        <Slider
                          id="meatinessBefore"
                          min={0}
                          max={100}
                          step={1}
                          defaultValue={[form.watch("meatinessBefore")]}
                          onValueChange={(value) => form.setValue("meatinessBefore", value[0])}
                        />
                        <p className="text-xs text-gray-500">100% = Full meat diet, 0% = No meat</p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <Label htmlFor="meatinessAfter">Meatiness After Conversion (%)</Label>
                          <span className="text-sm text-gray-500">{form.watch("meatinessAfter")}%</span>
                        </div>
                        <Slider
                          id="meatinessAfter"
                          min={0}
                          max={100}
                          step={1}
                          defaultValue={[form.watch("meatinessAfter")]}
                          onValueChange={(value) => form.setValue("meatinessAfter", value[0])}
                        />
                        <p className="text-xs text-gray-500">100% = Full meat diet, 0% = No meat</p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <Label htmlFor="influence">Your Influence (%)</Label>
                          <span className="text-sm text-gray-500">{form.watch("influence")}%</span>
                        </div>
                        <Slider
                          id="influence"
                          min={0}
                          max={100}
                          step={1}
                          defaultValue={[form.watch("influence")]}
                          onValueChange={(value) => form.setValue("influence", value[0])}
                        />
                        <p className="text-xs text-gray-500">100% = Entirely your influence, 0% = No influence</p>
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
                    
                    <div className="pt-2">
                      <div className="p-3 bg-green-50 border border-green-100 rounded-md mb-4">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Impact Calculation:</span> ((Date Ended - Date Started) / 3) × (Meatiness Before - Meatiness After) × Influence
                        </p>
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={createVeganConversion.isPending}
                      >
                        {createVeganConversion.isPending ? "Saving..." : "Save Conversion"}
                      </Button>
                    </div>
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
                    <div className="absolute inset-0 flex items-center justify-center flex-col z-10">
                      <span className="text-4xl font-bold text-green-600">{totalAnimalsSaved}</span>
                      <span className="text-sm text-gray-500">Animals Saved</span>
                    </div>
                    
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          dataKey="value"
                          label={false}
                          paddingAngle={2}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} animals`, 'Impact']} />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      <span className="text-sm">Major Reductions</span>
                    </div>
                    <span className="font-bold">{impactLevels.major}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-green-300 rounded-full mr-2"></span>
                      <span className="text-sm">Significant Reductions</span>
                    </div>
                    <span className="font-bold">{impactLevels.significant}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-blue-300 rounded-full mr-2"></span>
                      <span className="text-sm">Moderate Reductions</span>
                    </div>
                    <span className="font-bold">{impactLevels.moderate}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-yellow-300 rounded-full mr-2"></span>
                      <span className="text-sm">Minor Reductions</span>
                    </div>
                    <span className="font-bold">{impactLevels.minor}</span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-green-50 rounded-md">
                  <h4 className="font-medium text-sm mb-2">Did you know?</h4>
                  <p className="text-sm text-gray-700">
                    The average meat-eater eats 120 animals per year (there are estimates between 100 - 500 per year), so for every person you convert, you can take credit for some portion of those animals saved each year that they stay vegan!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Data Table Card */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Your Conversion History</CardTitle>
                <CardDescription>
                  Track and manage all the dietary changes you've influenced
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading conversions...</p>
                  </div>
                ) : veganConversions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No conversions recorded yet.</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Start tracking your impact by logging a conversion above.
                    </p>
                  </div>
                ) : (
                  <DataTable columns={columns} data={veganConversions} />
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Selected Conversion Details Modal */}
          {selectedConversion && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>
                    {selectedConversion.personName || "Anonymous"} - Conversion Details
                  </CardTitle>
                  <CardDescription>
                    Started on {formatDate(selectedConversion.dateStarted)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Duration</h4>
                    <p>
                      {selectedConversion.dateEnded
                        ? `${formatDate(selectedConversion.dateStarted)} to ${formatDate(selectedConversion.dateEnded)}`
                        : `Started ${formatDate(selectedConversion.dateStarted)} (ongoing)`}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Meatiness Change</h4>
                    <p>From {selectedConversion.meatinessBefore}% to {selectedConversion.meatinessAfter}%</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Your Influence</h4>
                    <p>{selectedConversion.influence}%</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Impact</h4>
                    <p className="text-green-600 font-bold">{selectedConversion.animalsSaved} animals saved</p>
                  </div>
                  
                  {selectedConversion.notes && (
                    <div>
                      <h4 className="font-medium mb-1">Notes</h4>
                      <p className="text-sm">{selectedConversion.notes}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedConversion(null)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteVeganConversion.mutate(selectedConversion.id)}
                      disabled={deleteVeganConversion.isPending}
                    >
                      {deleteVeganConversion.isPending ? "Deleting..." : "Delete"}
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