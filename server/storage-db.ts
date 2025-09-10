import { eq, desc, like, sql, and, or, count, ilike } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import type { 
  InsertUser, 
  User, 
  InsertPost, 
  Post, 
  InsertCVE, 
  CVE, 
  InsertMitre, 
  MitreAttack, 
  InsertNews, 
  NewsArticle,
  InsertExploit,
  Exploit,
  InsertCveUpdateLog,
  CveUpdateLog
} from "@shared/schema";
import { users, posts, cveEntries, mitreAttack, newsArticles, exploits, cveUpdateLog } from "@shared/schema";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const sql_db = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql_db);
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  // Posts
  async getAllPosts(): Promise<(Post & { user: User })[]> {
    const result = await this.db
      .select({
        post: posts,
        user: users,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt));

    return result.map((row) => ({
      ...row.post,
      user: row.user!,
    }));
  }

  async getPost(id: number): Promise<Post | undefined> {
    const result = await this.db.select().from(posts).where(eq(posts.id, id)).limit(1);
    return result[0];
  }

  async createPost(post: InsertPost): Promise<Post> {
    const result = await this.db.insert(posts).values(post).returning();
    return result[0];
  }

  async updatePostInteraction(id: number, type: 'likes' | 'comments' | 'shares'): Promise<void> {
    await this.db
      .update(posts)
      .set({ [type]: sql`${posts[type]} + 1` })
      .where(eq(posts.id, id));
  }

  // CVE
  async getAllCVEs(): Promise<CVE[]> {
    return await this.db.select().from(cveEntries).orderBy(desc(cveEntries.publishedDate));
  }

  async searchCVEs(query: string, severity?: string, onlyWithExploits?: boolean): Promise<{ cves: CVE[], total: number }> {
    const conditions = [];
    
    if (query) {
      conditions.push(
        or(
          ilike(cveEntries.cveId, `%${query}%`),
          ilike(cveEntries.title, `%${query}%`),
          ilike(cveEntries.description, `%${query}%`)
        )
      );
    }
    
    if (severity && severity !== "All Severities") {
      conditions.push(eq(cveEntries.severity, severity));
    }
    
    if (onlyWithExploits) {
      conditions.push(sql`${cveEntries.exploitCount} > 0`);
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [cves, totalResult] = await Promise.all([
      this.db
        .select()
        .from(cveEntries)
        .where(whereClause)
        .orderBy(desc(cveEntries.publishedDate)),
      this.db
        .select({ count: count() })
        .from(cveEntries)
        .where(whereClause)
    ]);
    
    return { cves, total: totalResult[0].count };
  }

  async getCVE(id: string): Promise<CVE | undefined> {
    const result = await this.db.select().from(cveEntries).where(eq(cveEntries.cveId, id)).limit(1);
    return result[0];
  }

  async createOrUpdateCVE(cve: InsertCVE): Promise<CVE> {
    const result = await this.db
      .insert(cveEntries)
      .values({
        ...cve,
        exploitCount: cve.exploitCount || 0,
        lastExploitCheck: cve.lastExploitCheck || null
      })
      .onConflictDoUpdate({
        target: cveEntries.cveId,
        set: {
          title: cve.title,
          description: cve.description,
          cvssScore: cve.cvssScore,
          severity: cve.severity,
          vendor: cve.vendor,
          publishedDate: cve.publishedDate,
          updatedDate: cve.updatedDate,
          tags: cve.tags,
          activelyExploited: cve.activelyExploited
        }
      })
      .returning();
    
    return result[0];
  }

  async getCVEsPaginated(page: number, limit: number, search?: string, severity?: string, onlyWithExploits?: boolean): Promise<{ cves: CVE[], total: number }> {
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(cveEntries.cveId, `%${search}%`),
          ilike(cveEntries.title, `%${search}%`),
          ilike(cveEntries.description, `%${search}%`)
        )
      );
    }
    
    if (severity && severity !== "All Severities") {
      conditions.push(eq(cveEntries.severity, severity));
    }
    
    if (onlyWithExploits) {
      conditions.push(sql`${cveEntries.exploitCount} > 0`);
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;
    
    const [cves, totalResult] = await Promise.all([
      this.db
        .select()
        .from(cveEntries)
        .where(whereClause)
        .orderBy(desc(cveEntries.publishedDate))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(cveEntries)
        .where(whereClause)
    ]);
    
    return { cves, total: totalResult[0].count };
  }

  // Exploits
  async getExploitsForCVE(cveId: string): Promise<Exploit[]> {
    return await this.db
      .select()
      .from(exploits)
      .where(eq(exploits.cveId, cveId))
      .orderBy(desc(exploits.createdAt));
  }

  async createExploit(exploit: InsertExploit): Promise<Exploit> {
    const result = await this.db
      .insert(exploits)
      .values(exploit)
      .onConflictDoNothing()
      .returning();
    
    if (result.length > 0) {
      // Update CVE exploit count
      await this.updateCVEExploitCount(exploit.cveId);
    }
    
    return result[0];
  }

  async updateCVEExploitCount(cveId: string): Promise<void> {
    const countResult = await this.db
      .select({ count: count() })
      .from(exploits)
      .where(eq(exploits.cveId, cveId));
    
    await this.db
      .update(cveEntries)
      .set({ 
        exploitCount: countResult[0].count,
        lastExploitCheck: new Date()
      })
      .where(eq(cveEntries.cveId, cveId));
  }

  // MITRE ATT&CK
  async getAllMitreTactics(): Promise<{ tacticId: string; tacticName: string; tacticDescription: string; techniques: MitreAttack[] }[]> {
    const techniques = await this.db.select().from(mitreAttack);
    
    const tactics = new Map<string, { tacticId: string; tacticName: string; tacticDescription: string; techniques: MitreAttack[] }>();
    
    techniques.forEach(technique => {
      if (!tactics.has(technique.tacticId)) {
        tactics.set(technique.tacticId, {
          tacticId: technique.tacticId,
          tacticName: technique.tacticName,
          tacticDescription: technique.tacticDescription,
          techniques: []
        });
      }
      tactics.get(technique.tacticId)!.techniques.push(technique);
    });
    
    return Array.from(tactics.values());
  }

  async searchMitreTechniques(query: string): Promise<MitreAttack[]> {
    return await this.db
      .select()
      .from(mitreAttack)
      .where(
        or(
          ilike(mitreAttack.techniqueId, `%${query}%`),
          ilike(mitreAttack.techniqueName, `%${query}%`),
          ilike(mitreAttack.techniqueDescription, `%${query}%`)
        )
      );
  }

  // News
  async getAllNews(): Promise<NewsArticle[]> {
    return await this.db.select().from(newsArticles).orderBy(desc(newsArticles.publishedAt));
  }

  async getNews(id: number): Promise<NewsArticle | undefined> {
    const result = await this.db.select().from(newsArticles).where(eq(newsArticles.id, id)).limit(1);
    return result[0];
  }

  // Update logging
  async logCVEUpdate(log: InsertCveUpdateLog): Promise<CveUpdateLog> {
    const result = await this.db.insert(cveUpdateLog).values(log).returning();
    return result[0];
  }

  async getLatestUpdateLog(): Promise<CveUpdateLog | undefined> {
    const result = await this.db
      .select()
      .from(cveUpdateLog)
      .orderBy(desc(cveUpdateLog.lastUpdate))
      .limit(1);
    return result[0];
  }
}