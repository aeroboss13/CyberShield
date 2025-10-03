import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Shield, MessageCircle, Heart, Clock, TrendingUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

interface UserStatsProps {
  userId: number;
  compact?: boolean;
}

export default function UserStats({ userId, compact = false }: UserStatsProps) {
  const { data: userStats, isLoading } = useQuery<UserStats>({
    queryKey: [`/api/users/${userId}/stats`],
    enabled: !!userId
  });

  if (isLoading) {
    return (
      <Card className={compact ? "w-full" : "w-full max-w-4xl"}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userStats) {
    return null;
  }

  const getReputationColor = (level: string) => {
    switch (level) {
      case 'Expert': return 'bg-purple-500';
      case 'Advanced': return 'bg-blue-500';
      case 'Intermediate': return 'bg-green-500';
      case 'Contributor': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium">{userStats.reputation.toLocaleString()}</span>
          <Badge variant="outline" className={`${getReputationColor(userStats.reputationLevel)} text-white text-xs`}>
            {userStats.reputationLevel}
          </Badge>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>{userStats.totalSubmissions} submissions</span>
          <span>{userStats.postCount} posts</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          User Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reputation Section */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {userStats.reputation.toLocaleString()}
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Reputation Points</div>
              <Badge variant="outline" className={`${getReputationColor(userStats.reputationLevel)} text-white`}>
                {userStats.reputationLevel}
              </Badge>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>Last login: {formatDate(userStats.recentActivity.lastLogin)}</div>
            <div>Last activity: {formatDate(userStats.recentActivity.lastSubmission || userStats.recentActivity.lastPost)}</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Security Contributions */}
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-4 text-center">
              <Target className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-500">{userStats.cveSubmissions}</div>
              <div className="text-xs text-muted-foreground">CVE Reports</div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 text-center">
              <Shield className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-500">{userStats.exploitSubmissions}</div>
              <div className="text-xs text-muted-foreground">Exploits</div>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-500">{userStats.verifiedSubmissions}</div>
              <div className="text-xs text-muted-foreground">Verified</div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-500">{userStats.approvedSubmissions}</div>
              <div className="text-xs text-muted-foreground">Approved</div>
            </CardContent>
          </Card>
        </div>

        {/* Community Engagement */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <MessageCircle className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-xl font-bold">{userStats.postCount}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <div className="text-xl font-bold">{userStats.likesReceived}</div>
              <div className="text-xs text-muted-foreground">Likes Received</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <MessageCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-xl font-bold">{userStats.commentsCount}</div>
              <div className="text-xs text-muted-foreground">Comments</div>
            </CardContent>
          </Card>
        </div>

        {/* Submission Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-xl font-bold text-yellow-500">{userStats.pendingSubmissions}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-xl font-bold text-green-500">{userStats.approvedSubmissions}</div>
              <div className="text-xs text-muted-foreground">Approved</div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-4 text-center">
              <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <div className="text-xl font-bold text-red-500">{userStats.rejectedSubmissions}</div>
              <div className="text-xs text-muted-foreground">Rejected</div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
