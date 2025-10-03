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

  async getUserStats(userId: number): Promise<{
    id: number;
    username: string;
    reputation: number;
    reputationLevel: string;
    postCount: number;
    likesReceived: number;
    commentsCount: number;
    cveSubmissions: number;
    exploitSubmissions: number;
    verifiedSubmissions: number;
    totalSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    pendingSubmissions: number;
    recentActivity: {
      lastLogin: string | null;
      lastSubmission: string | null;
      lastPost: string | null;
    };
  }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    // Get submission statistics
    const allSubmissions = await db.select().from(userSubmissions).where(eq(userSubmissions.userId, userId));
    const cveSubmissions = allSubmissions.filter(s => s.type === 'vulnerability').length;
    const exploitSubmissions = allSubmissions.filter(s => s.type === 'exploit').length;
    const verifiedSubmissions = allSubmissions.filter(s => s.verified).length;
    const approvedSubmissions = allSubmissions.filter(s => s.status === 'approved').length;
    const rejectedSubmissions = allSubmissions.filter(s => s.status === 'rejected').length;
    const pendingSubmissions = allSubmissions.filter(s => s.status === 'pending').length;
    const totalSubmissions = allSubmissions.length;

    // Get post statistics
    const userPosts = await db.select().from(posts).where(eq(posts.userId, userId));
    const postCount = userPosts.length;

    // Get likes received
    const userLikes = await db.select().from(postLikes).where(eq(postLikes.userId, userId));
    const likesReceived = userLikes.length;

    // Get comments count
    const userComments = await db.select().from(postComments).where(eq(postComments.userId, userId));
    const commentsCount = userComments.length;

    // Calculate reputation based on real data
    let reputation = 0;
    
    // Base reputation from submissions
    reputation += approvedSubmissions * 50; // 50 points per approved submission
    reputation += verifiedSubmissions * 100; // 100 points per verified submission
    reputation += cveSubmissions * 25; // 25 points per CVE submission
    reputation += exploitSubmissions * 30; // 30 points per exploit submission
    
    // Reputation from community engagement
    reputation += likesReceived * 2; // 2 points per like received
    reputation += commentsCount * 1; // 1 point per comment
    reputation += postCount * 5; // 5 points per post
    
    // Bonus for high-quality contributions
    if (verifiedSubmissions > 0) reputation += 200; // Bonus for having verified submissions
    if (approvedSubmissions > 10) reputation += 500; // Bonus for many approved submissions
    if (totalSubmissions > 20) reputation += 300; // Bonus for high activity

    // Determine reputation level
    let reputationLevel = 'Beginner';
    if (reputation >= 2000) reputationLevel = 'Expert';
    else if (reputation >= 1000) reputationLevel = 'Advanced';
    else if (reputation >= 500) reputationLevel = 'Intermediate';
    else if (reputation >= 100) reputationLevel = 'Contributor';

    // Get recent activity
    const lastSubmission = allSubmissions.length > 0 
      ? allSubmissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
      : null;
    
    const lastPost = userPosts.length > 0 
      ? userPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
      : null;

    return {
      id: user.id,
      username: user.username,
      reputation,
      reputationLevel,
      postCount,
      likesReceived,
      commentsCount,
      cveSubmissions,
      exploitSubmissions,
      verifiedSubmissions,
      totalSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      pendingSubmissions,
      recentActivity: {
        lastLogin: user.lastLogin,
        lastSubmission,
        lastPost
      }
    };
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
    if (field === 'postsCount') updates.postCount = (user.postCount || 0) + delta;
    if (field === 'likesReceived') updates.likesReceived = (user.likesReceived || 0) + delta;
    if (field === 'commentsCount') updates.commentsCount = (user.commentsCount || 0) + delta;

    if (Object.keys(updates).length > 0) {
      await db.update(users).set(updates).where(eq(users.id, userId));
    }
  }

  // ==================== POSTS ====================
  
  async getAllPosts(type?: string): Promise<(Post & { user: User })[]> {
    let query = db.select().from(posts)
      .leftJoin(users, eq(posts.userId, users.id));
    
    if (type) {
      query = query.where(eq(posts.type, type));
    }
    
    const result = await query.orderBy(desc(posts.createdAt));
    
    return result.map(row => ({
      ...row.posts,
      user: row.users!
    }));
  }

  async getUserPosts(userId: number, type?: string): Promise<(Post & { user: User })[]> {
    let query = db.select().from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.userId, userId));
    
    if (type) {
      query = query.where(and(eq(posts.userId, userId), eq(posts.type, type)));
    }
    
    const result = await query.orderBy(desc(posts.createdAt));
    
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

  async deletePost(id: number): Promise<void> {
    // Get the post first to get the user ID
    const post = await this.getPost(id);
    if (!post) {
      throw new Error('Post not found');
    }
    
    // Delete all comments for this post
    await db.delete(postComments).where(eq(postComments.postId, id));
    
    // Delete all likes for this post
    await db.delete(postLikes).where(eq(postLikes.postId, id));
    
    // Delete the post
    await db.delete(posts).where(eq(posts.id, id));
    
    // Update user stats
    await this.updateUserStats(post.userId, 'postsCount', -1);
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
    const result = await db.select().from(exploits).where(eq(exploits.cveId, cveId));
    
    // If exploit code is missing, try to fetch it from external sources
    for (const exploit of result) {
      if (!exploit.exploitCode && exploit.exploitId) {
        try {
          // Try to fetch exploit code from ExploitDB
          const response = await fetch(`https://www.exploit-db.com/raw/${exploit.exploitId}`, {
            headers: {
              'User-Agent': 'Pabit/1.0 Exploit Fetcher',
              'Accept': 'text/plain,*/*'
            }
          });
          
          if (response.ok) {
            const code = await response.text();
            if (code && code.trim().length > 10) {
              // Update the database with the fetched code
              await db.update(exploits)
                .set({ exploitCode: code.trim() })
                .where(eq(exploits.id, exploit.id));
              exploit.exploitCode = code.trim();
            }
          }
        } catch (error) {
          console.error(`Failed to fetch exploit code for ${exploit.exploitId}:`, error);
        }
      }
    }
    
    return result;
  }

  async createExploit(exploit: InsertExploit): Promise<Exploit> {
    const result = await db.insert(exploits).values(exploit).returning();
    return result[0];
  }

  async updateExploitCode(exploitId: string, code: string): Promise<void> {
    await db.update(exploits)
      .set({ exploitCode: code })
      .where(eq(exploits.exploitId, exploitId));
  }

  async getExploitByEdbId(edbId: string): Promise<Exploit | undefined> {
    const result = await db.select().from(exploits).where(eq(exploits.exploitId, edbId)).limit(1);
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
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async getUserSubmissions(userId: number): Promise<(UserSubmission & { user: User })[]> {
    const result = await db.select({
      submission: userSubmissions,
      user: users
    }).from(userSubmissions)
      .leftJoin(users, eq(userSubmissions.userId, users.id))
      .where(eq(userSubmissions.userId, userId))
      .orderBy(desc(userSubmissions.createdAt));
    
    return result.map(row => ({
      ...row.submission,
      user: row.user!
    }));
  }

  async getAllSubmissions(): Promise<(UserSubmission & { user: User })[]> {
    try {
      console.log('Getting all submissions...');
      const result = await db.select({
        submission: userSubmissions,
        user: users
      }).from(userSubmissions)
        .leftJoin(users, eq(userSubmissions.userId, users.id))
        .where(eq(userSubmissions.status, 'approved'))
        .orderBy(desc(userSubmissions.createdAt));
      
      console.log('Query result:', result.length, 'rows');
      return result.map(row => ({
        ...row.submission,
        user: row.user!
      }));
    } catch (error) {
      console.error('Error in getAllSubmissions:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
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
    try {
      console.log('Getting all submissions for admin...');
      const result = await db.select({
        submission: userSubmissions,
        user: users
      }).from(userSubmissions)
        .leftJoin(users, eq(userSubmissions.userId, users.id))
        .orderBy(desc(userSubmissions.createdAt));
      
      console.log('Admin query result:', result.length, 'rows');
      return result.map(row => ({
        ...row.submission,
        user: row.user!
      }));
    } catch (error) {
      console.error('Error in getAllSubmissionsForAdmin:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async approveSubmission(id: number, adminId: number, reviewNotes?: string): Promise<void> {
    await this.updateSubmissionStatus(id, 'approved', reviewNotes, adminId);
  }

  async rejectSubmission(id: number, adminId: number, reviewNotes?: string): Promise<void> {
    await this.updateSubmissionStatus(id, 'rejected', reviewNotes, adminId);
  }

  async deleteSubmission(id: number): Promise<void> {
    const submission = await db.select().from(userSubmissions).where(eq(userSubmissions.id, id)).limit(1);
    if (submission.length === 0) {
      throw new Error('Submission not found');
    }
    
    await db.delete(userSubmissions).where(eq(userSubmissions.id, id));
  }

  async getPendingSubmissions(): Promise<(UserSubmission & { user: User })[]> {
    try {
      console.log('Getting pending submissions...');
      const result = await db.select({
        submission: userSubmissions,
        user: users
      }).from(userSubmissions)
        .leftJoin(users, eq(userSubmissions.userId, users.id))
        .where(eq(userSubmissions.status, 'pending'))
        .orderBy(desc(userSubmissions.createdAt));
      
      console.log('Pending query result:', result.length, 'rows');
      return result.map(row => ({
        ...row.submission,
        user: row.user!
      }));
    } catch (error) {
      console.error('Error in getPendingSubmissions:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
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

  // ==================== ADMIN METHODS ====================
  
  async getAdminUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, 'admin'));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }
}



