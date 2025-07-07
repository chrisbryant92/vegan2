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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pencil, Trash2, Plus, Building2 } from "lucide-react";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      setIsDialogOpen(false);
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProBonoWorkFormValues> }) => {
      return apiRequest(`/api/pro-bono/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pro-bono'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setEditingProBonoWork(null);
      setIsDialogOpen(false);
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
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this pro bono work record?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
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
    setIsDialogOpen(true);
  };

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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Your Pro Bono Contributions</h3>
                <p className="text-muted-foreground">
                  Professional services donated to animal welfare organizations
                </p>
              </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Pro Bono Work
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProBonoWork ? "Edit Pro Bono Work" : "Add Pro Bono Work"}
              </DialogTitle>
              <DialogDescription>
                Track your volunteer work and professional services donated to animal welfare organizations.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hoursPerDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hours per Day</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.5"
                            min="0.5"
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
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="organizationImpact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Impact Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select impact level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Highest">Highest (4.89x)</SelectItem>
                            <SelectItem value="High">High (3.1x)</SelectItem>
                            <SelectItem value="Average">Average (0.007x)</SelectItem>
                            <SelectItem value="Low">Low (0.001x)</SelectItem>
                          </SelectContent>
                        </Select>
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
                            min="12"
                            max="200"
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the work you did..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : editingProBonoWork
                      ? "Update"
                      : "Add Pro Bono Work"
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
            </div>

            <div className="grid gap-4">
        {proBonoWork.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No pro bono work recorded yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start tracking your volunteer work and professional services for animal welfare organizations.
              </p>
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first pro bono work
              </Button>
            </CardContent>
          </Card>
        ) : (
          proBonoWork.map((work: ProBonoWork) => (
            <Card key={work.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{work.organization}</CardTitle>
                    <CardDescription>{work.role}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
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
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {formatDate(work.dateStarted)} - {work.dateEnded ? formatDate(work.dateEnded) : "Ongoing"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Time Commitment</p>
                    <p className="font-medium">{work.hoursPerDay}h/day, {work.daysPerWeek} days/week</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Impact Level & Value</p>
                    <p className="font-medium">{work.organizationImpact} (${work.hourlyValue}/hour)</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Animals Saved</p>
                    <p className="font-medium text-green-600">{formatNumber(work.animalsSaved)}</p>
                  </div>
                </div>
                {work.description && (
                  <div className="mt-4">
                    <p className="text-muted-foreground text-sm">Description</p>
                    <p className="text-sm">{work.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}