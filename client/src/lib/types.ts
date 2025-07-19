// Re-export types from shared schema
export type {
  User,
  Issue,
  Vote,
  Comment,
  StatusUpdate,
  UserActivity,
  UserBadge,
  IssueWithDetails,
  UserWithStats,
} from '@shared/schema';

// API Response types
export interface AnalyticsData {
  issueStats: {
    totalIssues: number;
    resolvedIssues: number;
    inProgressIssues: number;
    pendingIssues: number;
    averageResolutionTime: number;
    criticalIssues: number;
    avgResponseTime: number;
  };
  categoryStats: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  userStats: {
    issuesRaised: number;
    votescast: number;
    votesCast: number; // alias for compatibility
    commentsposted: number;
    badgesEarned: number;
    issuesResolved: number;
  };
}

export interface HotIssue {
  id: number;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  location: string;
  wardNumber: string;
  district: string;
  state: string;
  latitude?: number;
  longitude?: number;
  mediaUrls: string[];
  visScore: number;
  voteCount: number;
  commentCount: number;
  supportPercentage: number;
  isAnonymous: boolean;
  createdBy?: number;
  assignedTo?: number;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserActivityItem {
  id: number;
  activityType: string;
  activityData: any;
  createdAt: string;
}

export interface VoteData {
  issueId: number;
  rating: number;
}