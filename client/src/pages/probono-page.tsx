import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pencil, Trash2, Building2 } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { proBonoWorkSchema } from "@shared/schema";
import type { ProBonoWork } from "@shared/schema";
import { z } from "zod";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";

type ProBonoWorkFormValues = z.infer<typeof proBonoWorkSchema>;

export default function ProBonoPage() {
  const [editingProBonoWork, setEditingProBonoWork] = useState<ProBonoWork | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: proBonoWork = [], isLoading } = useQuery({
    queryKey: ['/api/pro-bono'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProBonoWorkFormValues) => {
      return apiRequest('/api/pro-bono', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pro-bono'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      form.reset();
      toast({
        title: "Success",
        description: "Pro bono work record created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create pro bono work record",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProBonoWorkFormValues }) => {
      return apiRequest(`/api/pro-bono/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pro-bono'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setEditingProBonoWork(null);
      form.reset();
      toast({
        title: "Success",
        description: "Pro bono work record updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pro bono work record",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/pro-bono/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pro-bono'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Success",
        description: "Pro bono work record deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete pro bono work record",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ProBonoWorkFormValues>({
    resolver: zodResolver(proBonoWorkSchema),
    defaultValues: {
      organization: "",
      role: "",
      dateStarted: "",
      dateEnded: "",
      hoursPerDay: 8,
      daysPerWeek: 5,
      organizationImpact: "Average",
      hourlyValue: 50,
      description: "",
    },
  });

  const onSubmit = (data: ProBonoWorkFormValues) => {
    if (editingProBonoWork) {
      updateMutation.mutate({ id: editingProBonoWork.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (work: ProBonoWork) => {
    setEditingProBonoWork(work);
    form.reset({
      organization: work.organization,
      role: work.role,
      dateStarted: formatDate(work.dateStarted),
      dateEnded: work.dateEnded ? formatDate(work.dateEnded) : "",
      hoursPerDay: work.hoursPerDay,
      daysPerWeek: work.daysPerWeek,
      organizationImpact: work.organizationImpact as "Highest" | "High" | "Average" | "Low",
      hourlyValue: work.hourlyValue,
      description: work.description || "",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this pro bono work record?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCancelEdit = () => {
    setEditingProBonoWork(null);
    form.reset({
      organization: "",
      role: "",
      dateStarted: "",
      dateEnded: "",
      hoursPerDay: 8,
      daysPerWeek: 5,
      organizationImpact: "Average",
      hourlyValue: 50,
      description: "",
    });
  };

  // Calculate total hours and impact
  const totalHours = proBonoWork.reduce((sum: number, work: ProBonoWork) => {
    const startDate = new Date(work.dateStarted);
    const endDate = work.dateEnded ? new Date(work.dateEnded) : new Date();
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = diffDays / 7;
    const totalWorkHours = weeks * work.daysPerWeek * work.hoursPerDay;
    return sum + totalWorkHours;
  }, 0);

  const totalValue = proBonoWork.reduce((sum: number, work: ProBonoWork) => {
    const startDate = new Date(work.dateStarted);
    const endDate = work.dateEnded ? new Date(work.dateEnded) : new Date();
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = diffDays / 7;
    const totalWorkHours = weeks * work.daysPerWeek * work.hoursPerDay;
    return sum + (totalWorkHours * work.hourlyValue);
  }, 0);

  if (isLoading) {
    return <div className="flex items-center justify-center p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Sidebar />
      <MobileNav />
      
      <main className="flex-grow pb-20 md:pb-6">
        <div className="p-4 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1 text-foreground">Pro Bono Work</h2>
            <p className="text-muted-foreground">Track your volunteer work and professional services for animal welfare organizations</p>
          </div>
          
          <div className="space-y-6">
            {/* Add Pro Bono Work Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-purple-700">
                  <Building2 className="mr-2 h-5 w-5" />
                  {editingProBonoWork ? "Edit Pro Bono Work" : "Add Pro Bono Work"}
                </CardTitle>
                <CardDescription>
                  Track your volunteer work and professional services donated to animal welfare organizations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="organization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., ASPCA, Farm Sanctuary" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role/Position</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Legal Advisor, Marketing Consultant" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dateStarted"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dateEnded"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date (Optional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">Leave blank if ongoing</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="hoursPerDay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hours per Day</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="24" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="daysPerWeek"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Days per Week</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="7" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="hourlyValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hourly Value ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="organizationImpact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Impact Level</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select impact level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Highest">Highest Impact</SelectItem>
                                <SelectItem value="High">High Impact</SelectItem>
                                <SelectItem value="Average">Average Impact</SelectItem>
                                <SelectItem value="Low">Low Impact</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the work you did..."
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {createMutation.isPending || updateMutation.isPending ? "Saving..." : 
                         editingProBonoWork ? "Update Pro Bono Work" : "Add Pro Bono Work"}
                      </Button>
                      {editingProBonoWork && (
                        <Button type="button" variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Pro Bono Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{proBonoWork.length}</p>
                    <p className="text-sm text-muted-foreground">Organizations Helped</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{formatNumber(Math.round(totalHours))}</p>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">${formatNumber(Math.round(totalValue))}</p>
                    <p className="text-sm text-muted-foreground">Estimated Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pro Bono Work Records */}
            <Card>
              <CardHeader>
                <CardTitle>Your Pro Bono Work Records</CardTitle>
                <CardDescription>
                  Professional services donated to animal welfare organizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {proBonoWork.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-lg font-medium mb-1">No pro bono work yet</p>
                    <p className="text-sm">Start tracking your volunteer work and professional contributions!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {proBonoWork.map((work: ProBonoWork) => {
                      const startDate = new Date(work.dateStarted);
                      const endDate = work.dateEnded ? new Date(work.dateEnded) : new Date();
                      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const weeks = diffDays / 7;
                      const totalWorkHours = weeks * work.daysPerWeek * work.hoursPerDay;
                      const totalWorkValue = totalWorkHours * work.hourlyValue;

                      return (
                        <div key={work.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{work.organization}</h3>
                              <p className="text-muted-foreground">{work.role}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(work)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(work.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Period</p>
                              <p>{formatDate(work.dateStarted)} - {work.dateEnded ? formatDate(work.dateEnded) : 'Ongoing'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Schedule</p>
                              <p>{work.hoursPerDay}h/day, {work.daysPerWeek} days/week</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Hours</p>
                              <p>{formatNumber(Math.round(totalWorkHours))}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Value</p>
                              <p className="font-semibold text-purple-600">${formatNumber(Math.round(totalWorkValue))}</p>
                            </div>
                          </div>
                          
                          {work.description && (
                            <div className="mt-3">
                              <p className="text-muted-foreground text-sm">Description</p>
                              <p className="text-sm">{work.description}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}