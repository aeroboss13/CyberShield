import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"), // 'user' or 'admin'
  jobTitle: text("job_title"),
  avatar: text("avatar"),
  bio: text("bio"),
  location: text("location"),
  website: text("website"),
  reputation: integer("reputation").default(0),
  postCount: integer("post_count").default(0),
  likesReceived: integer("likes_received").default(0),
  commentsCount: integer("comments_count").default(0),
  cveSubmissions: integer("cve_submissions").default(0),
  exploitSubmissions: integer("exploit_submissions").default(0),
  verifiedSubmissions: integer("verified_submissions").default(0),
  createdAt: timestamp("created_at").defaultNow()
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array().default([]),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  createdAt: timestamp("created_at").defaultNow()
});

export const cveEntries = pgTable("cve_entries", {
  id: serial("id").primaryKey(),
  cveId: text("cve_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  cvssScore: decimal("cvss_score"),
  severity: text("severity").notNull(),
  vendor: text("vendor"),
  publishedDate: text("published_date"),
  updatedDate: text("updated_date"),
  tags: text("tags").array().default([]),
  activelyExploited: boolean("actively_exploited").default(false),
  edbId: text("edb_id"), // ExploitDB ID for direct exploit access
  references: text("references") // JSON string storing NVD references array
});

export const mitreAttack = pgTable("mitre_attack", {
  id: serial("id").primaryKey(),
  tacticId: text("tactic_id").notNull(),
  tacticName: text("tactic_name").notNull(),
  tacticDescription: text("tactic_description").notNull(),
  techniqueId: text("technique_id").notNull(),
  techniqueName: text("technique_name").notNull(),
  techniqueDescription: text("technique_description")
});

export const exploits = pgTable("exploits", {
  id: serial("id").primaryKey(),
  cveId: text("cve_id").notNull(),
  exploitId: text("exploit_id").notNull(), // EDB-ID from ExploitDB
  title: text("title").notNull(),
  description: text("description").notNull(),
  exploitType: text("exploit_type").notNull(),
  platform: text("platform").notNull(),
  verified: boolean("verified").default(false),
  datePublished: text("date_published").notNull(),
  author: text("author").notNull(),
  sourceUrl: text("source_url").notNull(),
  exploitCode: text("exploit_code"), // Nullable - lazy loaded
  source: text("source").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content"),
  source: text("source").notNull(),
  imageUrl: text("image_url"),
  link: text("link"), // Original article URL
  tags: text("tags").array().default([]),
  publishedAt: timestamp("published_at").defaultNow()
});

// Comments for news articles
export const newsComments = pgTable("news_comments", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => newsArticles.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Comments for posts
export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Likes for posts
export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Likes for news articles
export const newsLikes = pgTable("news_likes", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => newsArticles.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// User-submitted vulnerabilities and exploits
export const userSubmissions = pgTable("user_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // 'vulnerability' or 'exploit'
  title: text("title").notNull(),
  description: text("description").notNull(),
  
  // Common fields
  severity: text("severity"),
  category: text("category").notNull(),
  tags: text("tags").array().default([]),
  
  // CVE-specific fields
  affectedSoftware: text("affected_software"),
  versions: text("versions"),
  cvssScore: decimal("cvss_score"),
  
  // Exploit-specific fields
  platform: text("platform"),
  exploitType: text("exploit_type"),
  exploitCode: text("exploit_code"),
  targetCve: text("target_cve"), // Related CVE ID if applicable
  
  // Status and verification
  status: text("status").notNull().default('pending'), // 'pending', 'approved', 'rejected'
  verified: boolean("verified").default(false),
  reviewNotes: text("review_notes"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Relations
export const newsArticleRelations = relations(newsArticles, ({ many }) => ({
  comments: many(newsComments),
  likes: many(newsLikes)
}));

export const newsCommentRelations = relations(newsComments, ({ one }) => ({
  article: one(newsArticles, {
    fields: [newsComments.articleId],
    references: [newsArticles.id]
  }),
  user: one(users, {
    fields: [newsComments.userId],
    references: [users.id]
  })
}));

// Post relations
export const postRelations = relations(posts, ({ many, one }) => ({
  comments: many(postComments),
  likes: many(postLikes),
  user: one(users, {
    fields: [posts.userId],
    references: [users.id]
  })
}));

export const postLikeRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id]
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id]
  })
}));

export const newsLikeRelations = relations(newsLikes, ({ one }) => ({
  article: one(newsArticles, {
    fields: [newsLikes.articleId],
    references: [newsArticles.id]
  }),
  user: one(users, {
    fields: [newsLikes.userId],
    references: [users.id]
  })
}));

export const postCommentRelations = relations(postComments, ({ one }) => ({
  post: one(posts, {
    fields: [postComments.postId],
    references: [posts.id]
  }),
  user: one(users, {
    fields: [postComments.userId],
    references: [users.id]
  })
}));

export const userRelations = relations(users, ({ many }) => ({
  newsComments: many(newsComments),
  postComments: many(postComments),
  posts: many(posts),
  postLikes: many(postLikes),
  newsLikes: many(newsLikes),
  submissions: many(userSubmissions),
  reviewedSubmissions: many(userSubmissions) // As a reviewer
}));

export const userSubmissionRelations = relations(userSubmissions, ({ one }) => ({
  user: one(users, {
    fields: [userSubmissions.userId],
    references: [users.id]
  }),
  reviewer: one(users, {
    fields: [userSubmissions.reviewedBy],
    references: [users.id]
  })
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  passwordHash: true,
  reputation: true,
  postCount: true,
  likesReceived: true,
  commentsCount: true,
  cveSubmissions: true,
  exploitSubmissions: true,
  verifiedSubmissions: true
}).extend({
  role: z.enum(['user', 'admin']).default('user')
});

export const updateUserSchema = insertUserSchema.pick({
  name: true,
  jobTitle: true,
  bio: true,
  location: true,
  website: true,
  avatar: true
});

// Admin-only schema for role updates (separate endpoint)
export const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin'])
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  likes: true,
  comments: true,
  shares: true
});

export const insertCVESchema = createInsertSchema(cveEntries).omit({
  id: true
});

export const insertMitreSchema = createInsertSchema(mitreAttack).omit({
  id: true
});

export const insertExploitSchema = createInsertSchema(exploits).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertNewsSchema = createInsertSchema(newsArticles).omit({
  id: true,
  publishedAt: true
});

export const insertNewsCommentSchema = createInsertSchema(newsComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPostCommentSchema = createInsertSchema(postComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPostLikeSchema = createInsertSchema(postLikes).omit({
  id: true,
  createdAt: true
});

export const insertNewsLikeSchema = createInsertSchema(newsLikes).omit({
  id: true,
  createdAt: true
});

export const insertUserSubmissionSchema = createInsertSchema(userSubmissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  verified: true,
  reviewNotes: true,
  reviewedBy: true,
  reviewedAt: true
}).extend({
  type: z.enum(['vulnerability', 'exploit']),
  cvssScore: z.string().nullable().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).nullable().optional()
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertCVE = z.infer<typeof insertCVESchema>;
export type CVE = typeof cveEntries.$inferSelect;
export type InsertMitre = z.infer<typeof insertMitreSchema>;
export type MitreAttack = typeof mitreAttack.$inferSelect;
export type InsertExploit = z.infer<typeof insertExploitSchema>;
export type Exploit = typeof exploits.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = typeof newsArticles.$inferSelect;
export type InsertNewsComment = z.infer<typeof insertNewsCommentSchema>;
export type NewsComment = typeof newsComments.$inferSelect;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
export type PostComment = typeof postComments.$inferSelect;
export type InsertPostLike = z.infer<typeof insertPostLikeSchema>;
export type PostLike = typeof postLikes.$inferSelect;
export type InsertNewsLike = z.infer<typeof insertNewsLikeSchema>;
export type NewsLike = typeof newsLikes.$inferSelect;
export type InsertUserSubmission = z.infer<typeof insertUserSubmissionSchema>;
export type UserSubmission = typeof userSubmissions.$inferSelect;

// Public user type without sensitive information
export const publicUserSchema = createSelectSchema(users).omit({
  email: true,
  passwordHash: true
});

export type PublicUser = z.infer<typeof publicUserSchema>;

// Authentication schemas
export const registerSchema = insertUserSchema.omit({ 
  role: true 
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.string().email("Invalid email format").toLowerCase()
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"), // Can be username or email
  password: z.string().min(1, "Password is required")
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export type NewsArticle = typeof newsArticles.$inferSelect;

// Threat Overview Schema for Global Threat Level analytics
export const threatOverviewSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  level: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
  metrics: z.object({
    cvesToday: z.number(),
    criticalHighToday: z.number(),
    kevAddedToday: z.number(),
    topicCounts: z.record(z.string(), z.number()),
  }),
  headlines: z.array(z.object({
    title: z.string(),
    source: z.string(),
    link: z.string().optional()
  })),
  trend7Day: z.object({
    cvesAvg: z.number(),
    newsAvg: z.number()
  }).nullable(),
  rationale: z.string()
});

export type ThreatOverview = z.infer<typeof threatOverviewSchema>;
