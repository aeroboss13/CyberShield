import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PublicUser } from "@shared/schema";

interface EditProfileModalProps {
  user: PublicUser;
  trigger?: React.ReactNode;
}

export default function EditProfileModal({ user, trigger }: EditProfileModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    jobTitle: user.jobTitle || "",
    bio: user.bio || "",
    location: user.location || "",
    website: user.website || "",
  });
  
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("PUT", "/api/users/current", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/current"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/stats`] });
      setOpen(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const promoteToAdminMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/auth/promote-admin", { adminCode: code });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/current"] });
      setShowAdminForm(false);
      setAdminCode("");
      toast({
        title: "Role Updated",
        description: "You have been promoted to administrator.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Invalid admin code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleAdminPromote = () => {
    if (adminCode.trim()) {
      promoteToAdminMutation.mutate(adminCode.trim());
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="cyber-button-secondary">
      <Edit className="w-4 h-4 mr-2" />
      Edit Profile
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild data-testid="button-edit-profile">
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="cyber-bg-dark border-cyber-blue max-w-lg mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Profile</DialogTitle>
          <DialogDescription className="cyber-text-dim">
            Update your profile information and settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="name" className="text-white text-sm font-medium">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="cyber-input mt-2"
                placeholder="Your full name"
                data-testid="input-name"
              />
            </div>

            <div>
              <Label htmlFor="jobTitle" className="text-white text-sm font-medium">
                Job Title
              </Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                className="cyber-input mt-2"
                placeholder="e.g., Security Analyst, Penetration Tester"
                data-testid="input-job-title"
              />
            </div>

            <div>
              <Label htmlFor="bio" className="text-white text-sm font-medium">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                className="cyber-input mt-2 min-h-[80px] resize-none"
                placeholder="Tell us about yourself..."
                maxLength={500}
                data-testid="input-bio"
              />
              <div className="text-xs cyber-text-dim mt-1 text-right">
                {formData.bio.length}/500 characters
              </div>
            </div>

            <div>
              <Label htmlFor="location" className="text-white text-sm font-medium">
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                className="cyber-input mt-2"
                placeholder="e.g., San Francisco, CA"
                data-testid="input-location"
              />
            </div>

            <div>
              <Label htmlFor="website" className="text-white text-sm font-medium">
                Website
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                className="cyber-input mt-2"
                placeholder="https://example.com"
                data-testid="input-website"
              />
            </div>
          </div>

          {/* Role Management Section */}
          <div className="border-t cyber-border pt-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label className="cyber-text-primary font-medium">Role</Label>
                <p className="text-xs cyber-text-dim mt-1">
                  Current: {user.role === 'admin' ? 'Administrator' : 'User'}
                </p>
              </div>
              {user.role !== 'admin' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdminForm(!showAdminForm)}
                  className="cyber-button-secondary text-xs"
                  data-testid="button-toggle-admin-form"
                >
                  Become Admin
                </Button>
              )}
            </div>

            {showAdminForm && (
              <div className="bg-gray-900/50 rounded-lg p-4 border cyber-border">
                <Label htmlFor="adminCode" className="cyber-text-primary text-sm">
                  Admin Access Code
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="adminCode"
                    type="password"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="Enter admin code"
                    className="cyber-input flex-1"
                    data-testid="input-admin-code"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && adminCode.trim()) {
                        e.preventDefault();
                        handleAdminPromote();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAdminPromote}
                    disabled={promoteToAdminMutation.isPending || !adminCode.trim()}
                    className="cyber-button-primary px-6"
                    data-testid="button-submit-admin-code"
                  >
                    {promoteToAdminMutation.isPending ? "Verifying..." : "Verify"}
                  </Button>
                </div>
                <p className="text-xs cyber-text-dim mt-2">
                  Enter the administrator access code to gain moderation privileges.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="cyber-button-ghost"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="cyber-button-primary"
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}