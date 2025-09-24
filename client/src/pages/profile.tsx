import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Trophy, Target, Shield, Users, MessageCircle, Heart, Calendar, MapPin, Link as LinkIcon, Edit, ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import EditProfileModal from '@/components/EditProfileModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicUser } from '@shared/schema';
import { useState } from 'react';
import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface UserStats {
  id: number;
  username: string;
  reputation: number;
  postCount: number;
  likesReceived: number;
  commentsCount: number;
  cveSubmissions: number;
  exploitSubmissions: number;
  verifiedSubmissions: number;
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

  const { data: currentUser, isLoading: userLoading } = useQuery<PublicUser>({
    queryKey: ['/api/users/current']
  });

  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: [`/api/users/${currentUser?.id}/stats`],
    enabled: !!currentUser?.id
  });

  const { data: userSubmissions = [], isLoading: submissionsLoading } = useQuery<UserSubmission[]>({
    queryKey: [`/api/users/${currentUser?.id}/submissions`],
    enabled: !!currentUser?.id
  });

  // Admin-only query for pending submissions
  const { data: pendingSubmissions = [], isLoading: pendingLoading } = useQuery<(UserSubmission & { user: PublicUser })[]>({
    queryKey: ['/api/admin/submissions/pending'],
    enabled: currentUser?.role === 'admin'
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

  if (userLoading || statsLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!currentUser || !userStats) {
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

  const getReputationLevel = (reputation: number) => {
    if (reputation >= 1000) return { level: 'Expert', color: 'bg-purple-500' };
    if (reputation >= 500) return { level: 'Advanced', color: 'bg-blue-500' };
    if (reputation >= 100) return { level: 'Intermediate', color: 'bg-green-500' };
    return { level: 'Beginner', color: 'bg-gray-500' };
  };

  const reputationLevel = getReputationLevel(userStats.reputation);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" data-testid="profile-page">
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
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24" data-testid="avatar-profile">
              <AvatarImage src={currentUser.avatar || undefined} alt={currentUser.name} />
              <AvatarFallback className="text-2xl">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-3xl font-bold" data-testid="text-name">{currentUser.name}</h1>
                    <p className="text-xl text-muted-foreground" data-testid="text-username">@{currentUser.username}</p>
                    {currentUser.jobTitle && (
                      <p className="text-sm text-muted-foreground" data-testid="text-job-title">{currentUser.jobTitle}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={`${reputationLevel.color} text-white`} data-testid="badge-reputation-level">
                    <Trophy className="w-3 h-3 mr-1" />
                    {reputationLevel.level}
                  </Badge>
                </div>
                <EditProfileModal user={currentUser} />
              </div>

              {currentUser.bio && (
                <p className="text-muted-foreground" data-testid="text-bio">{currentUser.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {currentUser.location && (
                  <div className="flex items-center gap-1" data-testid="text-location">
                    <MapPin className="w-4 h-4" />
                    {currentUser.location}
                  </div>
                )}
                {currentUser.website && (
                  <div className="flex items-center gap-1">
                    <LinkIcon className="w-4 h-4" />
                    <a 
                      href={currentUser.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                      data-testid="link-website"
                    >
                      Website
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1" data-testid="text-join-date">
                  <Calendar className="w-4 h-4" />
                  Joined {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Recently'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-testid="card-reputation">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-500" data-testid="text-reputation-value">
              {userStats.reputation.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Reputation</p>
          </CardContent>
        </Card>

        <Card data-testid="card-posts">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500" data-testid="text-posts-value">
              {userStats.postCount}
            </div>
            <p className="text-sm text-muted-foreground">Posts</p>
          </CardContent>
        </Card>

        <Card data-testid="card-likes">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500" data-testid="text-likes-value">
              {userStats.likesReceived}
            </div>
            <p className="text-sm text-muted-foreground">Likes Received</p>
          </CardContent>
        </Card>

        <Card data-testid="card-comments">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500" data-testid="text-comments-value">
              {userStats.commentsCount}
            </div>
            <p className="text-sm text-muted-foreground">Comments</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-profile">
        <TabsList className={`grid w-full ${currentUser.role === 'admin' ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions" data-testid="tab-submissions">
            Submissions ({userStats.cveSubmissions + userStats.exploitSubmissions})
          </TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
          {currentUser.role === 'admin' && (
            <TabsTrigger value="moderation" data-testid="tab-moderation" className="text-red-400">
              Moderation ({pendingSubmissions.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Contributions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-red-500" />
                    CVE Submissions
                  </span>
                  <Badge variant="secondary" data-testid="text-cve-submissions">
                    {userStats.cveSubmissions}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    Exploit Submissions
                  </span>
                  <Badge variant="secondary" data-testid="text-exploit-submissions">
                    {userStats.exploitSubmissions}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-green-500" />
                    Verified Submissions
                  </span>
                  <Badge variant="secondary" data-testid="text-verified-submissions">
                    {userStats.verifiedSubmissions}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Community Engagement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    Total Comments
                  </span>
                  <Badge variant="secondary">{userStats.commentsCount}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    Likes Received
                  </span>
                  <Badge variant="secondary">{userStats.likesReceived}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          {submissionsLoading ? (
            <div className="text-center py-8">Loading submissions...</div>
          ) : userSubmissions.length > 0 ? (
            <div className="space-y-4">
              {userSubmissions.map((submission) => (
                <Card key={submission.id} data-testid={`card-submission-${submission.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg" data-testid={`text-submission-title-${submission.id}`}>
                        {submission.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={submission.type === 'vulnerability' ? 'destructive' : 'default'}
                          data-testid={`badge-submission-type-${submission.id}`}
                        >
                          {submission.type}
                        </Badge>
                        <Badge 
                          variant={
                            submission.status === 'approved' ? 'default' : 
                            submission.status === 'rejected' ? 'destructive' : 'secondary'
                          }
                          data-testid={`badge-submission-status-${submission.id}`}
                        >
                          {submission.status}
                        </Badge>
                        {submission.verified && (
                          <Badge variant="outline" className="text-green-600" data-testid={`badge-verified-${submission.id}`}>
                            <Trophy className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription data-testid={`text-submission-description-${submission.id}`}>
                      {submission.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span data-testid={`text-submission-date-${submission.id}`}>
                        Submitted {new Date(submission.createdAt).toLocaleDateString()}
                      </span>
                      {submission.severity && (
                        <Badge variant="outline" data-testid={`badge-severity-${submission.id}`}>
                          {submission.severity}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground" data-testid="text-no-submissions">
                  No submissions yet. Start contributing to the security community!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Activity timeline coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Moderation Panel */}
        {currentUser.role === 'admin' && (
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