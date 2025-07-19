import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Vote, MapPin, Flame, TrendingUp, Medal, Star, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CreateIssueModal from '@/components/CreateIssueModal';
import IssueCard from '@/components/IssueCard';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatNumber } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import type { AnalyticsData, HotIssue, UserWithStats, UserActivityItem, IssueWithDetails } from '@/lib/types';

export default function Dashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { lastMessage } = useWebSocket();

  // Fetch dashboard data
  const { data: analytics, refetch: refetchAnalytics } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics/dashboard'],
  });

  const { data: hotIssues, refetch: refetchHotIssues } = useQuery<HotIssue[]>({
    queryKey: ['/api/issues/hot'],
  });

  const { data: userProfile } = useQuery<UserWithStats>({
    queryKey: ['/api/user/profile'],
  });

  const { data: userActivity } = useQuery<UserActivityItem[]>({
    queryKey: ['/api/user/activity'],
  });

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'new_issue':
        case 'vote_update':
        case 'status_update':
          refetchAnalytics();
          refetchHotIssues();
          break;
      }
    }
  }, [lastMessage, refetchAnalytics, refetchHotIssues]);

  const handleCreateIssue = async (data: any, files: FileList | null) => {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });

    if (files) {
      Array.from(files).forEach((file) => {
        formData.append('media', file);
      });
    }

    await apiRequest('POST', '/api/issues', formData);
    refetchAnalytics();
    refetchHotIssues();
  };

  const handleVote = async (issueId: number, rating: number) => {
    await apiRequest('POST', `/api/issues/${issueId}/vote`, { rating });
    refetchHotIssues();
  };

  const handleShare = (issue: any) => {
    if (navigator.share) {
      navigator.share({
        title: issue.title,
        text: issue.description,
        url: window.location.href,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(
        `${issue.title}\n\n${issue.description}\n\nView on CivicPulse: ${window.location.href}`
      );
    }
  };

  const stats = analytics?.issueStats || {
    totalIssues: 0,
    resolvedIssues: 0,
    inProgressIssues: 0,
    pendingIssues: 0,
    averageResolutionTime: 0,
  };
  const userStats = analytics?.userStats || {
    issuesRaised: 0,
    votescast: 0,
    votesCast: 0,
    commentsposted: 0,
    badgesEarned: 0,
    issuesResolved: 0,
  };

  return (
    <div className="space-y-8">
      {/* Hero Section with Quick Stats */}
      <div className="civic-blue-gradient rounded-xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold">{formatNumber(stats.totalIssues || 0)}</div>
            <div className="text-blue-100">Total Issues</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{formatNumber(stats.resolvedIssues || 0)}</div>
            <div className="text-blue-100">Resolved</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{formatNumber(15432)}</div>
            <div className="text-blue-100">Active Voters</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{userStats.issuesRaised || 0}</div>
            <div className="text-blue-100">My Contributions</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-blue-500">
          <CardContent className="p-6" onClick={() => setShowCreateModal(true)}>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Plus className="text-blue-600 h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Raise New Issue</h3>
                <p className="text-sm text-gray-500">Report a problem in your area</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Vote className="text-green-600 h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Vote on Issues</h3>
                <p className="text-sm text-gray-500">Voice your opinion on local problems</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <MapPin className="text-orange-600 h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Explore Map</h3>
                <p className="text-sm text-gray-500">View issues in your locality</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hot Issues Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-red-500" />
              <span>Hot Zone Issues</span>
            </CardTitle>
            <Badge variant="destructive">20%+ Support</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hotIssues && Array.isArray(hotIssues) && hotIssues.length > 0 ? (
            hotIssues.slice(0, 3).map((issue: HotIssue) => (
              <IssueCard
                key={issue.id}
                issue={issue as IssueWithDetails}
                onVote={(rating) => handleVote(issue.id, rating)}
                onShare={() => handleShare(issue)}
                compact
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Flame className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hot issues in your area right now</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity and User Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Your Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userActivity && Array.isArray(userActivity) && userActivity.length > 0 ? (
              userActivity.slice(0, 5).map((activity: UserActivityItem, index: number) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-green-100 p-2 rounded-full">
                    {activity.activityType === 'vote_cast' ? (
                      <Vote className="h-4 w-4 text-green-600" />
                    ) : activity.activityType === 'issue_created' ? (
                      <Plus className="h-4 w-4 text-blue-600" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {activity.activityType === 'vote_cast' && 'Voted on an issue'}
                      {activity.activityType === 'issue_created' && 'Created new issue'}
                      {activity.activityType === 'comment_added' && 'Added comment'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Impact */}
        <Card>
          <CardHeader>
            <CardTitle>Your Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Issues Raised</span>
              <span className="font-semibold">{userStats.issuesRaised || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Votes Cast</span>
              <span className="font-semibold">{userStats.votesCast || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Issues Resolved</span>
              <span className="font-semibold text-green-600">{userStats.issuesResolved || 0}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center space-x-2">
                {userStats.issuesRaised >= 5 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <Medal className="h-3 w-3 mr-1" />
                    Voice Hero
                  </Badge>
                )}
                {userStats.votesCast >= 100 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Star className="h-3 w-3 mr-1" />
                    Top Contributor
                  </Badge>
                )}
                {userStats.issuesResolved >= 3 && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Problem Solver
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Issue Modal */}
      <CreateIssueModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateIssue}
      />
    </div>
  );
}
