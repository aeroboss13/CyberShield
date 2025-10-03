import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "../contexts/LanguageContext";
import { UserAvatar } from "@/components/UserAvatar";
import type { PostWithUser } from "@/lib/types";
import type { PublicUser } from "@shared/schema";
import PostComments from "./PostComments";
import { Link } from "wouter";

interface PostCardProps {
  post: PostWithUser;
}

export default function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const { t } = useLanguage();

  // Check if user is authenticated
  const { data: currentUser, error } = useQuery<PublicUser>({
    queryKey: ["/api/users/current"],
    retry: false,
    throwOnError: false
  });
  const isAuthenticated = !error && currentUser;

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/posts/${post.id}/like`);
      if (!response.ok) {
        throw new Error("Failed to like post");
      }
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      // Invalidate activity stats for current user to update sidebar 
      queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser?.id, "activity"] });
    },
    onError: (error) => {
      console.error('Like failed:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/admin/posts/${post.id}`);
      if (!response.ok) {
        throw new Error("Failed to delete post");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error) => {
      console.error('Delete failed:', error);
    }
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getSeverityColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'critical':
      case 'cve':
      case 'exploit':
      case 'emotet':
        return 'bg-red-500/20 text-red-400';
      case 'malware':
      case 'rce':
        return 'bg-red-500/20 text-red-400';
      case 'threatintel':
      case 'apt':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  // Function to render post content with highlighted hashtags
  const renderPostContent = (content: string) => {
    const parts = content.split(/(#[\w\u0400-\u04FF]+)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        const hashtag = part.substring(1);
        return (
          <span 
            key={index} 
            className={`inline-block px-2 py-1 text-xs font-medium rounded-full mr-1 ${getSeverityColor(hashtag)}`}
          >
            #{hashtag}
          </span>
        );
      }
      return part;
    });
  };

  const getAvatarColor = (username: string) => {
    const colors = ['cyber-bg-red', 'cyber-bg-blue', 'cyber-bg-green'];
    const index = username.length % colors.length;
    return colors[index];
  };

  return (
    <Card className="social-card cyber-bg-surface border cyber-border">
      <CardContent className="pt-6">
        <div className="flex space-x-4">
          <Link href={`/profile/${post.user.id}`}>
            <div className="cursor-pointer hover:opacity-80 transition-opacity">
              <UserAvatar 
                src={post.user.avatar} 
                name={post.user.name} 
                size="lg"
                data-testid={`avatar-post-${post.id}`}
              />
            </div>
          </Link>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Link href={`/profile/${post.user.id}`}>
                <span className="font-semibold cyber-text hover:text-cyber-blue cursor-pointer transition-colors">{post.user.name}</span>
              </Link>
              <Link href={`/profile/${post.user.id}`}>
                <span className="cyber-text-muted text-sm hover:text-cyber-blue cursor-pointer transition-colors">@{post.user.username}</span>
              </Link>
              <span className="cyber-text-dim text-sm">• {formatTimestamp(post.createdAt)}</span>
            </div>
            
            <div className="cyber-text mb-4 whitespace-pre-wrap">
              {renderPostContent(post.content)}
            </div>
            
            {/* Show attached images */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="grid gap-2 mb-4 max-w-full">
                {post.attachments.length === 1 ? (
                  <div className="w-full max-w-md">
                    <img 
                      src={post.attachments[0]} 
                      alt="Attached image" 
                      className="w-full h-auto rounded-lg border cyber-border object-cover max-h-96"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-w-md">
                    {post.attachments.map((attachment, index) => (
                      <img 
                        key={index}
                        src={attachment} 
                        alt={`Attached image ${index + 1}`} 
                        className="w-full h-32 rounded-lg border cyber-border object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(tag)}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex items-center space-x-6 cyber-text-muted">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center space-x-2 transition-colors p-0 h-auto ${
                  showComments 
                    ? 'text-cyber-blue hover:text-cyber-blue' 
                    : 'hover:text-cyber-blue'
                }`}
                data-testid={`button-comment-${post.id}`}
              >
                <MessageCircle className="w-5 h-5" />
                <span>{post.comments}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => isAuthenticated ? likeMutation.mutate() : null}
                disabled={likeMutation.isPending || !isAuthenticated}
                className={`flex items-center space-x-2 transition-colors p-0 h-auto ${
                  isAuthenticated 
                    ? 'hover:text-red-400 cursor-pointer' 
                    : 'cursor-not-allowed opacity-60'
                }`}
                data-testid={`button-like-${post.id}`}
                title={!isAuthenticated ? t('posts.like.tooltip') : ""}
              >
                <Heart className="w-5 h-5" />
                <span>{post.likes}</span>
              </Button>
              
              {/* Admin delete button */}
              {currentUser?.role === 'admin' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this post?')) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="flex items-center space-x-2 transition-colors p-0 h-auto hover:text-red-500 cursor-pointer"
                  data-testid={`button-delete-${post.id}`}
                  title="Delete post (Admin only)"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              
            </div>
            
            {/* Comments Section */}
            {showComments && (
              <div className="mt-6 pt-4 border-t cyber-border">
                <PostComments postId={post.id} />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
