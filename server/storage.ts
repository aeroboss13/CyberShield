import { users, posts, cveEntries, exploits, mitreAttack, newsArticles, newsComments, postComments, postLikes, newsLikes, userSubmissions, type User, type InsertUser, type Post, type InsertPost, type CVE, type InsertCVE, type Exploit, type InsertExploit, type MitreAttack, type InsertMitre, type NewsArticle, type InsertNews, type NewsComment, type InsertNewsComment, type PostComment, type InsertPostComment, type PostLike, type InsertPostLike, type NewsLike, type InsertNewsLike, type UserSubmission, type InsertUserSubmission } from "@shared/schema";

interface CVESearchParams {
  search?: string;
  severity?: string;
  page: number;
  limit: number;
}

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser, passwordHash: string): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getCurrentUser(req: any): Promise<User | undefined>;
  
  // Posts
  getAllPosts(): Promise<(Post & { user: User })[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePostInteraction(id: number, type: 'likes' | 'comments' | 'shares', delta?: number): Promise<void>;
  
  // CVE
  getAllCVEs(): Promise<CVE[]>;
  searchCVEs(query: string, severity?: string): Promise<CVE[]>;
  searchCVEsPaginated(params: CVESearchParams): Promise<{ cves: CVE[]; total: number; page: number; limit: number; totalPages: number }>;
  getCVE(id: string): Promise<CVE | undefined>;
  getCVEById(id: number): Promise<CVE | undefined>;
  createOrUpdateCVE(cve: InsertCVE): Promise<CVE>;
  updateCVEEdbId(cveId: string, edbId: string): Promise<void>;
  updateCVEActiveExploitation(cveId: string, activelyExploited: boolean): Promise<void>;
  
  // Exploits
  getExploitsForCVE(cveId: string): Promise<Exploit[]>;
  createExploit(exploit: InsertExploit): Promise<Exploit>;
  updateExploitCode(exploitId: string, code: string): Promise<void>;
  getExploitByEdbId(edbId: string): Promise<Exploit | undefined>;
  getExploitById(id: number): Promise<Exploit | undefined>;
  deleteExploit(id: number): Promise<void>;
  deleteExploitByEdbId(edbId: string): Promise<void>;
  updateExploitMetadata(exploitId: string, metadata: Partial<Omit<InsertExploit, 'exploitId'>>): Promise<void>;
  
  // MITRE ATT&CK
  getAllMitreTactics(): Promise<{ tacticId: string; tacticName: string; tacticDescription: string; techniques: MitreAttack[] }[]>;
  searchMitreTechniques(query: string): Promise<MitreAttack[]>;
  
  // News
  getAllNews(): Promise<NewsArticle[]>;
  getNews(id: number): Promise<NewsArticle | undefined>;
  
  // News Comments
  getNewsComments(articleId: number): Promise<(NewsComment & { user: User })[]>;
  createNewsComment(comment: InsertNewsComment): Promise<NewsComment>;
  deleteNewsComment(id: number): Promise<void>;
  
  // Post Comments
  getPostComments(postId: number): Promise<(PostComment & { user: User })[]>;
  createPostComment(comment: InsertPostComment): Promise<PostComment>;
  deletePostComment(id: number): Promise<void>;
  getPostCommentById(id: number): Promise<PostComment | undefined>;
  
  // User Submissions
  createUserSubmission(submission: InsertUserSubmission): Promise<UserSubmission>;
  getUserSubmissions(userId: number): Promise<(UserSubmission & { user: User })[]>;
  getAllSubmissions(): Promise<(UserSubmission & { user: User })[]>;
  updateSubmissionStatus(id: number, status: string, reviewNotes?: string, reviewerId?: number): Promise<void>;
  
  // Likes
  togglePostLike(postId: number, userId: number): Promise<{ liked: boolean; likeCount: number }>;
  getPostLikeStatus(postId: number, userId: number): Promise<boolean>;
  toggleNewsLike(articleId: number, userId: number): Promise<{ liked: boolean; likeCount: number }>;
  getNewsLikeStatus(articleId: number, userId: number): Promise<boolean>;
  
  // User Statistics
  updateUserStats(userId: number, field: string, delta: number): Promise<void>;
  getUserStats(userId: number): Promise<User>;
  getUserActivityStats(userId: number): Promise<{
    postsThisWeek: number;
    likesThisWeek: number;
    commentsThisWeek: number;
    threatsAnalyzed: number;
    communityRank: number;
    weeklyPoints: number;
  }>;
  
  // Admin Operations
  isAdmin(userId: number): Promise<boolean>;
  getAllSubmissionsForAdmin(): Promise<(UserSubmission & { user: User })[]>;
  approveSubmission(id: number, adminId: number, reviewNotes?: string): Promise<void>;
  rejectSubmission(id: number, adminId: number, reviewNotes?: string): Promise<void>;
  getPendingSubmissions(): Promise<(UserSubmission & { user: User })[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private cves: Map<string, CVE>;
  private exploits: Map<number, Exploit>;
  private mitreData: Map<string, MitreAttack>;
  private news: Map<number, NewsArticle>;
  private newsComments: Map<number, NewsComment>;
  private postComments: Map<number, PostComment>;
  private postLikes: Map<number, PostLike>;
  private newsLikes: Map<number, NewsLike>;
  private userSubmissions: Map<number, UserSubmission>;
  private currentUserId: number;
  private currentSubmissionId: number;
  private currentPostId: number;
  private currentExploitId: number;
  private currentNewsId: number;
  private currentCommentId: number;
  private currentLikeId: number;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.cves = new Map();
    this.exploits = new Map();
    this.mitreData = new Map();
    this.news = new Map();
    this.newsComments = new Map();
    this.postComments = new Map();
    this.postLikes = new Map();
    this.newsLikes = new Map();
    this.userSubmissions = new Map();
    this.currentUserId = 1;
    this.currentSubmissionId = 1;
    this.currentPostId = 1;
    this.currentExploitId = 1;
    this.currentNewsId = 1;
    this.currentCommentId = 1;
    this.currentLikeId = 1;
    
    this.seedData();
  }

  private seedData() {
    // No demo data - start with empty database
    // Real data will be populated from external APIs:
    // - CVEs from NVD API
    // - MITRE ATT&CK from GitHub
    // - News from RSS feeds
    // - Users will register themselves
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getCurrentUser(req: any): Promise<User | undefined> {
    // Check if user ID is set by auth middleware
    const sessionUserId = (req as any).sessionUserId;
    if (sessionUserId) {
      return this.users.get(sessionUserId);
    }
    return undefined;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = { 
      ...user, 
      ...updates,
      id, // Ensure ID cannot be changed
      createdAt: user.createdAt // Ensure createdAt cannot be changed
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser, passwordHash: string): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      passwordHash,
      role: 'user', // Always set role to 'user' for new registrations
      bio: insertUser.bio ?? null,
      location: insertUser.location ?? null,
      website: insertUser.website ?? null,
      reputation: 0,
      postCount: 0,
      likesReceived: 0,
      commentsCount: 0,
      cveSubmissions: 0,
      exploitSubmissions: 0,
      verifiedSubmissions: 0,
      createdAt: new Date(),
      avatar: insertUser.avatar ?? null
    };
    this.users.set(id, user);
    return user;
  }

  async getAllPosts(): Promise<(Post & { user: User })[]> {
    const postsArray = Array.from(this.posts.values());
    return postsArray.map(post => ({
      ...post,
      user: this.users.get(post.userId)!
    })).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.currentPostId++;
    const post: Post = { 
      ...insertPost, 
      id, 
      likes: 0, 
      comments: 0, 
      shares: 0, 
      createdAt: new Date(),
      tags: insertPost.tags || []
    };
    this.posts.set(id, post);
    
    // Update user post count
    const user = this.users.get(insertPost.userId);
    if (user && user.postCount !== null) {
      user.postCount++;
      this.users.set(user.id, user);
    }
    
    return post;
  }

  async updatePostInteraction(id: number, type: 'likes' | 'comments' | 'shares', delta: number = 1): Promise<void> {
    const post = this.posts.get(id);
    if (post && post[type] !== null) {
      post[type] = Math.max(0, (post[type] || 0) + delta);
      this.posts.set(id, post);
    }
  }

  async getAllCVEs(): Promise<CVE[]> {
    return Array.from(this.cves.values()).sort((a, b) => 
      parseFloat(b.cvssScore || "0") - parseFloat(a.cvssScore || "0")
    );
  }

  async searchCVEs(query: string, severity?: string): Promise<CVE[]> {
    const allCVEs = Array.from(this.cves.values());
    return allCVEs.filter(cve => {
      const matchesQuery = !query || 
        cve.cveId.toLowerCase().includes(query.toLowerCase()) ||
        cve.title.toLowerCase().includes(query.toLowerCase()) ||
        cve.description.toLowerCase().includes(query.toLowerCase());
      
      const matchesSeverity = !severity || severity === "All Severities" || cve.severity === severity;
      
      return matchesQuery && matchesSeverity;
    });
  }

  async getCVE(id: string): Promise<CVE | undefined> {
    return this.cves.get(id);
  }

  async searchCVEsPaginated(params: CVESearchParams): Promise<{ cves: CVE[]; total: number; page: number; limit: number; totalPages: number }> {
    const { search: query, severity, page, limit } = params;
    const allCVEs = Array.from(this.cves.values());
    
    // Filter CVEs based on query and severity
    const filteredCVEs = allCVEs.filter(cve => {
      const matchesQuery = !query || 
        cve.cveId.toLowerCase().includes(query.toLowerCase()) ||
        cve.title.toLowerCase().includes(query.toLowerCase()) ||
        cve.description.toLowerCase().includes(query.toLowerCase()) ||
        (cve.vendor && cve.vendor.toLowerCase().includes(query.toLowerCase())) ||
        (cve.tags && cve.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())));
      
      const matchesSeverity = !severity || severity === "All Severities" || cve.severity === severity;
      
      return matchesQuery && matchesSeverity;
    });

    // Sort by CVSS score (highest first)
    const sortedCVEs = filteredCVEs.sort((a, b) => 
      parseFloat(b.cvssScore || "0") - parseFloat(a.cvssScore || "0")
    );

    const total = sortedCVEs.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCVEs = sortedCVEs.slice(startIndex, endIndex);

    return {
      cves: paginatedCVEs,
      total,
      page,
      limit,
      totalPages
    };
  }

  async getCVEById(id: number): Promise<CVE | undefined> {
    const allCVEs = Array.from(this.cves.values());
    return allCVEs.find(cve => cve.id === id);
  }

  async createOrUpdateCVE(cve: InsertCVE): Promise<CVE> {
    const existingCVE = this.cves.get(cve.cveId);
    if (existingCVE) {
      // Update existing CVE with proper null coalescing
      const updatedCVE: CVE = { 
        ...existingCVE, 
        ...cve,
        tags: cve.tags ?? existingCVE.tags,
        cvssScore: cve.cvssScore ?? existingCVE.cvssScore,
        vendor: cve.vendor ?? existingCVE.vendor,
        publishedDate: cve.publishedDate ?? existingCVE.publishedDate,
        updatedDate: cve.updatedDate ?? existingCVE.updatedDate,
        activelyExploited: cve.activelyExploited ?? existingCVE.activelyExploited,
        edbId: cve.edbId ?? existingCVE.edbId,
        references: cve.references ?? existingCVE.references ?? null
      };
      this.cves.set(cve.cveId, updatedCVE);
      return updatedCVE;
    } else {
      // Create new CVE
      const newId = Array.from(this.cves.values()).length + 1;
      const newCVE: CVE = { 
        id: newId, 
        ...cve,
        tags: cve.tags ?? [],
        cvssScore: cve.cvssScore ?? null,
        vendor: cve.vendor ?? null,
        publishedDate: cve.publishedDate ?? null,
        updatedDate: cve.updatedDate ?? null,
        activelyExploited: cve.activelyExploited ?? false,
        edbId: cve.edbId ?? null,
        references: cve.references ?? null
      };
      this.cves.set(cve.cveId, newCVE);
      return newCVE;
    }
  }

  async updateCVEEdbId(cveId: string, edbId: string): Promise<void> {
    const existingCVE = this.cves.get(cveId);
    if (existingCVE) {
      const updatedCVE: CVE = {
        ...existingCVE,
        edbId
      };
      this.cves.set(cveId, updatedCVE);
    }
  }

  async updateCVEActiveExploitation(cveId: string, activelyExploited: boolean): Promise<void> {
    const existingCVE = this.cves.get(cveId);
    if (existingCVE) {
      const updatedCVE: CVE = {
        ...existingCVE,
        activelyExploited
      };
      this.cves.set(cveId, updatedCVE);
    }
  }

  async getExploitsForCVE(cveId: string): Promise<Exploit[]> {
    const allExploits = Array.from(this.exploits.values());
    return allExploits.filter(exploit => exploit.cveId === cveId);
  }

  async createExploit(exploit: InsertExploit): Promise<Exploit> {
    const newExploit: Exploit = {
      id: this.currentExploitId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...exploit,
      verified: exploit.verified ?? false,
      exploitCode: exploit.exploitCode ?? null
    };
    this.exploits.set(newExploit.id, newExploit);
    return newExploit;
  }

  async updateExploitCode(exploitId: string, code: string): Promise<void> {
    const allExploits = Array.from(this.exploits.values());
    const exploit = allExploits.find(e => e.exploitId === exploitId);
    if (exploit) {
      exploit.exploitCode = code;
      exploit.updatedAt = new Date();
      this.exploits.set(exploit.id, exploit);
    }
  }

  async getExploitByEdbId(edbId: string): Promise<Exploit | undefined> {
    const allExploits = Array.from(this.exploits.values());
    return allExploits.find(exploit => exploit.exploitId === edbId);
  }

  async getExploitById(id: number): Promise<Exploit | undefined> {
    return this.exploits.get(id);
  }

  async deleteExploit(id: number): Promise<void> {
    this.exploits.delete(id);
  }

  async deleteExploitByEdbId(edbId: string): Promise<void> {
    const allExploits = Array.from(this.exploits.values());
    const exploit = allExploits.find(e => e.exploitId === edbId);
    if (exploit) {
      this.exploits.delete(exploit.id);
    }
  }

  async updateExploitMetadata(exploitId: string, metadata: Partial<Omit<InsertExploit, 'exploitId'>>): Promise<void> {
    const allExploits = Array.from(this.exploits.values());
    const exploit = allExploits.find(e => e.exploitId === exploitId);
    if (exploit) {
      const updatedExploit: Exploit = {
        ...exploit,
        ...metadata,
        verified: metadata.verified ?? exploit.verified,
        exploitCode: metadata.exploitCode ?? exploit.exploitCode,
        updatedAt: new Date()
      };
      this.exploits.set(exploit.id, updatedExploit);
    }
  }

  async getAllMitreTactics(): Promise<{ tacticId: string; tacticName: string; tacticDescription: string; techniques: MitreAttack[] }[]> {
    const allData = Array.from(this.mitreData.values());
    const tacticsMap = new Map<string, { tacticId: string; tacticName: string; tacticDescription: string; techniques: MitreAttack[] }>();
    
    allData.forEach(item => {
      if (!tacticsMap.has(item.tacticId)) {
        tacticsMap.set(item.tacticId, {
          tacticId: item.tacticId,
          tacticName: item.tacticName,
          tacticDescription: item.tacticDescription,
          techniques: []
        });
      }
      tacticsMap.get(item.tacticId)!.techniques.push(item);
    });
    
    return Array.from(tacticsMap.values());
  }

  async searchMitreTechniques(query: string): Promise<MitreAttack[]> {
    const allData = Array.from(this.mitreData.values());
    return allData.filter(item => 
      item.techniqueId.toLowerCase().includes(query.toLowerCase()) ||
      item.techniqueName.toLowerCase().includes(query.toLowerCase()) ||
      (item.techniqueDescription && item.techniqueDescription.toLowerCase().includes(query.toLowerCase()))
    );
  }

  async getAllNews(): Promise<NewsArticle[]> {
    return Array.from(this.news.values()).sort((a, b) => 
      (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0)
    );
  }

  async getNews(id: number): Promise<NewsArticle | undefined> {
    return this.news.get(id);
  }

  async getNewsComments(articleId: number): Promise<(NewsComment & { user: User })[]> {
    const comments = Array.from(this.newsComments.values())
      .filter(comment => comment.articleId === articleId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
    
    return comments.map(comment => {
      const user = this.users.get(comment.userId);
      return {
        ...comment,
        user: user!
      };
    });
  }

  async createNewsComment(comment: InsertNewsComment): Promise<NewsComment> {
    const newComment: NewsComment = {
      id: this.currentCommentId++,
      ...comment,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.newsComments.set(newComment.id, newComment);
    return newComment;
  }

  async deleteNewsComment(id: number): Promise<void> {
    this.newsComments.delete(id);
  }

  async getPostComments(postId: number): Promise<(PostComment & { user: User })[]> {
    const comments = Array.from(this.postComments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
    
    return comments.map(comment => {
      const user = this.users.get(comment.userId);
      return {
        ...comment,
        user: user!
      };
    });
  }

  async createPostComment(comment: InsertPostComment): Promise<PostComment> {
    const newComment: PostComment = {
      id: this.currentCommentId++,
      ...comment,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.postComments.set(newComment.id, newComment);
    return newComment;
  }

  async deletePostComment(id: number): Promise<void> {
    this.postComments.delete(id);
  }

  async getPostCommentById(id: number): Promise<PostComment | undefined> {
    return this.postComments.get(id);
  }

  // User Submissions
  async createUserSubmission(submission: InsertUserSubmission): Promise<UserSubmission> {
    const newSubmission: UserSubmission = {
      id: this.currentSubmissionId++,
      ...submission,
      tags: submission.tags ?? null,
      cvssScore: submission.cvssScore ?? null,
      severity: submission.severity ?? null,
      platform: submission.platform ?? null,
      exploitType: submission.exploitType ?? null,
      exploitCode: submission.exploitCode ?? null,
      affectedSoftware: submission.affectedSoftware ?? null,
      versions: submission.versions ?? null,
      targetCve: submission.targetCve ?? null,
      status: 'pending',
      verified: false,
      reviewNotes: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.userSubmissions.set(newSubmission.id, newSubmission);
    
    // Update user stats
    if (submission.type === 'vulnerability') {
      this.updateUserStats(submission.userId, 'cveSubmissions', 1);
    } else if (submission.type === 'exploit') {
      this.updateUserStats(submission.userId, 'exploitSubmissions', 1);
    }
    
    return newSubmission;
  }

  async getUserSubmissions(userId: number): Promise<(UserSubmission & { user: User })[]> {
    const submissions = Array.from(this.userSubmissions.values())
      .filter(submission => submission.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    
    return submissions.map(submission => {
      const user = this.users.get(submission.userId);
      return {
        ...submission,
        user: user!
      };
    });
  }

  async getAllSubmissions(): Promise<(UserSubmission & { user: User })[]> {
    const submissions = Array.from(this.userSubmissions.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    
    return submissions.map(submission => {
      const user = this.users.get(submission.userId);
      return {
        ...submission,
        user: user!
      };
    });
  }

  async updateSubmissionStatus(id: number, status: string, reviewNotes?: string, reviewerId?: number): Promise<void> {
    const submission = this.userSubmissions.get(id);
    if (submission) {
      submission.status = status;
      submission.reviewNotes = reviewNotes ?? null;
      submission.reviewedBy = reviewerId ?? null;
      submission.reviewedAt = new Date();
      submission.updatedAt = new Date();
      
      if (status === 'approved') {
        submission.verified = true;
        // Update user verified submissions count
        this.updateUserStats(submission.userId, 'verifiedSubmissions', 1);
      }
      
      this.userSubmissions.set(id, submission);
    }
  }

  // User Statistics
  async updateUserStats(userId: number, field: string, delta: number): Promise<void> {
    const user = this.users.get(userId);
    if (user && field in user) {
      const currentValue = user[field as keyof User] as number;
      (user as any)[field] = Math.max(0, (currentValue || 0) + delta);
      this.users.set(userId, user);
    }
  }

  async getUserStats(userId: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    return user;
  }

  // Admin Operations
  async isAdmin(userId: number): Promise<boolean> {
    const user = this.users.get(userId);
    return user?.role === 'admin' || false;
  }

  async getAllSubmissionsForAdmin(): Promise<(UserSubmission & { user: User })[]> {
    return Array.from(this.userSubmissions.values()).map(submission => {
      const user = this.users.get(submission.userId);
      if (!user) throw new Error('User not found');
      return { ...submission, user };
    });
  }

  async approveSubmission(id: number, adminId: number, reviewNotes?: string): Promise<void> {
    const submission = this.userSubmissions.get(id);
    if (!submission) {
      throw new Error('Submission not found');
    }

    this.userSubmissions.set(id, {
      ...submission,
      status: 'approved',
      verified: true,
      reviewNotes: reviewNotes || null,
      reviewedBy: adminId,
      reviewedAt: new Date()
    });
  }

  async rejectSubmission(id: number, adminId: number, reviewNotes?: string): Promise<void> {
    const submission = this.userSubmissions.get(id);
    if (!submission) {
      throw new Error('Submission not found');
    }

    this.userSubmissions.set(id, {
      ...submission,
      status: 'rejected',
      verified: false,
      reviewNotes: reviewNotes || null,
      reviewedBy: adminId,
      reviewedAt: new Date()
    });
  }

  async getPendingSubmissions(): Promise<(UserSubmission & { user: User })[]> {
    return Array.from(this.userSubmissions.values())
      .filter(submission => submission.status === 'pending')
      .map(submission => {
        const user = this.users.get(submission.userId);
        if (!user) throw new Error('User not found');
        return { ...submission, user };
      });
  }

  // Likes functionality
  async togglePostLike(postId: number, userId: number): Promise<{ liked: boolean; likeCount: number }> {
    const existingLike = Array.from(this.postLikes.values()).find(
      like => like.postId === postId && like.userId === userId
    );

    if (existingLike) {
      // Remove like
      this.postLikes.delete(existingLike.id);
      
      // Update post like count
      const post = this.posts.get(postId);
      if (post && (post.likes || 0) > 0) {
        post.likes = (post.likes || 0) - 1;
        this.posts.set(postId, post);
      }

      // Update user likes received count
      if (post) {
        const postAuthor = this.users.get(post.userId);
        if (postAuthor && postAuthor.likesReceived && postAuthor.likesReceived > 0) {
          postAuthor.likesReceived--;
          this.users.set(postAuthor.id, postAuthor);
        }
      }

      return { liked: false, likeCount: post?.likes || 0 };
    } else {
      // Add like
      const likeId = this.currentLikeId++;
      const newLike: PostLike = {
        id: likeId,
        postId,
        userId,
        createdAt: new Date()
      };
      this.postLikes.set(likeId, newLike);

      // Update post like count
      const post = this.posts.get(postId);
      if (post) {
        post.likes = (post.likes || 0) + 1;
        this.posts.set(postId, post);

        // Update user likes received count
        const postAuthor = this.users.get(post.userId);
        if (postAuthor) {
          postAuthor.likesReceived = (postAuthor.likesReceived || 0) + 1;
          this.users.set(postAuthor.id, postAuthor);
        }
      }

      return { liked: true, likeCount: post?.likes || 1 };
    }
  }

  async getPostLikeStatus(postId: number, userId: number): Promise<boolean> {
    return Array.from(this.postLikes.values()).some(
      like => like.postId === postId && like.userId === userId
    );
  }

  async toggleNewsLike(articleId: number, userId: number): Promise<{ liked: boolean; likeCount: number }> {
    const existingLike = Array.from(this.newsLikes.values()).find(
      like => like.articleId === articleId && like.userId === userId
    );

    const likesForArticle = Array.from(this.newsLikes.values()).filter(
      like => like.articleId === articleId
    );

    if (existingLike) {
      // Remove like
      this.newsLikes.delete(existingLike.id);
      return { liked: false, likeCount: likesForArticle.length - 1 };
    } else {
      // Add like
      const likeId = this.currentLikeId++;
      const newLike: NewsLike = {
        id: likeId,
        articleId,
        userId,
        createdAt: new Date()
      };
      this.newsLikes.set(likeId, newLike);
      return { liked: true, likeCount: likesForArticle.length + 1 };
    }
  }

  async getNewsLikeStatus(articleId: number, userId: number): Promise<boolean> {
    return Array.from(this.newsLikes.values()).some(
      like => like.articleId === articleId && like.userId === userId
    );
  }

  async getUserActivityStats(userId: number): Promise<{
    postsThisWeek: number;
    likesThisWeek: number;
    commentsThisWeek: number;
    threatsAnalyzed: number;
    communityRank: number;
    weeklyPoints: number;
  }> {
    const user = this.users.get(userId);
    if (!user) {
      return {
        postsThisWeek: 0,
        likesThisWeek: 0,
        commentsThisWeek: 0,
        threatsAnalyzed: 0,
        communityRank: 0,
        weeklyPoints: 0
      };
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Calculate posts this week
    const postsThisWeek = Array.from(this.posts.values()).filter(
      post => post.userId === userId && 
      post.createdAt && 
      post.createdAt > oneWeekAgo
    ).length;

    // Calculate likes received this week
    const likesThisWeek = Array.from(this.postLikes.values()).filter(like => {
      const post = this.posts.get(like.postId);
      return post?.userId === userId && 
             like.createdAt && 
             like.createdAt > oneWeekAgo;
    }).length;

    // Calculate comments this week
    const commentsThisWeek = Array.from(this.postComments.values()).filter(
      comment => comment.userId === userId && 
      comment.createdAt && 
      comment.createdAt > oneWeekAgo
    ).length + Array.from(this.newsComments.values()).filter(
      comment => comment.userId === userId && 
      comment.createdAt && 
      comment.createdAt > oneWeekAgo
    ).length;

    // Calculate threats analyzed (submissions)
    const threatsAnalyzed = (user.cveSubmissions || 0) + (user.exploitSubmissions || 0);

    // Calculate community rank (based on reputation)
    const allUsers = Array.from(this.users.values()).sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
    const userRank = allUsers.findIndex(u => u.id === userId) + 1;

    // Calculate weekly points (simplified calculation)
    const weeklyPoints = postsThisWeek * 5 + likesThisWeek * 2 + commentsThisWeek * 1;

    return {
      postsThisWeek,
      likesThisWeek,
      commentsThisWeek,
      threatsAnalyzed,
      communityRank: userRank,
      weeklyPoints
    };
  }
}

export const storage = new MemStorage();
