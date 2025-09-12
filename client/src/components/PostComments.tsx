import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Trash2, Send } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-start space-x-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-cyber-blue text-white text-sm">
              JS
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[60px] bg-slate-800 border-slate-600 text-white placeholder-slate-400 resize-none focus:border-cyber-blue"
              data-testid="textarea-new-comment"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!newComment.trim() || createCommentMutation.isPending}
                size="sm"
                className="bg-cyber-blue hover:bg-cyber-blue-hover text-white"
                data-testid="button-submit-comment"
              >
                <Send className="w-4 h-4 mr-2" />
                {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          <>
            <div className="flex items-center space-x-2 text-slate-400 text-sm">
              <MessageSquare className="w-4 h-4" />
              <span data-testid="comments-count">
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </span>
            </div>
            
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3" data-testid={`comment-${comment.id}`}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-slate-700 text-slate-300 text-sm">
                    {getInitials(comment.user.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-white text-sm">
                      {comment.user.name}
                    </span>
                    <span className="text-slate-400 text-xs">
                      @{comment.user.username}
                    </span>
                    <span className="text-slate-500 text-xs">
                      • {formatTimestamp(comment.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-slate-200 text-sm leading-relaxed">
                    {comment.content}
                  </p>
                  
                  <div className="flex items-center space-x-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      disabled={deleteCommentMutation.isPending}
                      className="text-slate-400 hover:text-red-400 p-1 h-auto"
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
            <MessageSquare className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No comments yet</p>
            <p className="text-slate-500 text-xs">Be the first to share your thoughts</p>
          </div>
        )}
      </div>
    </div>
  );
}