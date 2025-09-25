import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, Trash2, Clock } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { apiRequest } from "@/lib/queryClient";

interface NewsComment {
  id: number;
  articleId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    name: string;
    role: string;
    avatar?: string;
  };
}

interface NewsCommentsProps {
  articleId: number;
  articleTitle: string;
}

export default function NewsComments({ articleId, articleTitle }: NewsCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery<NewsComment[]>({
    queryKey: [`/api/news/${articleId}/comments`],
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', `/api/news/${articleId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/news/${articleId}/comments`] });
      setNewComment("");
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest('DELETE', `/api/news/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/news/${articleId}/comments`] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      createCommentMutation.mutate(newComment);
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'moderator': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'analyst': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center space-x-3">
        <MessageSquare className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-bold text-white">
          Discussion
          {comments && comments.length > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-400">
              {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </span>
          )}
        </h3>
      </div>

      <Separator className="bg-slate-700" />

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <Textarea
            placeholder={`Share your thoughts about "${articleTitle}"...`}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="cyber-bg-input border-slate-600 text-white placeholder:text-slate-400 min-h-[100px] resize-none"
            data-testid="textarea-new-comment"
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-slate-400">
              {newComment.length > 0 && `${newComment.length} characters`}
            </span>
            <Button
              type="submit"
              disabled={!newComment.trim() || createCommentMutation.isPending}
              className="cyber-button-primary"
              data-testid="button-submit-comment"
            >
              <Send className="w-4 h-4 mr-2" />
              {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                <div className="animate-pulse">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-slate-600 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="h-4 bg-slate-600 rounded w-24"></div>
                        <div className="h-3 bg-slate-600 rounded w-16"></div>
                      </div>
                      <div className="h-4 bg-slate-600 rounded w-full"></div>
                      <div className="h-4 bg-slate-600 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-slate-800/30 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
              data-testid={`comment-${comment.id}`}
            >
              <div className="flex items-start space-x-3">
                <UserAvatar 
                  src={comment.user.avatar} 
                  name={comment.user.name} 
                  size="md"
                  data-testid={`avatar-comment-${comment.id}`}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-white">
                      {comment.user.name}
                    </span>
                    <span className="text-slate-400 text-sm">
                      @{comment.user.username}
                    </span>
                    <Badge className={`text-xs ${getRoleColor(comment.user.role)}`}>
                      {comment.user.role}
                    </Badge>
                    <div className="flex items-center space-x-1 text-slate-500 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(comment.createdAt)}</span>
                    </div>
                  </div>
                  
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>

                {/* Delete button - only show for demo purposes */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                  disabled={deleteCommentMutation.isPending}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  data-testid={`button-delete-comment-${comment.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400 text-lg">No comments yet</p>
            <p className="text-slate-500 text-sm mt-1">
              Be the first to share your thoughts about this article
            </p>
          </div>
        )}
      </div>
    </div>
  );
}