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
    role: user.role || "",
    bio: user.bio || "",
    location: user.location || "",
    website: user.website || "",
  });
  
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
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
      <DialogContent className="cyber-bg-dark border-cyber-blue max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Profile</DialogTitle>
          <DialogDescription className="cyber-text-dim">
            Update your profile information and settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
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
              <Label htmlFor="role" className="text-white text-sm font-medium">
                Role
              </Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                className="cyber-input mt-2"
                placeholder="e.g., Security Analyst, Penetration Tester"
                data-testid="input-role"
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