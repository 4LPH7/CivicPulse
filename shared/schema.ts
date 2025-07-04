import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email"),
  aadhaarNumber: text("aadhaar_number"),
  phoneNumber: text("phone_number"),
  address: text("address"),
  wardNumber: text("ward_number"),
  district: text("district"),
  state: text("state"),
  isVerified: integer("is_verified", { mode: 'boolean' }).default(false),
  profileImageUrl: text("profile_image_url"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Issues table
export const issues = sqliteTable("issues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  severity: text("severity").notNull().default("medium"),
  status: text("status").notNull().default("under_review"),
  location: text("location").notNull(),
  wardNumber: text("ward_number").notNull(),
  district: text("district").notNull(),
  state: text("state").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  mediaUrls: text("media_urls", { mode: 'json' }).$type<string[]>().default([]),
  visScore: real("vis_score").default(0),
  voteCount: integer("vote_count").default(0),
  commentCount: integer("comment_count").default(0),
  supportPercentage: real("support_percentage").default(0),
  isAnonymous: integer("is_anonymous", { mode: 'boolean' }).default(false),
  createdBy: integer("created_by").references(() => users.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  resolvedAt: integer("resolved_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Votes table
export const votes = sqliteTable("votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  issueId: integer("issue_id").references(() => issues.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Comments table
export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  issueId: integer("issue_id").references(() => issues.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isAnonymous: integer("is_anonymous", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Status Updates table
export const statusUpdates = sqliteTable("status_updates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  issueId: integer("issue_id").references(() => issues.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id),
  status: text("status").notNull(),
  message: text("message"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// User Activity table
export const userActivity = sqliteTable("user_activity", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  activityType: text("activity_type").notNull(),
  activityData: text("activity_data", { mode: 'json' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// User Badges table
export const userBadges = sqliteTable("user_badges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  badgeType: text("badge_type").notNull(),
  badgeName: text("badge_name").notNull(),
  description: text("description"),
  earnedAt: integer("earned_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  issues: many(issues, { relationName: "creator" }),
  assignedIssues: many(issues, { relationName: "assignee" }),
  votes: many(votes),
  comments: many(comments),
  statusUpdates: many(statusUpdates),
  activities: many(userActivity),
  badges: many(userBadges),
}));

export const issuesRelations = relations(issues, ({ one, many }) => ({
  creator: one(users, {
    fields: [issues.createdBy],
    references: [users.id],
    relationName: "creator",
  }),
  assignee: one(users, {
    fields: [issues.assignedTo],
    references: [users.id],
    relationName: "assignee",
  }),
  votes: many(votes),
  comments: many(comments),
  statusUpdates: many(statusUpdates),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  issue: one(issues, {
    fields: [votes.issueId],
    references: [issues.id],
  }),
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  issue: one(issues, {
    fields: [comments.issueId],
    references: [issues.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const statusUpdatesRelations = relations(statusUpdates, ({ one }) => ({
  issue: one(issues, {
    fields: [statusUpdates.issueId],
    references: [statusUpdates.id],
  }),
  user: one(users, {
    fields: [statusUpdates.userId],
    references: [users.id],
  }),
}));

export const userActivityRelations = relations(userActivity, ({ one }) => ({
  user: one(users, {
    fields: [userActivity.userId],
    references: [users.id],
  }),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  visScore: true,
  voteCount: true,
  commentCount: true,
  supportPercentage: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertStatusUpdateSchema = createInsertSchema(statusUpdates).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Issue = typeof issues.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type StatusUpdate = typeof statusUpdates.$inferSelect;
export type InsertStatusUpdate = z.infer<typeof insertStatusUpdateSchema>;
export type UserActivity = typeof userActivity.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;

// Extended types with relations
export type IssueWithDetails = Issue & {
  creator: User;
  assignee?: User;
  votes: Vote[];
  comments: Comment[];
  statusUpdates: StatusUpdate[];
  _count: {
    votes: number;
    comments: number;
  };
};

export type UserWithStats = User & {
  _count: {
    issues: number;
    votes: number;
    resolvedIssues: number;
  };
  badges: UserBadge[];
};