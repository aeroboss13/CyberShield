import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Paperclip, Hash } from "lucide-react";
import PostCard from "@/components/PostCard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PostWithUser } from "@/lib/types";

export default function SocialFeed() {
  const [newPostContent, setNewPostContent] = useState("");

  const { data: posts, isLoading } = useQuery<PostWithUser[]>({
    queryKey: ["/api/posts"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; userId: number; tags: string[] }) => {
      const response = await apiRequest("POST", "/api/posts", postData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewPostContent("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    // Extract hashtags from content
    const tags = Array.from(newPostContent.matchAll(/#(\w+)/g)).map(match => match[1]);

    createPostMutation.mutate({
      content: newPostContent,
      userId: 1, // Current user ID
      tags,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="cyber-bg-slate border-slate-700">
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="flex space-x-4">
                  <div className="w-12 h-12 bg-slate-600 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-600 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-600 rounded w-full"></div>
                    <div className="h-4 bg-slate-600 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post */}
      <Card className="cyber-bg-slate border-slate-700">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <div className="flex space-x-4">
              <div className="w-10 h-10 cyber-bg-blue rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium">JS</span>
              </div>
              <div className="flex-1">
                <Textarea
                  placeholder="Share your security insights..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="cyber-bg-gray text-white placeholder-slate-400 border-slate-600 resize-none min-h-24 focus:ring-cyber-blue focus:border-cyber-blue"
                />
                <div className="flex justify-between items-center mt-4">
                  <div className="flex space-x-4 text-slate-400">
                    <Paperclip className="w-5 h-5 cursor-pointer hover:text-cyber-blue transition-colors" />
                    <Hash className="w-5 h-5 cursor-pointer hover:text-cyber-blue transition-colors" />
                  </div>
                  <Button
                    type="submit"
                    disabled={!newPostContent.trim() || createPostMutation.isPending}
                    className="cyber-bg-blue hover:bg-blue-700 text-white"
                  >
                    {createPostMutation.isPending ? "Posting..." : "Post"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      {posts && posts.length > 0 ? (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      ) : (
        <Card className="cyber-bg-slate border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center text-slate-400">
              <p>No posts yet. Be the first to share some security intel!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
