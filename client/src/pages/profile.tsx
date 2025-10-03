import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Trophy, Target, Shield, Calendar, MapPin, Link as LinkIcon, ArrowLeft, CheckCircle, XCircle, Clock, MessageCircle, Heart, Paperclip } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import EditProfileModal from '@/components/EditProfileModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicUser } from '@shared/schema';
import { useState } from 'react';
import { Link, useRoute } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import SocialFeed from '@/components/SocialFeed';
import PostCard from '@/components/PostCard';
import type { PostWithUser } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';

interface UserStats {
  id: number;
  username: string;
  reputation: number;
  reputationLevel: string;
  postCount: number;
  likesReceived: number;
  commentsCount: number;
  cveSubmissions: number;
  exploitSubmissions: number;
  verifiedSubmissions: number;
  totalSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  pendingSubmissions: number;
  recentActivity: {
    lastLogin: string | null;
    lastSubmission: string | null;
    lastPost: string | null;
  };
}

interface UserSubmission {
  id: number;
  type: 'vulnerability' | 'exploit';
  title: string;
  description: string;
  severity?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  verified: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get user ID from URL params if viewing another user's profile
  const [match, params] = useRoute('/profile/:userId?');
  const targetUserId = params?.userId ? parseInt(params.userId) : null;

  const { data: currentUser, isLoading: userLoading } = useQuery<PublicUser>({
    queryKey: ['/api/users/current'],
    retry: false,
    throwOnError: false
  });

  // Determine if we're viewing our own profile or someone else's
  const isOwnProfile = !targetUserId && !!currentUser;

  // Get target user data (either current user or specified user)
  const { data: targetUser, isLoading: targetUserLoading } = useQuery<PublicUser>({
    queryKey: [`/api/users/${targetUserId || currentUser?.id || 'current'}`],
    enabled: !!(targetUserId || currentUser?.id)
  });

  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: [`/api/users/${targetUser?.id}/stats`],
    enabled: !!targetUser?.id
  });

  const { data: userSubmissions = [], isLoading: submissionsLoading } = useQuery<UserSubmission[]>({
    queryKey: [`/api/users/${targetUser?.id}/submissions`],
    enabled: !!targetUser?.id
  });

  // Admin-only query for pending submissions (only for current user)
  const { data: pendingSubmissions = [], isLoading: pendingLoading } = useQuery<(UserSubmission & { user: PublicUser })[]>({
    queryKey: ['/api/admin/submissions/pending'],
    enabled: currentUser?.role === 'admin' && isOwnProfile && !!currentUser, // Only show moderation for current user
    retry: false,
    throwOnError: false
  });

  // Admin moderation mutations
  const approveMutation = useMutation({
    mutationFn: async ({ id, reviewNotes }: { id: number; reviewNotes?: string }) => {
      const response = await apiRequest("POST", `/api/admin/submissions/${id}/approve`, { reviewNotes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/submissions/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      toast({
        title: "Submission Approved",
        description: "The submission has been approved and published.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve submission. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reviewNotes }: { id: number; reviewNotes?: string }) => {
      const response = await apiRequest("POST", `/api/admin/submissions/${id}/reject`, { reviewNotes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/submissions/pending'] });
      toast({
        title: "Submission Rejected",
        description: "The submission has been rejected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject submission. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (targetUserLoading || statsLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!targetUser || !userStats) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">User profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }



  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6" data-testid="profile-page">
      {/* Back Button */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard">
          <Button variant="outline" className="cyber-button-secondary" data-testid="button-back-profile">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back')}
          </Button>
        </Link>
      </div>
      {/* Profile Header */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          {/* Mobile: Stack vertically */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <UserAvatar 
              src={targetUser.avatar} 
              name={targetUser.name} 
              size="xl"
              data-testid="avatar-profile"
            />
            
            <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-name">{targetUser.name}</h1>
                    <p className="text-lg sm:text-xl text-muted-foreground" data-testid="text-username">@{targetUser.username}</p>
                    {targetUser.jobTitle && (
                      <p className="text-sm text-muted-foreground" data-testid="text-job-title">{targetUser.jobTitle}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-center sm:justify-end">
                  {isOwnProfile && currentUser && <EditProfileModal user={targetUser} />}
                </div>
              </div>

              {targetUser.bio && (
                <p className="text-muted-foreground" data-testid="text-bio">{targetUser.bio}</p>
              )}

              <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-sm text-muted-foreground">
                {targetUser.location && (
                  <div className="flex items-center gap-1" data-testid="text-location">
                    <MapPin className="w-4 h-4" />
                    <span className="break-all">{targetUser.location}</span>
                  </div>
                )}
                {targetUser.website && (
                  <div className="flex items-center gap-1">
                    <LinkIcon className="w-4 h-4" />
                    <a 
                      href={targetUser.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline break-all"
                      data-testid="link-website"
                    >
                      Website
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1" data-testid="text-join-date">
                  <Calendar className="w-4 h-4" />
                  Joined {targetUser.createdAt ? new Date(targetUser.createdAt).toLocaleDateString() : 'Recently'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-profile">
        {/* Mobile: Horizontal scroll tabs */}
        <div className="sm:hidden">
          <TabsList className="h-auto p-1">
            <div className="flex space-x-1 overflow-x-auto pb-1 scrollbar-hide">
              <TabsTrigger value="overview" data-testid="tab-overview" className="flex-shrink-0 text-sm px-3 py-2">
                Overview
              </TabsTrigger>
              <TabsTrigger value="posts" data-testid="tab-posts" className="flex-shrink-0 text-sm px-3 py-2">
                Posts
              </TabsTrigger>
              {currentUser?.role === 'admin' && isOwnProfile && currentUser && (
                <TabsTrigger value="moderation" data-testid="tab-moderation" className="flex-shrink-0 text-sm px-3 py-2 text-red-400 whitespace-nowrap">
                  Moderation ({pendingSubmissions.length})
                </TabsTrigger>
              )}
            </div>
          </TabsList>
        </div>
        
        {/* Desktop: Full width tabs */}
        <TabsList className={`hidden sm:grid w-full ${currentUser?.role === 'admin' && isOwnProfile && currentUser ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="posts" data-testid="tab-posts">Posts</TabsTrigger>
          {currentUser?.role === 'admin' && isOwnProfile && currentUser && (
            <TabsTrigger value="moderation" data-testid="tab-moderation" className="text-red-400">
              Moderation ({pendingSubmissions.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Reputation & Activity Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Reputation & Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg">
                  <div>
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {userStats.reputation.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Reputation Points</div>
                  </div>
                  <Badge variant="outline" className="bg-purple-500 text-white">
                    {userStats.reputationLevel}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-500">{userStats.totalSubmissions}</div>
                    <div className="text-xs text-muted-foreground">Total Submissions</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-500">{userStats.approvedSubmissions}</div>
                    <div className="text-xs text-muted-foreground">Approved</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Login</span>
                  <span className="text-sm font-medium">
                    {userStats.recentActivity.lastLogin 
                      ? new Date(userStats.recentActivity.lastLogin).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Submission</span>
                  <span className="text-sm font-medium">
                    {userStats.recentActivity.lastSubmission 
                      ? new Date(userStats.recentActivity.lastSubmission).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Post</span>
                  <span className="text-sm font-medium">
                    {userStats.recentActivity.lastPost 
                      ? new Date(userStats.recentActivity.lastPost).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Contributions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Contributions
              </CardTitle>
              <CardDescription>
                Your contributions to the cybersecurity community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <Target className="w-8 h-8 text-red-500 mb-2" />
                  <div className="text-2xl font-bold text-red-500" data-testid="text-cve-submissions-overview">
                    {userStats.cveSubmissions}
                  </div>
                  <div className="text-sm text-muted-foreground text-center">CVE Submissions</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Shield className="w-8 h-8 text-blue-500 mb-2" />
                  <div className="text-2xl font-bold text-blue-500" data-testid="text-exploit-submissions-overview">
                    {userStats.exploitSubmissions}
                  </div>
                  <div className="text-sm text-muted-foreground text-center">Exploit Submissions</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <Trophy className="w-8 h-8 text-green-500 mb-2" />
                  <div className="text-2xl font-bold text-green-500" data-testid="text-verified-submissions-overview">
                    {userStats.verifiedSubmissions}
                  </div>
                  <div className="text-sm text-muted-foreground text-center">Verified Submissions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Engagement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Community Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-xl font-bold text-blue-500">{userStats.postCount}</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <div className="text-xl font-bold text-red-500">{userStats.likesReceived}</div>
                  <div className="text-sm text-muted-foreground">Likes Received</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <div className="text-xl font-bold text-green-500">{userStats.commentsCount}</div>
                  <div className="text-sm text-muted-foreground">Comments</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          {/* Create Post Form - only for own profile */}
          {isOwnProfile && currentUser && (
            <CreatePrivatePost userId={targetUser.id} />
          )}
          <UserPostsFeed userId={targetUser.id} />
        </TabsContent>

        {/* Admin Moderation Panel */}
        {currentUser?.role === 'admin' && isOwnProfile && currentUser && (
          <TabsContent value="moderation" className="space-y-4">
            <div className="bg-red-950/10 border border-red-900/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-red-300">Administrator Moderation Panel</h3>
              </div>
              <p className="text-sm text-red-200/80">
                Review and moderate user submissions. Approved submissions will be published to the public feed.
              </p>
            </div>

            {pendingLoading ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Loading pending submissions...</p>
              </div>
            ) : pendingSubmissions.length > 0 ? (
              <div className="space-y-4">
                {pendingSubmissions.map((submission) => (
                  <Card key={submission.id} className="border-yellow-900/30 bg-yellow-950/10" data-testid={`moderation-card-${submission.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-yellow-200" data-testid={`moderation-title-${submission.id}`}>
                            {submission.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                              {submission.type}
                            </Badge>
                            {submission.severity && (
                              <Badge variant="outline" className="text-orange-400 border-orange-400">
                                {submission.severity}
                              </Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                              by @{submission.user?.username}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-300">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending Review
                        </Badge>
                      </div>
                      <CardDescription className="text-yellow-100/80" data-testid={`moderation-description-${submission.id}`}>
                        {submission.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Submitted {new Date(submission.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-400 border-red-400 hover:bg-red-950"
                            onClick={() => rejectMutation.mutate({ id: submission.id, reviewNotes: "Rejected by moderator" })}
                            disabled={rejectMutation.isPending || approveMutation.isPending}
                            data-testid={`button-reject-${submission.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => approveMutation.mutate({ id: submission.id, reviewNotes: "Approved by moderator" })}
                            disabled={rejectMutation.isPending || approveMutation.isPending}
                            data-testid={`button-approve-${submission.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {approveMutation.isPending ? "Approving..." : "Approve"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                  <p className="text-muted-foreground">
                    No submissions pending moderation at this time.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// Component for displaying user's posts
interface UserPostsFeedProps {
  userId: number;
}

function UserPostsFeed({ userId }: UserPostsFeedProps) {
  const { data: posts, isLoading } = useQuery<PostWithUser[]>({
    queryKey: [`/api/users/${userId}/posts?type=private`],
  });

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

  if (posts && posts.length === 0) {
    return (
      <Card className="cyber-bg-slate border-slate-700">
        <CardContent className="pt-6">
          <div className="text-center text-slate-400">
            <p>No posts yet. This user hasn't posted anything yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {posts && posts.map((post) => <PostCard key={post.id} post={post} />)}
    </div>
  );
}

// Component for creating private posts in profile
interface CreatePrivatePostProps {
  userId: number;
}

function CreatePrivatePost({ userId }: CreatePrivatePostProps) {
  const [newPostContent, setNewPostContent] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const { t } = useLanguage();
  const { toast } = useToast();

  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; userId: number; type: string; tags: string[]; attachments: string[] }) => {
      const response = await apiRequest("POST", "/api/posts", postData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/posts?type=private`] });
      setNewPostContent("");
      setAttachedFiles([]);
      toast({
        title: "Post Created",
        description: "Your private post has been created successfully.",
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
      userId,
      type: "private", // Private posts for profile
      tags,
      attachments,
    });
  };

  return (
    <Card className="cyber-bg-surface border cyber-border">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="flex space-x-4">
            <div className="w-10 h-10 cyber-bg-blue rounded-full flex items-center justify-center flex-shrink-0">
              <span className="cyber-text font-medium">
                {userId ? 'P' : 'U'}
              </span>
            </div>
            <div className="flex-1">
              <Textarea
                placeholder="Share something personal..."
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
                    id="file-upload-private"
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
                    onClick={() => document.getElementById('file-upload-private')?.click()}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  type="submit"
                  disabled={!newPostContent.trim() || createPostMutation.isPending}
                  className="cyber-button-primary"
                >
                  {createPostMutation.isPending ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}