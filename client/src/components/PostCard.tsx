import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, Share2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PostWithUser } from "@/lib/types";

interface PostCardProps {
  post: PostWithUser;
}

export default function PostCard({ post }: PostCardProps) {
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/posts/${post.id}/like`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
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

  const getAvatarColor = (username: string) => {
    const colors = ['cyber-bg-red', 'cyber-bg-blue', 'cyber-bg-green'];
    const index = username.length % colors.length;
    return colors[index];
  };

  return (
    <Card className="social-card cyber-bg-slate border-slate-700">
      <CardContent className="pt-6">
        <div className="flex space-x-4">
          <div className={`w-12 h-12 ${getAvatarColor(post.user.username)} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-medium">{getInitials(post.user.name)}</span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-semibold text-white">{post.user.name}</span>
              <span className="text-slate-400 text-sm">@{post.user.username}</span>
              <span className="text-slate-500 text-sm">• {formatTimestamp(post.createdAt)}</span>
            </div>
            
            <p className="text-slate-200 mb-4 whitespace-pre-wrap">{post.content}</p>
            
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
            
            <div className="flex items-center space-x-6 text-slate-400">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 hover:text-cyber-blue transition-colors p-0 h-auto"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{post.comments}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => likeMutation.mutate()}
                disabled={likeMutation.isPending}
                className="flex items-center space-x-2 hover:text-red-400 transition-colors p-0 h-auto"
                data-testid={`button-like-${post.id}`}
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
