import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, Share2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "../contexts/LanguageContext";
import type { PostWithUser } from "@/lib/types";
import type { PublicUser } from "@shared/schema";
import PostComments from "./PostComments";

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
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error) => {
      console.error('Like failed:', error);
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
          <div className={`w-12 h-12 ${getAvatarColor(post.user.username)} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className="cyber-text font-medium">{getInitials(post.user.name)}</span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-semibold cyber-text">{post.user.name}</span>
              <span className="cyber-text-muted text-sm">@{post.user.username}</span>
              <span className="cyber-text-dim text-sm">• {formatTimestamp(post.createdAt)}</span>
            </div>
            
            <div className="cyber-text mb-4 whitespace-pre-wrap">
              {renderPostContent(post.content)}
            </div>
            
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
              
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 hover:text-cyber-blue transition-colors p-0 h-auto"
              >
                <Share2 className="w-5 h-5" />
                <span>{post.shares}</span>
              </Button>
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
