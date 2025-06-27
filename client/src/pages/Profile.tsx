import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Edit, 
  Shield, 
  Medal, 
  Star, 
  CheckCircle, 
  Plus, 
  Vote, 
  TrendingUp,
  Calendar,
  MapPin,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { formatTimeAgo, getCategoryColor, getStatusColor, getStatusText } from '@/lib/utils';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user profile data
  const { data: userProfile } = useQuery({
    queryKey: ['/api/user/profile'],
  });

  const { data: userActivity } = useQuery({
    queryKey: ['/api/user/activity'],
  });

  const { data: userBadges } = useQuery({
    queryKey: ['/api/user/badges'],
  });

  const { data: userIssues } = useQuery({
    queryKey: ['/api/issues', { createdBy: userProfile?.id }],
  });

  const userStats = userProfile?._count || {};
  const user = userProfile || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile Info */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200" />
                <AvatarFallback className="text-lg">
                  {user.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'RK'}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-gray-900">
                {user.name || 'Rajesh Kumar'}
              </h2>
              <p className="text-gray-600">
                {user.address || 'Koramangala, Bangalore'}
              </p>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Shield className="h-3 w-3 mr-1" />
                  {user.isVerified ? 'Verified' : 'Aadhaar Verified'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="text-sm font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                  }) : 'Jan 2024'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Verification Status</span>
                <span className="text-sm font-medium text-green-600">
                  {user.isVerified ? 'Verified' : 'Verified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Ward</span>
                <span className="text-sm font-medium">
                  {user.wardNumber || 'Ward 184'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">District</span>
                <span className="text-sm font-medium">
                  {user.district || 'Bangalore Urban'}
                </span>
              </div>
            </div>
            
            <Button 
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>
        
        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userStats.issues >= 5 && (
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Medal className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Voice Hero</p>
                  <p className="text-xs text-gray-500">Created 5+ impactful issues</p>
                </div>
              </div>
            )}
            
            {userStats.votes >= 100 && (
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="bg-green-100 p-2 rounded-full">
                  <Star className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Top Contributor</p>
                  <p className="text-xs text-gray-500">Most active in ward</p>
                </div>
              </div>
            )}
            
            {userStats.votes >= 50 && (
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <Vote className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Civic Champion</p>
                  <p className="text-xs text-gray-500">100+ votes cast</p>
                </div>
              </div>
            )}

            {userStats.resolvedIssues >= 3 && (
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="bg-purple-100 p-2 rounded-full">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Problem Solver</p>
                  <p className="text-xs text-gray-500">3+ issues resolved</p>
                </div>
              </div>
            )}

            {!userStats.issues && !userStats.votes && (
              <div className="text-center py-8 text-gray-500">
                <Medal className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No achievements yet</p>
                <p className="text-xs">Start contributing to earn badges!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Activity and Stats */}
      <div className="lg:col-span-2 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {userStats.issues || 0}
              </div>
              <div className="text-xs text-gray-500">Issues Raised</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {userStats.votes || 0}
              </div>
              <div className="text-xs text-gray-500">Votes Cast</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {userStats.resolvedIssues || 0}
              </div>
              <div className="text-xs text-gray-500">Issues Resolved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.min((userStats.issues || 0) * 10 + (userStats.votes || 0) * 2 + (userStats.resolvedIssues || 0) * 20, 100)}
              </div>
              <div className="text-xs text-gray-500">Impact Score</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userActivity && userActivity.length > 0 ? (
              userActivity.slice(0, 10).map((activity: any, index: number) => (
                <div key={index} className={`border-l-4 pl-4 ${
                  activity.activityType === 'vote_cast' ? 'border-green-500' :
                  activity.activityType === 'issue_created' ? 'border-blue-500' :
                  activity.activityType === 'comment_added' ? 'border-yellow-500' :
                  'border-gray-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {activity.activityType === 'vote_cast' && 'Voted on an issue'}
                        {activity.activityType === 'issue_created' && 'Created new issue'}
                        {activity.activityType === 'comment_added' && 'Added comment'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.activityData?.title && `"${activity.activityData.title}"`}
                        {' • '}
                        {formatTimeAgo(activity.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {activity.activityType === 'vote_cast' && <Vote className="h-4 w-4 text-green-500" />}
                      {activity.activityType === 'issue_created' && <Plus className="h-4 w-4 text-blue-500" />}
                      {activity.activityType === 'comment_added' && <TrendingUp className="h-4 w-4 text-yellow-500" />}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm">Start participating to see your activity here</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* My Issues */}
        <Card>
          <CardHeader>
            <CardTitle>My Issues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userIssues && userIssues.length > 0 ? (
              userIssues.slice(0, 5).map((issue: any) => (
                <div key={issue.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getCategoryColor(issue.category)}>
                          {issue.category}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {issue.location}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatTimeAgo(issue.createdAt)}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">
                        {issue.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {issue.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Vote className="h-3 w-3 mr-1" />
                          {issue.voteCount} votes
                        </span>
                        <span className="flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          VIS: {Number(issue.visScore || 0).toFixed(1)}
                        </span>
                        <span>
                          {Number(issue.supportPercentage || 0).toFixed(1)}% support
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Badge className={getStatusColor(issue.status)}>
                        {getStatusText(issue.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No issues created yet</p>
                <p className="text-sm">Create your first issue to see it here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
