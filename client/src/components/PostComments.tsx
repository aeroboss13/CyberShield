import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Trash2, Send, LogIn, UserPlus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PublicUser } from "@shared/schema";

// Define PostComment type based on our schema
type PostComment = {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    username: string;
    name: string;
  };
};

interface PostCommentsProps {
  postId: number;
  shouldFocus?: boolean;
}

export default function PostComments({ postId, shouldFocus = false }: PostCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const { t } = useLanguage();

  // Check if user is authenticated
  const { data: currentUser, error } = useQuery<PublicUser>({
    queryKey: ["/api/users/current"],
    retry: false,
    throwOnError: false
  });
  const isAuthenticated = !error && currentUser;

  const { data: comments, isLoading } = useQuery<PostComment[]>({
    queryKey: [`/api/posts/${postId}/comments`],
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', `/api/posts/${postId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewComment("");
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest('DELETE', `/api/posts/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      createCommentMutation.mutate(newComment.trim());
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex space-x-3 animate-pulse">
            <div className="w-8 h-8 bg-slate-700 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-700 rounded w-24"></div>
              <div className="h-3 bg-slate-700 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="post-comments-section">
      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-start space-x-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-cyber-blue cyber-text text-sm">
                {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px] cyber-bg-surface-light border cyber-border cyber-text placeholder-gray-400 resize-none focus:border-cyber-blue"
                data-testid="textarea-new-comment"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                  size="sm"
                  className="cyber-button-primary"
                  data-testid="button-submit-comment"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {createCommentMutation.isPending ? "Posting..." : t('comment')}
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 space-y-3 cyber-bg-surface-light rounded-lg border cyber-border">
          <div>
            <h4 className="cyber-text font-medium">
              {t('sign.in.to.access')}
            </h4>
            <p className="cyber-text-muted text-sm mt-1">
              {t('login')} или {t('register')} чтобы оставлять комментарии
            </p>
          </div>
          <div className="flex justify-center space-x-3">
            <Button size="sm" className="cyber-button-primary" onClick={() => window.location.href = '/login'}>
              <LogIn className="w-4 h-4 mr-1" />
              {t('sign.in')}
            </Button>
            <Button variant="outline" size="sm" className="cyber-button-secondary" onClick={() => window.location.href = '/register'}>
              <UserPlus className="w-4 h-4 mr-1" />
              {t('register')}
            </Button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          <>
            <div className="flex items-center space-x-2 cyber-text-muted text-sm">
              <MessageSquare className="w-4 h-4" />
              <span data-testid="comments-count">
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </span>
            </div>
            
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3" data-testid={`comment-${comment.id}`}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="cyber-bg-surface-light cyber-text text-sm">
                    {getInitials(comment.user.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium cyber-text text-sm">
                      {comment.user.name}
                    </span>
                    <span className="cyber-text-muted text-xs">
                      @{comment.user.username}
                    </span>
                    <span className="cyber-text-dim text-xs">
                      • {formatTimestamp(comment.createdAt)}
                    </span>
                  </div>
                  
                  <p className="cyber-text text-sm leading-relaxed">
                    {comment.content}
                  </p>
                  
                  <div className="flex items-center space-x-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      disabled={deleteCommentMutation.isPending}
                      className="cyber-text-muted hover:text-red-400 p-1 h-auto"
                      data-testid={`button-delete-${comment.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 cyber-text-dim mx-auto mb-2" />
            <p className="cyber-text-muted text-sm">No comments yet</p>
            <p className="cyber-text-dim text-xs">Be the first to share your thoughts</p>
          </div>
        )}
      </div>
    </div>
  );
}