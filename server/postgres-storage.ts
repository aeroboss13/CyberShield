import { db } from './db.js';
import { 
  users, posts, cveEntries, exploits, mitreAttack, newsArticles, 
  newsComments, postComments, postLikes, newsLikes, userSubmissions, notifications,
  type User, type InsertUser, type Post, type InsertPost, type CVE, type InsertCVE,
  type Exploit, type InsertExploit, type MitreAttack as MitreAttackType, 
  type NewsArticle, type NewsComment, type InsertNewsComment,
  type PostComment, type InsertPostComment, type InsertPostLike, type InsertNewsLike,
  type UserSubmission, type InsertUserSubmission, type Notification, type InsertNotification
} from '../shared/schema.js';
import { eq, and, or, ilike, desc, sql, ne } from 'drizzle-orm';
import type { IStorage } from './storage.js';
import { extractSessionToken, getSession } from './auth.js';

interface CVESearchParams {
  search?: string;
  severity?: string;
  page: number;
  limit: number;
}

export class PostgresStorage implements IStorage {
  // ==================== USERS ====================
  
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser, passwordHash: string): Promise<User> {
    const result = await db.insert(users).values({
      ...user,
      passwordHash,
      avatar: null,
      bio: null,
      location: null,
      website: null,
      createdAt: new Date(),
      lastLogin: null,
      isActive: true,
      postsCount: 0,
      likesReceived: 0,
      commentsCount: 0,
      followersCount: 0,
      followingCount: 0
    }).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getCurrentUser(req: any): Promise<User | undefined> {
    const token = extractSessionToken(req);
    if (!token) return undefined;
    
    const session = getSession(token);
    if (!session) return undefined;
    
    return this.getUser(session.userId);
  }

  async updateUserAvatar(userId: number, avatarData: string): Promise<void> {
    await db.update(users)
      .set({ avatar: avatarData })
      .where(eq(users.id, userId));
  }

  async isAdmin(userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    return user?.role === 'admin';
  }

  async getUserStats(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    return user;
  }

  async getUserActivityStats(userId: number): Promise<{
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
  }> {
    const userPosts = await db.select().from(posts).where(eq(posts.userId, userId));
    const userComments = await db.select().from(postComments).where(eq(postComments.userId, userId));
    const userLikes = await db.select().from(postLikes).where(eq(postLikes.userId, userId));

    return {
      totalPosts: userPosts.length,
      totalLikes: userLikes.length,
      totalComments: userComments.length
    };
  }

  async updateUserStats(userId: number, field: string, delta: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const updates: any = {};
    if (field === 'postsCount') updates.postsCount = (user.postsCount || 0) + delta;
    if (field === 'likesReceived') updates.likesReceived = (user.likesReceived || 0) + delta;
    if (field === 'commentsCount') updates.commentsCount = (user.commentsCount || 0) + delta;

    if (Object.keys(updates).length > 0) {
      await db.update(users).set(updates).where(eq(users.id, userId));
    }
  }

  // ==================== POSTS ====================
  
  async getAllPosts(): Promise<(Post & { user: User })[]> {
    const result = await db.select().from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt));
    
    return result.map(row => ({
      ...row.posts,
      user: row.users!
    }));
  }

  async getPost(id: number): Promise<Post | undefined> {
    const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    return result[0];
  }

  async createPost(post: InsertPost): Promise<Post> {
    const result = await db.insert(posts).values({
      ...post,
      likes: 0,
      comments: 0,
      shares: 0,
      createdAt: new Date()
    }).returning();
    
    // Update user stats
    await this.updateUserStats(post.userId, 'postsCount', 1);
    
    return result[0];
  }

  async updatePostInteraction(id: number, type: 'likes' | 'comments' | 'shares', delta: number = 1): Promise<void> {
    const post = await this.getPost(id);
    if (!post) return;

    const updates: any = {};
    if (type === 'likes') updates.likes = Math.max(0, (post.likes || 0) + delta);
    if (type === 'comments') updates.comments = Math.max(0, (post.comments || 0) + delta);
    if (type === 'shares') updates.shares = Math.max(0, (post.shares || 0) + delta);

    await db.update(posts).set(updates).where(eq(posts.id, id));
  }

  async getProjectStats(): Promise<{
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
  }> {
    const allPosts = await db.select().from(posts);
    const allComments = await db.select().from(postComments);
    const allLikes = await db.select().from(postLikes);

    return {
      totalPosts: allPosts.length,
      totalLikes: allLikes.length,
      totalComments: allComments.length
    };
  }

  // ==================== CVE ====================
  
  async getAllCVEs(): Promise<CVE[]> {
    return db.select().from(cveEntries);
  }

  async searchCVEs(query: string, severity?: string): Promise<CVE[]> {
    let conditions: any[] = [];

    if (query) {
      conditions.push(
        or(
          ilike(cveEntries.cveId, `%${query}%`),
          ilike(cveEntries.title, `%${query}%`),
          ilike(cveEntries.description, `%${query}%`),
          ilike(cveEntries.vendor, `%${query}%`)
        )
      );
    }

    if (severity && severity !== 'All Severities') {
      conditions.push(eq(cveEntries.severity, severity));
    }

    if (conditions.length === 0) {
      return db.select().from(cveEntries).limit(1000);
    }

    return db.select().from(cveEntries).where(and(...conditions)).limit(1000);
  }

  async searchCVEsPaginated(params: CVESearchParams): Promise<{
    cves: CVE[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, severity, page, limit } = params;
    let conditions: any[] = [];

    if (search) {
      conditions.push(
        or(
          ilike(cveEntries.cveId, `%${search}%`),
          ilike(cveEntries.title, `%${search}%`),
          ilike(cveEntries.description, `%${search}%`),
          ilike(cveEntries.vendor, `%${search}%`)
        )
      );
    }

    if (severity && severity !== 'All Severities') {
      conditions.push(eq(cveEntries.severity, severity));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(cveEntries)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * limit;
    const cves = await db.select().from(cveEntries)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(cveEntries.publishedDate));

    return {
      cves,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getCVE(cveId: string): Promise<CVE | undefined> {
    const result = await db.select().from(cveEntries).where(eq(cveEntries.cveId, cveId)).limit(1);
    return result[0];
  }

  async getCVEById(id: number): Promise<CVE | undefined> {
    const result = await db.select().from(cveEntries).where(eq(cveEntries.id, id)).limit(1);
    return result[0];
  }

  async createOrUpdateCVE(cve: InsertCVE): Promise<CVE> {
    const existing = await this.getCVE(cve.cveId);
    
    if (existing) {
      const result = await db.update(cveEntries)
        .set(cve)
        .where(eq(cveEntries.cveId, cve.cveId))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(cveEntries).values(cve).returning();
      return result[0];
    }
  }

  async updateCVEEdbId(cveId: string, edbId: string): Promise<void> {
    await db.update(cveEntries)
      .set({ edbId })
      .where(eq(cveEntries.cveId, cveId));
  }

  async updateCVEActiveExploitation(cveId: string, activelyExploited: boolean): Promise<void> {
    await db.update(cveEntries)
      .set({ activelyExploited })
      .where(eq(cveEntries.cveId, cveId));
  }

  // ==================== EXPLOITS ====================
  
  async getExploitsForCVE(cveId: string): Promise<Exploit[]> {
    return db.select().from(exploits).where(eq(exploits.cveId, cveId));
  }

  async createExploit(exploit: InsertExploit): Promise<Exploit> {
    const result = await db.insert(exploits).values(exploit).returning();
    return result[0];
  }

  async updateExploitCode(exploitId: string, code: string): Promise<void> {
    await db.update(exploits)
      .set({ code })
      .where(eq(exploits.exploitId, exploitId));
  }

  async getExploitByEdbId(edbId: string): Promise<Exploit | undefined> {
    const result = await db.select().from(exploits).where(eq(exploits.edbId, edbId)).limit(1);
    return result[0];
  }

  async getExploitById(id: number): Promise<Exploit | undefined> {
    const result = await db.select().from(exploits).where(eq(exploits.id, id)).limit(1);
    return result[0];
  }

  async deleteExploit(id: number): Promise<void> {
    await db.delete(exploits).where(eq(exploits.id, id));
  }

  async deleteExploitByEdbId(edbId: string): Promise<void> {
    await db.delete(exploits).where(eq(exploits.edbId, edbId));
  }

  async updateExploitMetadata(exploitId: string, metadata: Partial<Omit<InsertExploit, 'exploitId'>>): Promise<void> {
    await db.update(exploits)
      .set(metadata)
      .where(eq(exploits.exploitId, exploitId));
  }

  // ==================== MITRE ATT&CK ====================
  
  async getAllMitreTactics(): Promise<{ tacticId: string; tacticName: string; tacticDescription: string; techniques: MitreAttackType[] }[]> {
    const allTechniques = await db.select().from(mitreAttack);
    
    // Group by tactic
    const tacticsMap = new Map<string, MitreAttackType[]>();
    
    for (const technique of allTechniques) {
      if (!tacticsMap.has(technique.tacticId)) {
        tacticsMap.set(technique.tacticId, []);
      }
      tacticsMap.get(technique.tacticId)!.push(technique);
    }

    // Convert to array
    const tactics: { tacticId: string; tacticName: string; tacticDescription: string; techniques: MitreAttackType[] }[] = [];
    
    for (const [tacticId, techniques] of tacticsMap) {
      if (techniques.length > 0) {
        tactics.push({
          tacticId,
          tacticName: techniques[0].tacticName,
          tacticDescription: techniques[0].tacticDescription || '',
          techniques
        });
      }
    }

    return tactics;
  }

  async searchMitreTechniques(query: string): Promise<MitreAttackType[]> {
    return db.select().from(mitreAttack)
      .where(
        or(
          ilike(mitreAttack.techniqueId, `%${query}%`),
          ilike(mitreAttack.techniqueName, `%${query}%`),
          ilike(mitreAttack.techniqueDescription, `%${query}%`)
        )
      )
      .limit(100);
  }

  // ==================== NEWS ====================
  
  async getAllNews(): Promise<NewsArticle[]> {
    return db.select().from(newsArticles).orderBy(desc(newsArticles.publishedAt));
  }

  async getNews(id: number): Promise<NewsArticle | undefined> {
    const result = await db.select().from(newsArticles).where(eq(newsArticles.id, id)).limit(1);
    return result[0];
  }

  // ==================== NEWS COMMENTS ====================
  
  async getNewsComments(articleId: number): Promise<(NewsComment & { user: User })[]> {
    const result = await db.select().from(newsComments)
      .leftJoin(users, eq(newsComments.userId, users.id))
      .where(eq(newsComments.articleId, articleId))
      .orderBy(desc(newsComments.createdAt));
    
    return result.map(row => ({
      ...row.news_comments,
      user: row.users!
    }));
  }

  async createNewsComment(comment: InsertNewsComment): Promise<NewsComment> {
    const result = await db.insert(newsComments).values({
      ...comment,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async deleteNewsComment(id: number): Promise<void> {
    await db.delete(newsComments).where(eq(newsComments.id, id));
  }

  // ==================== POST COMMENTS ====================
  
  async getPostComments(postId: number): Promise<(PostComment & { user: User })[]> {
    const result = await db.select().from(postComments)
      .leftJoin(users, eq(postComments.userId, users.id))
      .where(eq(postComments.postId, postId))
      .orderBy(desc(postComments.createdAt));
    
    return result.map(row => ({
      ...row.post_comments,
      user: row.users!
    }));
  }

  async createPostComment(comment: InsertPostComment): Promise<PostComment> {
    const result = await db.insert(postComments).values({
      ...comment,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async deletePostComment(id: number): Promise<void> {
    await db.delete(postComments).where(eq(postComments.id, id));
  }

  async getPostCommentById(id: number): Promise<PostComment | undefined> {
    const result = await db.select().from(postComments).where(eq(postComments.id, id)).limit(1);
    return result[0];
  }

  // ==================== LIKES ====================
  
  async togglePostLike(postId: number, userId: number): Promise<{ liked: boolean; likeCount: number }> {
    const existing = await db.select().from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
      .limit(1);

    if (existing.length > 0) {
      // Unlike
      await db.delete(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
      await this.updatePostInteraction(postId, 'likes', -1);
      
      const post = await this.getPost(postId);
      return { liked: false, likeCount: post?.likes || 0 };
    } else {
      // Like
      await db.insert(postLikes).values({ postId, userId, createdAt: new Date() });
      await this.updatePostInteraction(postId, 'likes', 1);
      
      const post = await this.getPost(postId);
      return { liked: true, likeCount: post?.likes || 0 };
    }
  }

  async getPostLikeStatus(postId: number, userId: number): Promise<boolean> {
    const result = await db.select().from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
      .limit(1);
    return result.length > 0;
  }

  async toggleNewsLike(articleId: number, userId: number): Promise<{ liked: boolean; likeCount: number }> {
    const existing = await db.select().from(newsLikes)
      .where(and(eq(newsLikes.articleId, articleId), eq(newsLikes.userId, userId)))
      .limit(1);

    if (existing.length > 0) {
      // Unlike
      await db.delete(newsLikes)
        .where(and(eq(newsLikes.articleId, articleId), eq(newsLikes.userId, userId)));
      
      const likes = await db.select().from(newsLikes).where(eq(newsLikes.articleId, articleId));
      return { liked: false, likeCount: likes.length };
    } else {
      // Like
      await db.insert(newsLikes).values({ articleId, userId, createdAt: new Date() });
      
      const likes = await db.select().from(newsLikes).where(eq(newsLikes.articleId, articleId));
      return { liked: true, likeCount: likes.length };
    }
  }

  async getNewsLikeStatus(articleId: number, userId: number): Promise<boolean> {
    const result = await db.select().from(newsLikes)
      .where(and(eq(newsLikes.articleId, articleId), eq(newsLikes.userId, userId)))
      .limit(1);
    return result.length > 0;
  }

  // ==================== USER SUBMISSIONS ====================
  
  async createUserSubmission(submission: InsertUserSubmission): Promise<UserSubmission> {
    const result = await db.insert(userSubmissions).values({
      ...submission,
      status: 'pending',
      submittedAt: new Date()
    }).returning();
    return result[0];
  }

  async getUserSubmissions(userId: number): Promise<(UserSubmission & { user: User })[]> {
    const result = await db.select().from(userSubmissions)
      .leftJoin(users, eq(userSubmissions.userId, users.id))
      .where(eq(userSubmissions.userId, userId))
      .orderBy(desc(userSubmissions.submittedAt));
    
    return result.map(row => ({
      ...row.user_submissions,
      user: row.users!
    }));
  }

  async getAllSubmissions(): Promise<(UserSubmission & { user: User })[]> {
    const result = await db.select().from(userSubmissions)
      .leftJoin(users, eq(userSubmissions.userId, users.id))
      .where(eq(userSubmissions.status, 'approved'))
      .orderBy(desc(userSubmissions.submittedAt));
    
    return result.map(row => ({
      ...row.user_submissions,
      user: row.users!
    }));
  }

  async updateSubmissionStatus(id: number, status: string, reviewNotes?: string, reviewerId?: number): Promise<void> {
    await db.update(userSubmissions)
      .set({
        status,
        reviewNotes,
        reviewerId,
        reviewedAt: new Date()
      })
      .where(eq(userSubmissions.id, id));
  }

  async getAllSubmissionsForAdmin(): Promise<(UserSubmission & { user: User })[]> {
    const result = await db.select().from(userSubmissions)
      .leftJoin(users, eq(userSubmissions.userId, users.id))
      .orderBy(desc(userSubmissions.submittedAt));
    
    return result.map(row => ({
      ...row.user_submissions,
      user: row.users!
    }));
  }

  async approveSubmission(id: number, adminId: number, reviewNotes?: string): Promise<void> {
    await this.updateSubmissionStatus(id, 'approved', reviewNotes, adminId);
  }

  async rejectSubmission(id: number, adminId: number, reviewNotes?: string): Promise<void> {
    await this.updateSubmissionStatus(id, 'rejected', reviewNotes, adminId);
  }

  async getPendingSubmissions(): Promise<(UserSubmission & { user: User })[]> {
    const result = await db.select().from(userSubmissions)
      .leftJoin(users, eq(userSubmissions.userId, users.id))
      .where(eq(userSubmissions.status, 'pending'))
      .orderBy(desc(userSubmissions.submittedAt));
    
    return result.map(row => ({
      ...row.user_submissions,
      user: row.users!
    }));
  }

  // ==================== NOTIFICATIONS ====================
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values({
      ...notification,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return Number(result[0]?.count || 0);
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }
}


