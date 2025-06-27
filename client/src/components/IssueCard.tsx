import { useState } from 'react';
import { MapPin, Clock, MessageSquare, Users, Share2, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VotingStars from './VotingStars';
import { formatTimeAgo, getCategoryColor, getStatusColor, getStatusText, calculateVISColor, getEscalationThreshold } from '@/lib/utils';
import type { IssueWithDetails } from '@shared/schema';

interface IssueCardProps {
  issue: IssueWithDetails;
  userVote?: { rating: number } | null;
  onVote?: (rating: number) => void;
  onShare?: () => void;
  compact?: boolean;
}

export default function IssueCard({ 
  issue, 
  userVote, 
  onVote, 
  onShare, 
  compact = false 
}: IssueCardProps) {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (rating: number) => {
    if (onVote && !isVoting) {
      setIsVoting(true);
      try {
        await onVote(rating);
      } finally {
        setIsVoting(false);
      }
    }
  };

  const supportPercentage = Number(issue.supportPercentage) || 0;
  const escalation = getEscalationThreshold(supportPercentage);
  const visScore = Number(issue.visScore) || 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {/* Category, Location, and Time */}
            <div className="flex items-center space-x-2 mb-2 flex-wrap">
              <Badge className={getCategoryColor(issue.category)}>
                {issue.category}
              </Badge>
              <span className="text-xs text-gray-500 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {issue.location}
              </span>
              <span className="text-xs text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatTimeAgo(issue.createdAt!)}
              </span>
            </div>

            {/* Title and Description */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {issue.title}
            </h3>
            
            {!compact && (
              <p className="text-gray-600 mb-4 line-clamp-3">
                {issue.description}
              </p>
            )}

            {/* Media Preview */}
            {!compact && issue.mediaUrls && issue.mediaUrls.length > 0 && (
              <div className="flex space-x-2 mb-4">
                {issue.mediaUrls.slice(0, 3).map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Issue media ${index + 1}`}
                    className="w-16 h-16 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ))}
                {issue.mediaUrls.length > 3 && (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                    +{issue.mediaUrls.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* VIS Score and Status */}
          <div className="ml-6 text-right">
            <div className="text-center mb-4">
              <div className={`text-2xl font-bold ${calculateVISColor(visScore)}`}>
                {visScore.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">VIS Score</div>
            </div>
            <Badge className={getStatusColor(issue.status)}>
              {getStatusText(issue.status)}
            </Badge>
          </div>
        </div>

        {/* Voting and Engagement Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Voting Stars */}
            <div className="flex items-center space-x-2">
              <VotingStars
                rating={userVote?.rating || 0}
                onRatingChange={handleVote}
                readonly={isVoting}
              />
              <span className="text-sm font-medium">
                {issue.voteCount} votes
              </span>
            </div>

            {/* Comments */}
            <div className="flex items-center space-x-1">
              <MessageSquare className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                {issue.commentCount} comments
              </span>
            </div>

            {/* Support Percentage */}
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                {supportPercentage.toFixed(1)}% of ward
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Escalation Indicator */}
            {supportPercentage >= 10 && (
              <Badge className={escalation.color}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {escalation.level}
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              className="flex items-center space-x-1"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>
        </div>

        {/* Escalation Progress Bar */}
        {supportPercentage >= 5 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Community Support</span>
              <span className="text-xs font-medium">{escalation.description}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  supportPercentage >= 50 ? 'bg-purple-500' :
                  supportPercentage >= 25 ? 'bg-red-500' :
                  supportPercentage >= 20 ? 'bg-red-400' :
                  supportPercentage >= 10 ? 'bg-orange-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${Math.min(supportPercentage * 2, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
