import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  avatar: text("avatar"),
  reputation: integer("reputation").default(0),
  postCount: integer("post_count").default(0),
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
  exploitCount: integer("exploit_count").default(0),
  lastExploitCheck: timestamp("last_exploit_check")
});

export const exploits = pgTable("exploits", {
  id: serial("id").primaryKey(),
  cveId: text("cve_id").notNull(),
  exploitId: text("exploit_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  exploitType: text("exploit_type").notNull(),
  platform: text("platform").notNull(),
  verified: boolean("verified").default(false),
  datePublished: text("date_published").notNull(),
  author: text("author").notNull(),
  sourceUrl: text("source_url").notNull(),
  exploitCode: text("exploit_code"),
  source: text("source").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const cveUpdateLog = pgTable("cve_update_log", {
  id: serial("id").primaryKey(),
  lastUpdate: timestamp("last_update").defaultNow(),
  totalCves: integer("total_cves").default(0),
  newCves: integer("new_cves").default(0),
  updatedCves: integer("updated_cves").default(0),
  status: text("status").notNull(),
  errorMessage: text("error_message")
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

export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content"),
  source: text("source").notNull(),
  imageUrl: text("image_url"),
  tags: text("tags").array().default([]),
  publishedAt: timestamp("published_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  reputation: true,
  postCount: true
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

export const insertNewsSchema = createInsertSchema(newsArticles).omit({
  id: true,
  publishedAt: true
});

export const insertExploitSchema = createInsertSchema(exploits).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCveUpdateLogSchema = createInsertSchema(cveUpdateLog).omit({
  id: true,
  lastUpdate: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertCVE = z.infer<typeof insertCVESchema>;
export type CVE = typeof cveEntries.$inferSelect;
export type InsertMitre = z.infer<typeof insertMitreSchema>;
export type MitreAttack = typeof mitreAttack.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type InsertExploit = z.infer<typeof insertExploitSchema>;
export type Exploit = typeof exploits.$inferSelect;
export type InsertCveUpdateLog = z.infer<typeof insertCveUpdateLogSchema>;
export type CveUpdateLog = typeof cveUpdateLog.$inferSelect;
