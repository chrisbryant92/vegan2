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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
// Removed PieChart import as we're using a cleaner top organizations display
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Donation, donationSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";
import { calculateDonationImpact } from "@/lib/calculations";

// Use the shared donation schema imported from schema.ts

type DonationFormValues = z.infer<typeof donationSchema>;

export default function DonationsPage() {
  const { toast } = useToast();
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);

  // Fetch donations
  const { data: donations = [], isLoading } = useQuery<Donation[]>({
    queryKey: ["/api/donations"],
  });

  // Form setup
  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      organization: "",
      amount: 0,
      currency: "USD",
      organizationImpact: "Average",
      date: new Date().toISOString().split("T")[0],
      isMonthly: false,
      dateStarted: null,
      dateEnded: null,
      notes: "",
    },
    // Enable form watching for reactive UI updates
    mode: "onChange"
  });
  
  // Effect to update form when editing a donation
  useEffect(() => {
    if (editingDonation) {
      form.reset({
        organization: editingDonation.organization,
        amount: editingDonation.amount,
        currency: (editingDonation.currency || "USD") as "GBP" | "EUR" | "USD" | "CAD" | "AUD" | "NZD",
        organizationImpact: (editingDonation.organizationImpact || "Average") as "Highest" | "High" | "Average" | "Low",
        date: new Date(editingDonation.date).toISOString().split("T")[0],
        isMonthly: editingDonation.isMonthly || false,
        dateStarted: editingDonation.dateStarted ? new Date(editingDonation.dateStarted).toISOString().split("T")[0] : null,
        dateEnded: editingDonation.dateEnded ? new Date(editingDonation.dateEnded).toISOString().split("T")[0] : null,
        notes: editingDonation.notes || "",
      });
    }
  }, [editingDonation, form]);

  // Create donation mutation
  const createDonation = useMutation({
    mutationFn: async (data: DonationFormValues) => {
      // Calculate impact using organization impact factor
      const animalsSaved = calculateDonationImpact(data.amount, data.organizationImpact);
      
      const res = await apiRequest("POST", "/api/donations", {
        ...data,
        animalsSaved,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Donation saved",
        description: "Your donation has been recorded successfully.",
      });
      form.reset({
        organization: "",
        amount: 0,
        currency: "USD",
        organizationImpact: "Average",
        date: new Date().toISOString().split("T")[0],
        isMonthly: false,
        dateStarted: null,
        dateEnded: null,
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/donations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save donation: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update donation mutation
  const updateDonation = useMutation({
    mutationFn: async (data: DonationFormValues & { id: number }) => {
      const { id, ...formData } = data;
      // Calculate impact using organization impact factor
      const animalsSaved = calculateDonationImpact(formData.amount, formData.organizationImpact as "Highest" | "High" | "Average" | "Low");
      
      console.log("Update donation calculation:", {
        amount: formData.amount,
        organizationImpact: formData.organizationImpact,
        animalsSaved,
      });
      
      const res = await apiRequest("PATCH", `/api/donations/${id}`, {
        ...formData,
        animalsSaved,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Donation updated",
        description: "Your donation has been updated successfully.",
      });
      form.reset({
        organization: "",
        amount: 0,
        currency: "USD",
        organizationImpact: "Average",
        date: new Date().toISOString().split("T")[0],
        isMonthly: false,
        dateStarted: null,
        dateEnded: null,
        notes: "",
      });
      setEditingDonation(null);
      queryClient.invalidateQueries({ queryKey: ["/api/donations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update donation: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete donation mutation
  const deleteDonation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/donations/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Donation deleted",
        description: "The donation has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/donations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setSelectedDonation(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete donation: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: DonationFormValues) => {
    console.log("Submitting form data:", data);
    
    // Make sure dates are handled properly
    const formattedData = {
      ...data,
      // Convert date strings to proper format
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      // Handle the monthly donation dates
      dateStarted: data.isMonthly && data.dateStarted ? new Date(data.dateStarted).toISOString() : null,
      dateEnded: data.isMonthly && data.dateEnded ? new Date(data.dateEnded).toISOString() : null,
    };
    
    console.log("Formatted data:", formattedData);
    
    if (editingDonation) {
      // Update existing donation
      updateDonation.mutate({
        ...formattedData,
        id: editingDonation.id
      });
    } else {
      // Create new donation
      createDonation.mutate(formattedData);
    }
  };
  
  // Cancel editing and reset form
  const cancelEdit = () => {
    setEditingDonation(null);
    form.reset({
      organization: "",
      amount: 0,
      currency: "USD",
      organizationImpact: "Average",
      date: new Date().toISOString().split("T")[0],
      isMonthly: false,
      dateStarted: null,
      dateEnded: null,
      notes: "",
    });
  };

  // Helper function to calculate total amount for a donation 
  const calculateTotalAmount = (donation: Donation): number => {
    if (!donation.isMonthly) {
      // One-off donation: just return the amount
      return donation.amount;
    } else {
      // Monthly donation: calculate based on time period
      const startDate = donation.dateStarted ? new Date(donation.dateStarted) : null;
      const endDate = donation.dateEnded ? new Date(donation.dateEnded) : new Date(); // Use current date if no end date
      
      if (!startDate) {
        return donation.amount; // Return just the amount if no start date available
      }
      
      // Calculate months between dates: (endDate - startDate) / 30
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const monthsDiff = daysDiff / 30;
      
      // Monthly formula: (months * monthly amount)
      return monthsDiff * donation.amount;
    }
  };
  
  // Calculate total donated with the new formula
  const totalDonated = donations.reduce((sum, donation) => {
    if (!donation.isMonthly) {
      // One-off donation: just add the amount
      return sum + donation.amount;
    } else {
      // Monthly donation: calculate based on time period
      const startDate = donation.dateStarted ? new Date(donation.dateStarted) : null;
      const endDate = donation.dateEnded ? new Date(donation.dateEnded) : new Date(); // Use current date if no end date
      
      if (!startDate) {
        return sum; // Skip if no start date available
      }
      
      // Calculate months between dates: (endDate - startDate) / 30
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const monthsDiff = daysDiff / 30;
      
      // Monthly formula: (months * monthly amount)
      return sum + (monthsDiff * donation.amount);
    }
  }, 0);
  
  // Calculate total animals saved based on the total amounts and organization impact
  const totalAnimalsSaved = donations.reduce((sum, donation) => {
    // Get total amount for this donation (considering monthly calculations)
    const totalAmount = calculateTotalAmount(donation);
    // Use the organization impact to calculate animals saved
    const impactLevel = donation.organizationImpact || "Average";
    // Calculate animals saved using our formula from calculations.ts
    return sum + calculateDonationImpact(totalAmount, impactLevel);
  }, 0);
  
  // Prepare data for chart
  const donationsByOrganization = donations.reduce((acc, donation) => {
    // Use the total amount to calculate animals saved for this organization
    const totalAmount = calculateTotalAmount(donation);
    const impactLevel = donation.organizationImpact || "Average";
    const recalculatedImpact = calculateDonationImpact(totalAmount, impactLevel);
    acc[donation.organization] = (acc[donation.organization] || 0) + recalculatedImpact;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(donationsByOrganization).map(([name, value]) => ({
    name,
    value,
  }));

  // Colors for the chart
  const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EC4899", "#6366F1"];



  // Data table columns
  const columns = [
    {
      header: "Organization",
      accessorKey: "organization" as const,
    },
    {
      header: "Amount",
      accessorKey: "amount" as const,
      cell: (donation: Donation) => {
        const currencySymbols: Record<string, string> = {
          'USD': '$',
          'GBP': '£',
          'EUR': '€',
          'CAD': 'C$',
          'AUD': 'A$',
          'NZD': 'NZ$'
        };
        const symbol = currencySymbols[donation.currency || 'USD'] || '$';
        return `${symbol}${donation.amount.toLocaleString()}`;
      },
    },
    {
      header: "Total Amount",
      // Use a valid key from Donation type but override with custom cell render function
      accessorKey: "amount" as const, 
      id: "totalAmount",
      cell: (donation: Donation) => {
        const currencySymbols: Record<string, string> = {
          'USD': '$',
          'GBP': '£',
          'EUR': '€',
          'CAD': 'C$',
          'AUD': 'A$',
          'NZD': 'NZ$'
        };
        const symbol = currencySymbols[donation.currency || 'USD'] || '$';
        return `${symbol}${calculateTotalAmount(donation).toLocaleString()}`;
      },
    },
    {
      header: "Currency",
      accessorKey: "currency" as const,
      cell: (donation: Donation) => donation.currency || 'USD',
    },
    {
      header: "Impact Level",
      accessorKey: "organizationImpact" as const,
    },
    {
      header: "Frequency",
      accessorKey: "isMonthly" as const,
      cell: (donation: Donation) => (
        <Badge variant={donation.isMonthly ? "secondary" : "outline"}>
          {donation.isMonthly ? "Monthly" : "One-Off"}
        </Badge>
      ),
    },
    {
      header: "Date",
      accessorKey: "date" as const,
      cell: (donation: Donation) => formatDate(donation.date),
    },
    {
      header: "Impact",
      accessorKey: "animalsSaved" as const,
      cell: (donation: Donation) => {
        // Calculate the real impact based on the total amount and organization impact
        const totalAmount = calculateTotalAmount(donation);
        // Use the organizationImpact field, or default to "Average" if not present
        const impactLevel = donation.organizationImpact || "Average";
        const recalculatedImpact = calculateDonationImpact(totalAmount, impactLevel);
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            {recalculatedImpact} animals
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "id" as const,
      cell: (donation: Donation) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDonation(donation)}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingDonation(donation);
              // Scroll to the form
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Sidebar />
      <MobileNav />
      
      <main className="flex-grow pb-20 md:pb-6">
        <div className="p-4 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1 text-foreground">Charitable Donations</h2>
            <p className="text-muted-foreground">Track the impact of your financial contributions</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Card */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{editingDonation ? 'Edit Donation' : 'Log Your Donation'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="organization">Organization</Label>
                        <Input
                          id="organization"
                          placeholder="E.g., The Humane League, Good Food Institute"
                          {...form.register("organization")}
                        />
                        {form.formState.errors.organization && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.organization.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <div className="flex space-x-2">
                          <Select
                            onValueChange={(value: "GBP" | "EUR" | "USD" | "CAD" | "AUD" | "NZD") => form.setValue("currency", value)}
                            defaultValue={form.getValues("currency") || "USD"}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="CAD">CAD</SelectItem>
                              <SelectItem value="AUD">AUD</SelectItem>
                              <SelectItem value="NZD">NZD</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="flex-1"
                            {...form.register("amount", { valueAsNumber: true })}
                          />
                        </div>
                        {form.formState.errors.amount && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.amount.message}
                          </p>
                        )}
                        {form.formState.errors.currency && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.currency.message}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="organizationImpact">Organization Impact</Label>
                      <Select
                        onValueChange={(value: "Highest" | "High" | "Average" | "Low") => form.setValue("organizationImpact", value)}
                        defaultValue={form.getValues("organizationImpact") || "Average"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select impact level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Highest">Highest (4.6 animals per $)</SelectItem>
                          <SelectItem value="High">High (3.1 animals per $)</SelectItem>
                          <SelectItem value="Average">Average (0.007 animals per $)</SelectItem>
                          <SelectItem value="Low">Low (0.001 animals per $)</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.organizationImpact && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.organizationImpact.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <Label>Donation Frequency</Label>
                      <div className="flex flex-col space-y-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="radio" 
                            id="one-off" 
                            name="donationType"
                            checked={!form.watch("isMonthly")}
                            onChange={() => {
                              console.log("Setting one-off donation (isMonthly: false)");
                              form.setValue("isMonthly", false, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                              form.setValue("dateStarted", null);
                              form.setValue("dateEnded", null);
                              // Force a re-render to ensure conditional fields update
                              setTimeout(() => {
                                console.log("Monthly donation set to:", form.getValues("isMonthly"));
                              }, 100);
                            }}
                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                          />
                          <span className="font-normal">One-Off Donation</span>
                        </label>
                        
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="radio" 
                            id="monthly" 
                            name="donationType"
                            checked={!!form.watch("isMonthly")}
                            onChange={() => {
                              console.log("Setting monthly donation to true");
                              form.setValue("isMonthly", true, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                              form.setValue("dateStarted", new Date().toISOString().split("T")[0]);
                              // Force a re-render to ensure conditional fields update
                              setTimeout(() => {
                                console.log("Monthly donation set to:", form.getValues("isMonthly"));
                                console.log("Date started set to:", form.getValues("dateStarted"));
                              }, 100);
                            }}
                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                          />
                          <span className="font-normal">Monthly Donation</span>
                        </label>
                      </div>
                    </div>
                    
                    {!form.watch("isMonthly") ? (
                      <div className="space-y-2">
                        <Label htmlFor="date">Donation Date</Label>
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
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dateStarted">Date Started</Label>
                          <Input
                            id="dateStarted"
                            type="date"
                            {...form.register("dateStarted")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dateEnded">Date Ended (Optional)</Label>
                          <Input
                            id="dateEnded"
                            type="date"
                            {...form.register("dateEnded")}
                          />
                          <p className="text-xs text-muted-foreground">Leave blank if still active</p>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="date">Last Donation Date</Label>
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
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Additional details about your donation"
                        {...form.register("notes")}
                      />
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      {editingDonation && (
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="submit"
                        className="bg-primary hover:bg-primary/90"
                        disabled={createDonation.isPending || updateDonation.isPending}
                      >
                        {createDonation.isPending || updateDonation.isPending ? "Saving..." : 
                          editingDonation ? "Update Donation" : "Save Donation"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Your Donation Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-primary">{formatNumber(totalAnimalsSaved)}</span>
                    <p className="text-sm text-muted-foreground">Animals Saved</p>
                  </div>
                  
                  {/* Top Organizations */}
                  {chartData.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-3">Top Organizations by Impact</h4>
                      <div className="space-y-2">
                        {chartData
                          .sort((a, b) => b.value - a.value)
                          .slice(0, 5)
                          .map((org, index) => {
                            const percentage = ((org.value / totalAnimalsSaved) * 100).toFixed(1);
                            return (
                              <div key={org.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  />
                                  <span className="font-medium truncate max-w-[150px]" title={org.name}>
                                    {org.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{percentage}%</span>
                                  <span className="font-medium text-primary">
                                    {formatNumber(org.value)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Total Donated</span>
                      <span className="font-bold">{formatCurrency(totalDonated)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${Math.min((totalDonated / 1000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Monthly Goal</span>
                      <span>{formatCurrency(1000)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full"
                        style={{ width: `${Math.min((totalDonated / 1000) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((totalDonated / 1000) * 100)}% of your monthly goal
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-muted/30 rounded-md">
                  <h4 className="font-medium text-sm mb-2">Impact Calculation</h4>
                  <p className="text-sm text-muted-foreground">
                    Donation impact varies dramatically by organization effectiveness. Our formula: Amount × Impact Factor. Highest impact organizations like those focused on farmed animals save 4.6 animals per dollar, while average organizations save 0.007 animals per dollar. Monthly donations are calculated over their specified time period.
                    <br /><br />
                    <a href="https://docs.google.com/spreadsheets/d/1LEtE4sGdNHN4w_yWM2E_dktS5JNGZqQY4A7w-QBHcOA/edit?gid=0#gid=0" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                      View calculation methodology and research sources →
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Donations Table */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Donations</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={donations}
                  columns={columns}
                  searchable
                  searchField="organization"
                  searchPlaceholder="Search organizations..."
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Donation Details Modal */}
          {selectedDonation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Donation Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="font-semibold">Organization</Label>
                    <p>{selectedDonation.organization}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Amount {selectedDonation.isMonthly ? "(Monthly)" : ""}</Label>
                    <p>{formatCurrency(selectedDonation.amount)}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Total Amount</Label>
                    <p>{formatCurrency(calculateTotalAmount(selectedDonation))}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Type</Label>
                    <p>{
                      // Format the organization type to be user-friendly
                      {
                        animalShelter: "Animal Shelter",
                        wildlifeConservation: "Wildlife Conservation",
                        rescueOperation: "Rescue Operation",
                        animalRights: "Animal Rights Organization",
                        other: "Other"
                      }[selectedDonation.donationType] || selectedDonation.donationType
                    }</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Donation Type</Label>
                    <p>{selectedDonation.isMonthly ? "Monthly Donation" : "One-Off Donation"}</p>
                  </div>
                  
                  {selectedDonation.isMonthly ? (
                    <>
                      <div>
                        <Label className="font-semibold">Date Started</Label>
                        <p>{selectedDonation.dateStarted ? formatDate(selectedDonation.dateStarted) : "N/A"}</p>
                      </div>
                      {selectedDonation.dateEnded && (
                        <div>
                          <Label className="font-semibold">Date Ended</Label>
                          <p>{formatDate(selectedDonation.dateEnded)}</p>
                        </div>
                      )}
                      <div>
                        <Label className="font-semibold">Last Payment Date</Label>
                        <p>{formatDate(selectedDonation.date)}</p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <Label className="font-semibold">Date</Label>
                      <p>{formatDate(selectedDonation.date)}</p>
                    </div>
                  )}
                  <div>
                    <Label className="font-semibold">Impact</Label>
                    <p>{formatNumber(calculateDonationImpact(calculateTotalAmount(selectedDonation)))} animals saved</p>
                  </div>
                  {selectedDonation.notes && (
                    <div>
                      <Label className="font-semibold">Notes</Label>
                      <p>{selectedDonation.notes}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="destructive"
                      onClick={() => deleteDonation.mutate(selectedDonation.id)}
                      disabled={deleteDonation.isPending}
                    >
                      {deleteDonation.isPending ? "Deleting..." : "Delete"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDonation(null)}
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
