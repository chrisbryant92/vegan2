import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { User, Camera, Key, Tag, X, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Form schemas
const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(50, "Display name must be under 50 characters"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const STANDARD_TAGS = ["UK", "USA", "Canada", "New Zealand", "Australia", "Europe", "Asia"];

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState("");
  const [userTags, setUserTags] = useState<string[]>(user?.tags || []);

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || user?.name || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormValues & { tags?: string[] }) => {
      const response = await apiRequest("PATCH", "/api/profile", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      refetchUser();
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePassword = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const response = await apiRequest("PATCH", "/api/change-password", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  // Upload profile photo mutation
  const uploadPhoto = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      
      const response = await fetch("/api/upload-profile-photo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Photo uploaded",
        description: "Your profile photo has been updated successfully.",
      });
      refetchUser();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate({ ...data, tags: userTags });
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    changePassword.mutate(data);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    uploadPhoto.mutate(file);
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !userTags.includes(trimmedTag) && userTags.length < 10) {
      setUserTags([...userTags, trimmedTag]);
    }
  };

  const addStandardTag = (tag: string) => {
    addTag(tag);
  };

  const addCustomTag = () => {
    if (newTag.trim()) {
      addTag(newTag);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setUserTags(userTags.filter(tag => tag !== tagToRemove));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Sidebar />
      <MobileNav />
      
      <main className="flex-grow pb-20 md:pb-6">
        <div className="p-4 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2 text-foreground flex items-center gap-2">
              <User className="h-6 w-6" />
              Profile Settings
            </h2>
            <p className="text-muted-foreground">
              Manage your account settings, display photo, and group tags.
            </p>
          </div>

          <div className="max-w-4xl">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="tags">Groups & Tags</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your display name and profile photo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Photo Section */}
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={user?.profilePhoto} />
                        <AvatarFallback className="text-lg">
                          {user?.name ? getInitials(user.name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Label htmlFor="photo-upload" className="cursor-pointer">
                          <div className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                            <Camera className="h-4 w-4" />
                            <span>Change Photo</span>
                          </div>
                        </Label>
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          disabled={uploadPhoto.isPending}
                        />
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG or GIF. Maximum file size 50MB.
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Display Name Form */}
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                      <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          {...profileForm.register("displayName")}
                          placeholder="Enter your display name"
                        />
                        {profileForm.formState.errors.displayName && (
                          <p className="text-sm text-red-500 mt-1">
                            {profileForm.formState.errors.displayName.message}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          type="submit" 
                          disabled={updateProfile.isPending}
                        >
                          {updateProfile.isPending ? "Updating..." : "Update Profile"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Change Password
                    </CardTitle>
                    <CardDescription>
                      Update your account password for better security.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          {...passwordForm.register("currentPassword")}
                          placeholder="Enter your current password"
                        />
                        {passwordForm.formState.errors.currentPassword && (
                          <p className="text-sm text-red-500 mt-1">
                            {passwordForm.formState.errors.currentPassword.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          {...passwordForm.register("newPassword")}
                          placeholder="Enter your new password"
                        />
                        {passwordForm.formState.errors.newPassword && (
                          <p className="text-sm text-red-500 mt-1">
                            {passwordForm.formState.errors.newPassword.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...passwordForm.register("confirmPassword")}
                          placeholder="Confirm your new password"
                        />
                        {passwordForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-500 mt-1">
                            {passwordForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>

                      <Button 
                        type="submit" 
                        disabled={changePassword.isPending}
                      >
                        {changePassword.isPending ? "Changing..." : "Change Password"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tags Tab */}
              <TabsContent value="tags" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Groups & Tags
                    </CardTitle>
                    <CardDescription>
                      Join groups to compare your impact with others in leaderboards. You can add up to 10 tags.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Current Tags */}
                    <div>
                      <Label className="text-sm font-medium">Your Tags ({userTags.length}/10)</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {userTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-red-500" 
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                        {userTags.length === 0 && (
                          <p className="text-sm text-muted-foreground">No tags added yet.</p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Standard Tags */}
                    <div>
                      <Label className="text-sm font-medium">Country/Region Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {STANDARD_TAGS.map((tag) => (
                          <Button
                            key={tag}
                            variant={userTags.includes(tag) ? "default" : "outline"}
                            size="sm"
                            onClick={() => addStandardTag(tag)}
                            disabled={userTags.includes(tag) || userTags.length >= 10}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Custom Tags */}
                    <div>
                      <Label className="text-sm font-medium">Custom Tag</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Create a custom tag (e.g., 'Bristol', 'Vegan Society')"
                          maxLength={30}
                          disabled={userTags.length >= 10}
                        />
                        <Button 
                          onClick={addCustomTag}
                          disabled={!newTag.trim() || userTags.length >= 10}
                          size="sm"
                        >
                          Add
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Share custom tags with friends to create private leaderboards.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => updateProfile.mutate({ 
                          displayName: profileForm.getValues("displayName"), 
                          tags: userTags 
                        })}
                        disabled={updateProfile.isPending}
                      >
                        {updateProfile.isPending ? "Saving..." : "Save Tags"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}