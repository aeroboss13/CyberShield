import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Hash, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PostModalProps {
  trigger?: React.ReactNode;
}

export default function PostModal({ trigger }: PostModalProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (newPost: { content: string; tags: string[] }) => {
      return apiRequest("POST", "/api/posts", newPost);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setOpen(false);
      setContent("");
      setTags([]);
      setTagInput("");
      toast({
        title: "Post Created",
        description: "Your security insight has been shared with the community.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      createPostMutation.mutate({ content: content.trim(), tags });
    }
  };

  const defaultTrigger = (
    <Button className="cyber-button-primary">
      <Plus className="w-4 h-4 mr-2" />
      New Post
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="cyber-bg-surface border cyber-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold">
            Share Security Intelligence
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              What's happening in cybersecurity?
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share threat intel, security news, vulnerability discoveries, or ask the community for advice..."
              className="cyber-input min-h-[120px] resize-none"
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs cyber-text-dim">
                {content.length}/500 characters
              </span>
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Tags (Optional)
            </label>
            <div className="flex space-x-2 mb-3">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tags like malware, phishing, incident-response..."
                className="cyber-input flex-1"
                maxLength={20}
              />
              <Button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim() || tags.length >= 5}
                className="cyber-button-secondary"
              >
                <Hash className="w-4 h-4" />
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="cyber-bg-blue text-white flex items-center space-x-1"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:cyber-text-red"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="cyber-button-outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!content.trim() || createPostMutation.isPending}
              className="cyber-button-primary"
            >
              {createPostMutation.isPending ? "Posting..." : "Share Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}