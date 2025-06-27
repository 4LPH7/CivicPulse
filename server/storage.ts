import {
  users,
  issues,
  votes,
  comments,
  statusUpdates,
  userActivity,
  userBadges,
  type User,
  type InsertUser,
  type Issue,
  type InsertIssue,
  type Vote,
  type InsertVote,
  type Comment,
  type InsertComment,
  type StatusUpdate,
  type InsertStatusUpdate,
  type IssueWithDetails,
  type UserWithStats,
  type UserBadge,
  type UserActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, sql, count, avg, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByAadhaar(aadhaarNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  getUserWithStats(id: number): Promise<UserWithStats | undefined>;

  // Issue operations
  getIssue(id: number): Promise<Issue | undefined>;
  getIssueWithDetails(id: number): Promise<IssueWithDetails | undefined>;
  createIssue(issue: InsertIssue): Promise<Issue>;
  updateIssue(id: number, issue: Partial<InsertIssue>): Promise<Issue>;
  getIssues(filters?: {
    category?: string;
    status?: string;
    wardNumber?: string;
    district?: string;
    createdBy?: number;
    search?: string;
    sortBy?: 'vis_score' | 'created_at' | 'vote_count' | 'support_percentage';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<IssueWithDetails[]>;
  getHotIssues(wardNumber?: string, district?: string): Promise<IssueWithDetails[]>;
  getPriorityIssues(wardNumber?: string, district?: string): Promise<IssueWithDetails[]>;

  // Vote operations
  createVote(vote: InsertVote): Promise<Vote>;
  getUserVoteForIssue(userId: number, issueId: number): Promise<Vote | undefined>;
  updateVote(id: number, rating: number): Promise<Vote>;
  deleteVote(id: number): Promise<void>;

  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getIssueComments(issueId: number): Promise<Comment[]>;
  deleteComment(id: number): Promise<void>;

  // Status update operations
  createStatusUpdate(statusUpdate: InsertStatusUpdate): Promise<StatusUpdate>;
  getIssueStatusUpdates(issueId: number): Promise<StatusUpdate[]>;

  // Analytics operations
  getIssueStats(wardNumber?: string, district?: string): Promise<{
    totalIssues: number;
    resolvedIssues: number;
    criticalIssues: number;
    inProgressIssues: number;
    avgResponseTime: number;
  }>;
  getCategoryStats(wardNumber?: string, district?: string): Promise<Array<{
    category: string;
    count: number;
    percentage: number;
  }>>;
  getUserStats(userId: number): Promise<{
    issuesRaised: number;
    votesCast: number;
    issuesResolved: number;
    impactScore: number;
  }>;

  // Badge operations
  awardBadge(userId: number, badgeType: string, badgeName: string, description: string): Promise<void>;
  getUserBadges(userId: number): Promise<UserBadge[]>;

  // Activity operations
  logActivity(userId: number, activityType: string, activityData: any): Promise<void>;
  getUserActivity(userId: number, limit?: number): Promise<UserActivity[]>;

  // Escalation operations
  updateIssueVIS(issueId: number): Promise<void>;
  checkEscalationThresholds(issueId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByAadhaar(aadhaarNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.aadhaarNumber, aadhaarNumber));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserWithStats(id: number): Promise<UserWithStats | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const stats = await this.getUserStats(id);
    const badges = await this.getUserBadges(id);

    return {
      ...user,
      _count: {
        issues: stats.issuesRaised,
        votes: stats.votesCast,
        resolvedIssues: stats.issuesResolved,
      },
      badges,
    };
  }

  async getIssue(id: number): Promise<Issue | undefined> {
    const [issue] = await db.select().from(issues).where(eq(issues.id, id));
    return issue;
  }

  async getIssueWithDetails(id: number): Promise<IssueWithDetails | undefined> {
    const issue = await this.getIssue(id);
    if (!issue) return undefined;

    const creator = await this.getUser(issue.createdBy!);
    const assignee = issue.assignedTo ? await this.getUser(issue.assignedTo) : undefined;
    const issueVotes = await db.select().from(votes).where(eq(votes.issueId, id));
    const issueComments = await db.select().from(comments).where(eq(comments.issueId, id));
    const statusHistory = await db.select().from(statusUpdates).where(eq(statusUpdates.issueId, id));

    return {
      ...issue,
      creator: creator!,
      assignee,
      votes: issueVotes,
      comments: issueComments,
      statusUpdates: statusHistory,
      _count: {
        votes: issueVotes.length,
        comments: issueComments.length,
      },
    };
  }

  async createIssue(issueData: InsertIssue): Promise<Issue> {
    const [issue] = await db.insert(issues).values(issueData).returning();
    
    // Log activity
    if (issue.createdBy) {
      await this.logActivity(issue.createdBy, 'issue_created', { issueId: issue.id, title: issue.title });
    }

    return issue;
  }

  async updateIssue(id: number, issueData: Partial<InsertIssue>): Promise<Issue> {
    const [issue] = await db
      .update(issues)
      .set({ ...issueData, updatedAt: new Date() })
      .where(eq(issues.id, id))
      .returning();
    return issue;
  }

  async getIssues(filters: {
    category?: string;
    status?: string;
    wardNumber?: string;
    district?: string;
    createdBy?: number;
    search?: string;
    sortBy?: 'vis_score' | 'created_at' | 'vote_count' | 'support_percentage';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  } = {}): Promise<IssueWithDetails[]> {
    let query = db.select().from(issues);

    // Apply filters
    const conditions = [];
    if (filters.category) conditions.push(eq(issues.category, filters.category));
    if (filters.status) conditions.push(eq(issues.status, filters.status));
    if (filters.wardNumber) conditions.push(eq(issues.wardNumber, filters.wardNumber));
    if (filters.district) conditions.push(eq(issues.district, filters.district));
    if (filters.createdBy) conditions.push(eq(issues.createdBy, filters.createdBy));
    if (filters.search) {
      conditions.push(
        or(
          like(issues.title, `%${filters.search}%`),
          like(issues.description, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'vis_score';
    const sortOrder = filters.sortOrder || 'desc';
    
    if (sortOrder === 'desc') {
      switch (sortBy) {
        case 'vis_score':
          query = query.orderBy(desc(issues.visScore));
          break;
        case 'created_at':
          query = query.orderBy(desc(issues.createdAt));
          break;
        case 'vote_count':
          query = query.orderBy(desc(issues.voteCount));
          break;
        case 'support_percentage':
          query = query.orderBy(desc(issues.supportPercentage));
          break;
        default:
          query = query.orderBy(desc(issues.visScore));
      }
    } else {
      switch (sortBy) {
        case 'vis_score':
          query = query.orderBy(asc(issues.visScore));
          break;
        case 'created_at':
          query = query.orderBy(asc(issues.createdAt));
          break;
        case 'vote_count':
          query = query.orderBy(asc(issues.voteCount));
          break;
        case 'support_percentage':
          query = query.orderBy(asc(issues.supportPercentage));
          break;
        default:
          query = query.orderBy(asc(issues.visScore));
      }
    }

    // Apply pagination
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.offset(filters.offset);

    const issuesList = await query;

    // Fetch related data for each issue
    const issuesWithDetails = await Promise.all(
      issuesList.map(async (issue) => {
        const details = await this.getIssueWithDetails(issue.id);
        return details!;
      })
    );

    return issuesWithDetails;
  }

  async getHotIssues(wardNumber?: string, district?: string): Promise<IssueWithDetails[]> {
    const conditions = [sql`support_percentage >= 20`];
    if (wardNumber) conditions.push(eq(issues.wardNumber, wardNumber));
    if (district) conditions.push(eq(issues.district, district));

    return this.getIssues({
      sortBy: 'support_percentage',
      sortOrder: 'desc',
      limit: 10,
    });
  }

  async getPriorityIssues(wardNumber?: string, district?: string): Promise<IssueWithDetails[]> {
    const conditions = [];
    if (wardNumber) conditions.push(eq(issues.wardNumber, wardNumber));
    if (district) conditions.push(eq(issues.district, district));
    conditions.push(eq(issues.status, 'under_review'));

    return this.getIssues({
      sortBy: 'vis_score',
      sortOrder: 'desc',
      status: 'under_review',
      wardNumber,
      district,
      limit: 20,
    });
  }

  async createVote(voteData: InsertVote): Promise<Vote> {
    const [vote] = await db.insert(votes).values(voteData).returning();
    
    // Update issue VIS score
    await this.updateIssueVIS(vote.issueId!);
    
    // Log activity
    await this.logActivity(vote.userId!, 'vote_cast', { 
      issueId: vote.issueId, 
      rating: vote.rating 
    });

    return vote;
  }

  async getUserVoteForIssue(userId: number, issueId: number): Promise<Vote | undefined> {
    const [vote] = await db
      .select()
      .from(votes)
      .where(and(eq(votes.userId, userId), eq(votes.issueId, issueId)));
    return vote;
  }

  async updateVote(id: number, rating: number): Promise<Vote> {
    const [vote] = await db
      .update(votes)
      .set({ rating })
      .where(eq(votes.id, id))
      .returning();
    
    // Update issue VIS score
    await this.updateIssueVIS(vote.issueId!);
    
    return vote;
  }

  async deleteVote(id: number): Promise<void> {
    const vote = await db.select().from(votes).where(eq(votes.id, id));
    await db.delete(votes).where(eq(votes.id, id));
    
    if (vote[0]) {
      await this.updateIssueVIS(vote[0].issueId!);
    }
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(commentData).returning();
    
    // Update comment count
    await db
      .update(issues)
      .set({ 
        commentCount: sql`comment_count + 1`,
        updatedAt: new Date()
      })
      .where(eq(issues.id, comment.issueId!));

    // Log activity
    await this.logActivity(comment.userId!, 'comment_added', { 
      issueId: comment.issueId,
      commentId: comment.id
    });

    return comment;
  }

  async getIssueComments(issueId: number): Promise<Comment[]> {
    return db.select().from(comments).where(eq(comments.issueId, issueId)).orderBy(desc(comments.createdAt));
  }

  async deleteComment(id: number): Promise<void> {
    const comment = await db.select().from(comments).where(eq(comments.id, id));
    await db.delete(comments).where(eq(comments.id, id));
    
    if (comment[0]) {
      await db
        .update(issues)
        .set({ 
          commentCount: sql`comment_count - 1`,
          updatedAt: new Date()
        })
        .where(eq(issues.id, comment[0].issueId!));
    }
  }

  async createStatusUpdate(statusUpdateData: InsertStatusUpdate): Promise<StatusUpdate> {
    const [statusUpdate] = await db.insert(statusUpdates).values(statusUpdateData).returning();
    
    // Update issue status if provided
    if (statusUpdate.status) {
      await db
        .update(issues)
        .set({ 
          status: statusUpdate.status,
          updatedAt: new Date(),
          resolvedAt: statusUpdate.status === 'resolved' ? new Date() : null
        })
        .where(eq(issues.id, statusUpdate.issueId!));
    }

    return statusUpdate;
  }

  async getIssueStatusUpdates(issueId: number): Promise<StatusUpdate[]> {
    return db.select().from(statusUpdates).where(eq(statusUpdates.issueId, issueId)).orderBy(desc(statusUpdates.createdAt));
  }

  async getIssueStats(wardNumber?: string, district?: string): Promise<{
    totalIssues: number;
    resolvedIssues: number;
    criticalIssues: number;
    inProgressIssues: number;
    avgResponseTime: number;
  }> {
    const conditions = [];
    if (wardNumber) conditions.push(eq(issues.wardNumber, wardNumber));
    if (district) conditions.push(eq(issues.district, district));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [stats] = await db
      .select({
        totalIssues: count(),
        resolvedIssues: count(sql`CASE WHEN status = 'resolved' THEN 1 END`),
        criticalIssues: count(sql`CASE WHEN severity = 'critical' THEN 1 END`),
        inProgressIssues: count(sql`CASE WHEN status = 'in_progress' THEN 1 END`),
        avgResponseTime: avg(sql`EXTRACT(DAY FROM (resolved_at - created_at))`),
      })
      .from(issues)
      .where(whereClause);

    return {
      totalIssues: Number(stats.totalIssues) || 0,
      resolvedIssues: Number(stats.resolvedIssues) || 0,
      criticalIssues: Number(stats.criticalIssues) || 0,
      inProgressIssues: Number(stats.inProgressIssues) || 0,
      avgResponseTime: Number(stats.avgResponseTime) || 0,
    };
  }

  async getCategoryStats(wardNumber?: string, district?: string): Promise<Array<{
    category: string;
    count: number;
    percentage: number;
  }>> {
    const conditions = [];
    if (wardNumber) conditions.push(eq(issues.wardNumber, wardNumber));
    if (district) conditions.push(eq(issues.district, district));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const categoryStats = await db
      .select({
        category: issues.category,
        count: count(),
      })
      .from(issues)
      .where(whereClause)
      .groupBy(issues.category);

    const totalIssues = categoryStats.reduce((sum, stat) => sum + Number(stat.count), 0);

    return categoryStats.map(stat => ({
      category: stat.category,
      count: Number(stat.count),
      percentage: totalIssues > 0 ? (Number(stat.count) / totalIssues) * 100 : 0,
    }));
  }

  async getUserStats(userId: number): Promise<{
    issuesRaised: number;
    votesCast: number;
    issuesResolved: number;
    impactScore: number;
  }> {
    const [issuesRaised] = await db
      .select({ count: count() })
      .from(issues)
      .where(eq(issues.createdBy, userId));

    const [votesCast] = await db
      .select({ count: count() })
      .from(votes)
      .where(eq(votes.userId, userId));

    const [issuesResolved] = await db
      .select({ count: count() })
      .from(issues)
      .where(and(eq(issues.createdBy, userId), eq(issues.status, 'resolved')));

    // Calculate impact score based on various factors
    const impactScore = (Number(issuesRaised.count) * 10) + 
                       (Number(votesCast.count) * 2) + 
                       (Number(issuesResolved.count) * 20);

    return {
      issuesRaised: Number(issuesRaised.count) || 0,
      votesCast: Number(votesCast.count) || 0,
      issuesResolved: Number(issuesResolved.count) || 0,
      impactScore: Math.min(impactScore, 100), // Cap at 100
    };
  }

  async awardBadge(userId: number, badgeType: string, badgeName: string, description: string): Promise<void> {
    // Check if user already has this badge
    const [existingBadge] = await db
      .select()
      .from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeType, badgeType)));

    if (!existingBadge) {
      await db.insert(userBadges).values({
        userId,
        badgeType,
        badgeName,
        description,
      });
    }
  }

  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return db.select().from(userBadges).where(eq(userBadges.userId, userId));
  }

  async logActivity(userId: number, activityType: string, activityData: any): Promise<void> {
    await db.insert(userActivity).values({
      userId,
      activityType,
      activityData,
    });
  }

  async getUserActivity(userId: number, limit: number = 10): Promise<UserActivity[]> {
    return db
      .select()
      .from(userActivity)
      .where(eq(userActivity.userId, userId))
      .orderBy(desc(userActivity.createdAt))
      .limit(limit);
  }

  async updateIssueVIS(issueId: number): Promise<void> {
    // Get issue votes
    const issueVotes = await db.select().from(votes).where(eq(votes.issueId, issueId));
    
    if (issueVotes.length === 0) return;

    // Calculate VIS score based on:
    // - Average rating (1-5 stars)
    // - Number of votes (engagement)
    // - Time factor (newer issues get slight boost)
    const avgRating = issueVotes.reduce((sum, vote) => sum + vote.rating, 0) / issueVotes.length;
    const voteCount = issueVotes.length;
    const engagementScore = Math.min(voteCount * 2, 50); // Cap engagement at 50
    
    // Get issue for time factor
    const issue = await this.getIssue(issueId);
    if (!issue) return;

    const daysSinceCreated = Math.floor((Date.now() - issue.createdAt!.getTime()) / (1000 * 60 * 60 * 24));
    const timeFactor = Math.max(1, 7 - daysSinceCreated); // Newer issues get slight boost

    const visScore = (avgRating * 20) + engagementScore + timeFactor;

    // Calculate support percentage (estimated based on ward population)
    const wardPopulation = 10000; // Mock ward population - in real app, this would be fetched
    const supportPercentage = (voteCount / wardPopulation) * 100;

    await db
      .update(issues)
      .set({ 
        visScore: visScore.toFixed(2),
        voteCount,
        supportPercentage: supportPercentage.toFixed(2),
        updatedAt: new Date()
      })
      .where(eq(issues.id, issueId));
  }

  async checkEscalationThresholds(issueId: number): Promise<void> {
    const issue = await this.getIssue(issueId);
    if (!issue) return;

    const supportPercentage = Number(issue.supportPercentage) || 0;

    // Check escalation thresholds
    if (supportPercentage >= 50) {
      // National attention
      await this.createStatusUpdate({
        issueId,
        userId: null,
        status: 'escalated_national',
        message: 'Issue escalated to national level due to 50%+ support',
      });
    } else if (supportPercentage >= 25) {
      // State level attention
      await this.createStatusUpdate({
        issueId,
        userId: null,
        status: 'escalated_state',
        message: 'Issue escalated to state level due to 25%+ support',
      });
    } else if (supportPercentage >= 10) {
      // Local representative notification
      await this.createStatusUpdate({
        issueId,
        userId: null,
        status: 'escalated_local',
        message: 'Issue escalated to local representatives due to 10%+ support',
      });
    }

    // Award badges for highly supported issues
    if (issue.createdBy && supportPercentage >= 20) {
      await this.awardBadge(
        issue.createdBy,
        'voice_hero',
        'Voice Hero',
        'Created an issue with 20%+ community support'
      );
    }
  }
}

export const storage = new DatabaseStorage();
