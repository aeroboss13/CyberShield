import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Paperclip, UserPlus, LogIn } from "lucide-react";
import PostCard from "@/components/PostCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PostWithUser } from "@/lib/types";
import type { PublicUser } from "@shared/schema";

export default function SocialFeed() {
  const [newPostContent, setNewPostContent] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const { t } = useLanguage();

  // Check if user is authenticated
  const { data: currentUser, error } = useQuery<PublicUser>({
    queryKey: ["/api/users/current"],
    retry: false,
    throwOnError: false
  });
  const isAuthenticated = !error && currentUser;

  const { data: posts, isLoading } = useQuery<PostWithUser[]>({
    queryKey: ["/api/posts"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; userId: number; tags: string[]; attachments: string[] }) => {
      const response = await apiRequest("POST", "/api/posts", postData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewPostContent("");
      setAttachedFiles([]);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    // Extract hashtags from content (support Cyrillic characters)
    const tags = Array.from(newPostContent.matchAll(/#([\w\u0400-\u04FF]+)/g)).map(match => match[1]);

    // Convert files to base64
    const attachments: string[] = [];
    for (const file of attachedFiles) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        attachments.push(base64);
      }
    }

    createPostMutation.mutate({
      content: newPostContent,
      userId: 1, // Current user ID
      tags,
      attachments,
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
      <Card className="cyber-bg-surface border cyber-border">
        <CardContent className="pt-6">
          {isAuthenticated ? (
            <form onSubmit={handleSubmit}>
              <div className="flex space-x-4">
                <div className="w-10 h-10 cyber-bg-blue rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="cyber-text font-medium">
                    {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <Textarea
                    placeholder="Share your security insights..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="cyber-bg-surface-light cyber-text placeholder-gray-400 border cyber-border resize-none min-h-24 focus:ring-cyber-blue focus:border-cyber-blue"
                  />
                  {/* Show attached files */}
                  {attachedFiles.length > 0 && (
                    <div className="mt-3 p-2 bg-cyber-surface-light rounded-lg border cyber-border">
                      <p className="text-xs cyber-text-muted mb-2">Прикрепленные файлы:</p>
                      <div className="space-y-1">
                        {attachedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between text-xs cyber-text">
                            <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                            <button 
                              type="button"
                              onClick={() => setAttachedFiles(files => files.filter((_, i) => i !== index))}
                              className="text-red-400 hover:text-red-300"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex space-x-2">
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            const newFiles = Array.from(e.target.files);
                            setAttachedFiles(prev => [...prev, ...newFiles]);
                          }
                        }}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="p-1 h-8 w-8"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      type="submit"
                      disabled={!newPostContent.trim() || createPostMutation.isPending}
                      className="cyber-button-primary"
                    >
                      {createPostMutation.isPending ? "Posting..." : t('post')}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 cyber-bg-surface-light rounded-full flex items-center justify-center mx-auto">
                <UserPlus className="w-8 h-8 cyber-text-muted" />
              </div>
              <div>
                <h3 className="font-bold cyber-text text-lg mb-2">
                  {t('sign.in.to.access')}
                </h3>
                <p className="cyber-text-muted text-sm">
                  {t('login')} или {t('register')} чтобы делиться информацией о безопасности с сообществом
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                <Button className="cyber-button-primary" onClick={() => window.location.href = '/login'}>
                  <LogIn className="w-4 h-4 mr-2" />
                  {t('sign.in')}
                </Button>
                <Button variant="outline" className="cyber-button-secondary" onClick={() => window.location.href = '/register'}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t('create.account')}
                </Button>
              </div>
            </div>
          )}
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
