import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  aadhaarNumber: text("aadhaar_number").unique(),
  phoneNumber: text("phone_number"),
  address: text("address"),
  wardNumber: text("ward_number"),
  district: text("district"),
  state: text("state"),
  isVerified: boolean("is_verified").default(false),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Issues table
export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  severity: text("severity").notNull().default("medium"),
  status: text("status").notNull().default("under_review"),
  location: text("location").notNull(),
  wardNumber: text("ward_number").notNull(),
  district: text("district").notNull(),
  state: text("state").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  mediaUrls: jsonb("media_urls").$type<string[]>().default([]),
  visScore: decimal("vis_score", { precision: 5, scale: 2 }).default("0"),
  voteCount: integer("vote_count").default(0),
  commentCount: integer("comment_count").default(0),
  supportPercentage: decimal("support_percentage", { precision: 5, scale: 2 }).default("0"),
  isAnonymous: boolean("is_anonymous").default(false),
  createdBy: integer("created_by").references(() => users.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Votes table
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id").references(() => issues.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id").references(() => issues.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Status Updates table
export const statusUpdates = pgTable("status_updates", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id").references(() => issues.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id),
  status: text("status").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Activity table
export const userActivity = pgTable("user_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  activityType: text("activity_type").notNull(),
  activityData: jsonb("activity_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Badges table
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  badgeType: text("badge_type").notNull(),
  badgeName: text("badge_name").notNull(),
  description: text("description"),
  earnedAt: timestamp("earned_at").defaultNow(),
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
    references: [issues.id],
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
