import { useState, useEffect } from "react";
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
import { Slider } from "@/components/ui/slider";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { VeganConversion, veganConversionSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatNumber } from "@/lib/utils";
import { calculateVeganImpact, DietType } from "@/lib/calculations";

type VeganConversionFormValues = z.infer<typeof veganConversionSchema>;

const DIET_OPTIONS = [
  { value: "meat-heavy", label: "Meat-heavy (-60 animals/year)", description: "High meat consumption" },
  { value: "omnivore", label: "Omnivore (0 animals/year)", description: "Standard diet baseline" },
  { value: "flexitarian", label: "Flexitarian (+60 animals/year)", description: "Reduced meat consumption" },
  { value: "pescetarian", label: "Pescetarian (+75 animals/year)", description: "Fish but no meat" },
  { value: "vegetarian", label: "Vegetarian (+90 animals/year)", description: "No meat or fish" },
  { value: "vegan", label: "Vegan (+120 animals/year)", description: "No animal products" },
];

export default function VeganPage() {
  const { toast } = useToast();
  const [selectedConversion, setSelectedConversion] = useState<VeganConversion | null>(null);
  const [editingConversion, setEditingConversion] = useState<VeganConversion | null>(null);

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
      dietBefore: "omnivore" as DietType,
      dietAfter: "vegan" as DietType,
      influence: 100,
      notes: "",
    },
  });
  
  // Effect to update form when editing a conversion
  useEffect(() => {
    if (editingConversion) {
      form.reset({
        personName: editingConversion.personName || "",
        dateStarted: new Date(editingConversion.dateStarted).toISOString().split("T")[0],
        dateEnded: editingConversion.dateEnded ? new Date(editingConversion.dateEnded).toISOString().split("T")[0] : "",
        dietBefore: editingConversion.dietBefore as DietType,
        dietAfter: editingConversion.dietAfter as DietType,
        influence: editingConversion.influence,
        notes: editingConversion.notes || "",
      });
    }
  }, [editingConversion, form]);

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
        data.dietBefore,
        data.dietAfter,
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
        dietBefore: "omnivore" as DietType,
        dietAfter: "vegan" as DietType,
        influence: 100,
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vegan-conversions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save conversion",
        variant: "destructive",
      });
    },
  });

  // Update vegan conversion mutation
  const updateVeganConversion = useMutation({
    mutationFn: async (data: VeganConversionFormValues) => {
      if (!editingConversion) throw new Error("No conversion being edited");
      
      // Parse dates
      const dateStarted = new Date(data.dateStarted);
      const dateEnded = data.dateEnded ? new Date(data.dateEnded) : null;
      
      // Calculate impact based on formula
      const animalsSaved = calculateVeganImpact(
        dateStarted,
        dateEnded,
        data.dietBefore,
        data.dietAfter,
        data.influence
      );
      
      const res = await apiRequest("PATCH", `/api/vegan-conversions/${editingConversion.id}`, {
        ...data,
        animalsSaved,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Conversion updated",
        description: "The vegan conversion has been updated successfully.",
      });
      setEditingConversion(null);
      form.reset({
        personName: "",
        dateStarted: new Date().toISOString().split("T")[0],
        dateEnded: "",
        dietBefore: "omnivore" as DietType,
        dietAfter: "vegan" as DietType,
        influence: 100,
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vegan-conversions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update conversion",
        variant: "destructive",
      });
    },
  });

  // Delete vegan conversion mutation
  const deleteVeganConversion = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/vegan-conversions/${id}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Conversion deleted",
        description: "The vegan conversion has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vegan-conversions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete conversion",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VeganConversionFormValues) => {
    if (editingConversion) {
      updateVeganConversion.mutate(data);
    } else {
      createVeganConversion.mutate(data);
    }
  };

  // Function to format diet type for display
  const formatDietType = (diet: string) => {
    const option = DIET_OPTIONS.find(opt => opt.value === diet);
    return option ? option.label.split(' ')[0] : diet;
  };

  // Calculate chart data for current form values
  const watchedValues = form.watch(["dateStarted", "dateEnded", "dietBefore", "dietAfter", "influence"]);
  const currentImpact = calculateVeganImpact(
    new Date(watchedValues[0]),
    watchedValues[1] ? new Date(watchedValues[1]) : null,
    watchedValues[2],
    watchedValues[3],
    watchedValues[4]
  );

  // Calculate statistics
  const totalAnimals = veganConversions.reduce((sum, conversion) => sum + conversion.animalsSaved, 0);
  
  // Group conversions by impact level
  const impactLevels = {
    major: veganConversions.filter(c => c.animalsSaved >= 500).length,
    significant: veganConversions.filter(c => c.animalsSaved >= 200 && c.animalsSaved < 500).length,
    moderate: veganConversions.filter(c => c.animalsSaved >= 50 && c.animalsSaved < 200).length,
    minor: veganConversions.filter(c => c.animalsSaved < 50).length,
  };

  // Chart data
  const chartData = [
    { name: "Major Impact", value: impactLevels.major, animals: veganConversions.filter(c => c.animalsSaved >= 500).reduce((sum, c) => sum + c.animalsSaved, 0) },
    { name: "Significant Impact", value: impactLevels.significant, animals: veganConversions.filter(c => c.animalsSaved >= 200 && c.animalsSaved < 500).reduce((sum, c) => sum + c.animalsSaved, 0) },
    { name: "Moderate Impact", value: impactLevels.moderate, animals: veganConversions.filter(c => c.animalsSaved >= 50 && c.animalsSaved < 200).reduce((sum, c) => sum + c.animalsSaved, 0) },
    { name: "Minor Impact", value: impactLevels.minor, animals: veganConversions.filter(c => c.animalsSaved < 50).reduce((sum, c) => sum + c.animalsSaved, 0) },
  ].filter(item => item.value > 0);

  const COLORS = ['#10b981', '#6ee7b7', '#93c5fd', '#fbbf24'];

  // Data table columns
  const columns = [
    {
      header: "Person",
      accessorKey: "personName" as keyof VeganConversion,
      cell: (conversion: VeganConversion) => conversion.personName || "Anonymous",
    },
    {
      header: "Started",
      accessorKey: "dateStarted" as keyof VeganConversion,
      cell: (conversion: VeganConversion) => formatDate(conversion.dateStarted),
    },
    {
      header: "Diet Change",
      accessorKey: "dietBefore" as keyof VeganConversion,
      cell: (conversion: VeganConversion) => `${formatDietType(conversion.dietBefore)} → ${formatDietType(conversion.dietAfter)}`,
    },
    {
      header: "Animals Saved",
      accessorKey: "animalsSaved" as keyof VeganConversion,
      cell: (conversion: VeganConversion) => (
        <Badge variant={conversion.animalsSaved >= 200 ? "default" : conversion.animalsSaved >= 50 ? "secondary" : "outline"}>
          {formatNumber(conversion.animalsSaved)}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof VeganConversion,
      cell: (conversion: VeganConversion) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedConversion(conversion)}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingConversion(conversion)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteVeganConversion.mutate(conversion.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <MobileNav />
        <div className="p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vegan Conversions</h1>
              <p className="text-gray-600 mt-2">
                Track people you've influenced to reduce their animal product consumption
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Conversions</p>
                      <p className="text-2xl font-bold text-gray-900">{veganConversions.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Animals Saved</p>
                      <p className="text-2xl font-bold text-green-600">{formatNumber(totalAnimals)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. per Conversion</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {veganConversions.length > 0 ? formatNumber(Math.round(totalAnimals / veganConversions.length)) : 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Current Impact</p>
                      <p className="text-2xl font-bold text-purple-600">{formatNumber(currentImpact)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form and Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form Card */}
              <Card>
                <CardHeader>
                  <CardTitle>{editingConversion ? "Edit Conversion" : "Log New Conversion"}</CardTitle>
                  <CardDescription>
                    Record your influence on someone's dietary choices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="personName">Person's Name (optional)</Label>
                      <Input
                        id="personName"
                        {...form.register("personName")}
                        placeholder="e.g., John Smith"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dateStarted">Start Date *</Label>
                        <Input
                          id="dateStarted"
                          type="date"
                          {...form.register("dateStarted")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateEnded">End Date (optional)</Label>
                        <Input
                          id="dateEnded"
                          type="date"
                          {...form.register("dateEnded")}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="dietBefore">Diet Before Conversion *</Label>
                      <Select 
                        value={form.watch("dietBefore")} 
                        onValueChange={(value) => form.setValue("dietBefore", value as DietType)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select diet type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIET_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="dietAfter">Diet After Conversion *</Label>
                      <Select 
                        value={form.watch("dietAfter")} 
                        onValueChange={(value) => form.setValue("dietAfter", value as DietType)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select diet type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIET_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="influence">Your Influence (%)</Label>
                      <div className="mt-2">
                        <Slider
                          value={[form.watch("influence")]}
                          onValueChange={(value) => form.setValue("influence", value[0])}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                          <span>0%</span>
                          <span className="font-medium">{form.watch("influence")}%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        {...form.register("notes")}
                        placeholder="Additional details about the conversion..."
                        rows={3}
                      />
                    </div>

                    <div className="bg-green-50 p-4 rounded-md">
                      <h4 className="font-medium text-sm mb-2">Estimated Impact</h4>
                      <p className="text-2xl font-bold text-green-600">{formatNumber(currentImpact)} animals saved</p>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        type="submit" 
                        disabled={createVeganConversion.isPending || updateVeganConversion.isPending}
                        className="flex-1"
                      >
                        {editingConversion ? "Update Conversion" : "Save Conversion"}
                      </Button>
                      {editingConversion && (
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setEditingConversion(null);
                            form.reset({
                              personName: "",
                              dateStarted: new Date().toISOString().split("T")[0],
                              dateEnded: "",
                              dietBefore: "omnivore" as DietType,
                              dietAfter: "vegan" as DietType,
                              influence: 100,
                              notes: "",
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Chart Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Impact Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of your conversions by impact level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <div className="h-80">
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
                          <Tooltip formatter={(value) => [`${formatNumber(value as number)} conversions`, 'Count']} />
                          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500">
                      No conversions to display yet
                    </div>
                  )}
                  
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        <span className="text-sm">Major Impact (500+ animals)</span>
                      </div>
                      <span className="font-bold">{impactLevels.major}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <span className="w-3 h-3 bg-green-300 rounded-full mr-2"></span>
                        <span className="text-sm">Significant Impact (200-499 animals)</span>
                      </div>
                      <span className="font-bold">{impactLevels.significant}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <span className="w-3 h-3 bg-blue-300 rounded-full mr-2"></span>
                        <span className="text-sm">Moderate Impact (50-199 animals)</span>
                      </div>
                      <span className="font-bold">{impactLevels.moderate}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <span className="w-3 h-3 bg-yellow-300 rounded-full mr-2"></span>
                        <span className="text-sm">Minor Impact (1-49 animals)</span>
                      </div>
                      <span className="font-bold">{impactLevels.minor}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-green-50 rounded-md">
                    <h4 className="font-medium text-sm mb-2">Did you know?</h4>
                    <p className="text-sm text-gray-700">
                      Our calculations are based on research showing different diet types save varying numbers of animals per year. Going vegan saves about 120 animals annually, while even small reductions help!
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
                      <Label className="text-sm font-medium">Diet Change</Label>
                      <p className="text-sm">{formatDietType(selectedConversion.dietBefore)} → {formatDietType(selectedConversion.dietAfter)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Your Influence</Label>
                      <p className="text-sm">{selectedConversion.influence}%</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Duration</Label>
                      <p className="text-sm">
                        {selectedConversion.dateEnded 
                          ? `${formatDate(selectedConversion.dateStarted)} - ${formatDate(selectedConversion.dateEnded)}`
                          : `Since ${formatDate(selectedConversion.dateStarted)} (ongoing)`
                        }
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Animals Saved</Label>
                      <p className="text-lg font-bold text-green-600">{formatNumber(selectedConversion.animalsSaved)}</p>
                    </div>
                    {selectedConversion.notes && (
                      <div>
                        <Label className="text-sm font-medium">Notes</Label>
                        <p className="text-sm text-gray-600">{selectedConversion.notes}</p>
                      </div>
                    )}
                    <Button 
                      onClick={() => setSelectedConversion(null)}
                      className="w-full"
                    >
                      Close
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}