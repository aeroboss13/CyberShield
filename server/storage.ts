import { users, posts, cveEntries, exploits, mitreAttack, newsArticles, newsComments, type User, type InsertUser, type Post, type InsertPost, type CVE, type InsertCVE, type Exploit, type InsertExploit, type MitreAttack, type InsertMitre, type NewsArticle, type InsertNews, type NewsComment, type InsertNewsComment } from "@shared/schema";

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
  createUser(user: InsertUser): Promise<User>;
  
  // Posts
  getAllPosts(): Promise<(Post & { user: User })[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePostInteraction(id: number, type: 'likes' | 'comments' | 'shares'): Promise<void>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private cves: Map<string, CVE>;
  private exploits: Map<number, Exploit>;
  private mitreData: Map<string, MitreAttack>;
  private news: Map<number, NewsArticle>;
  private newsComments: Map<number, NewsComment>;
  private currentUserId: number;
  private currentPostId: number;
  private currentExploitId: number;
  private currentNewsId: number;
  private currentCommentId: number;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.cves = new Map();
    this.exploits = new Map();
    this.mitreData = new Map();
    this.news = new Map();
    this.newsComments = new Map();
    this.currentUserId = 1;
    this.currentPostId = 1;
    this.currentExploitId = 1;
    this.currentNewsId = 1;
    this.currentCommentId = 1;
    
    this.seedData();
  }

  private seedData() {
    // Seed users
    const sampleUsers: User[] = [
      {
        id: 1,
        username: "john_smith",
        email: "john@example.com",
        name: "John Smith",
        role: "Senior Security Analyst",
        avatar: null,
        reputation: 12500,
        postCount: 847,
        createdAt: new Date()
      },
      {
        id: 2,
        username: "threat_hunter",
        email: "mike@example.com",
        name: "Mike Anderson",
        role: "Threat Hunter",
        avatar: null,
        reputation: 8900,
        postCount: 423,
        createdAt: new Date()
      },
      {
        id: 3,
        username: "incident_resp",
        email: "sarah@example.com",
        name: "Sarah Kim",
        role: "Incident Response Specialist",
        avatar: null,
        reputation: 15200,
        postCount: 672,
        createdAt: new Date()
      }
    ];

    sampleUsers.forEach(user => this.users.set(user.id, user));
    this.currentUserId = sampleUsers.length + 1;

    // Seed posts
    const samplePosts: Post[] = [
      {
        id: 1,
        userId: 2,
        content: "Just discovered a new variant of the Emotet malware family targeting financial institutions. The TTPs align with MITRE ATT&CK technique T1566.001 (Spearphishing Attachment). Full analysis in comments 🧵",
        tags: ["emotet", "malware", "threatintel"],
        likes: 156,
        comments: 24,
        shares: 43,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: 2,
        userId: 3,
        content: "🚨 CVE-2024-1337 is now being actively exploited in the wild. Remote code execution in popular CMS platform. CVSS 9.8. Patch immediately! IoCs and YARA rules shared below.",
        tags: ["cve", "rce", "exploit"],
        likes: 289,
        comments: 67,
        shares: 121,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      }
    ];

    samplePosts.forEach(post => this.posts.set(post.id, post));
    this.currentPostId = samplePosts.length + 1;

    // Seed CVEs
    const sampleCVEs: CVE[] = [
      {
        id: 1,
        cveId: "CVE-2024-1337",
        title: "Remote Code Execution in Popular CMS Platform",
        description: "Remote code execution vulnerability in popular CMS platform due to improper input validation in file upload functionality.",
        cvssScore: "9.8",
        severity: "CRITICAL",
        vendor: "WordPress",
        publishedDate: "2024-01-15",
        updatedDate: "2024-01-20",
        tags: ["rce", "cms", "fileupload", "wordpress"],
        activelyExploited: true,
        edbId: "51234"
      },
      {
        id: 2,
        cveId: "CVE-2024-0856",
        title: "SQL Injection in E-commerce Platform",
        description: "SQL injection vulnerability in e-commerce platform allowing unauthorized data access and potential system compromise.",
        cvssScore: "8.5",
        severity: "HIGH",
        vendor: "Magento",
        publishedDate: "2024-01-12",
        updatedDate: "2024-01-18",
        tags: ["sqli", "ecommerce", "magento"],
        activelyExploited: false,
        edbId: null
      },
      {
        id: 3,
        cveId: "CVE-2024-0945",
        title: "Authentication Bypass in Web Framework",
        description: "Authentication bypass vulnerability in popular web framework allowing unauthorized access to admin functionality.",
        cvssScore: "7.5",
        severity: "HIGH",
        vendor: "Laravel",
        publishedDate: "2024-01-10",
        updatedDate: "2024-01-15",
        tags: ["auth", "bypass", "framework", "laravel"],
        activelyExploited: true,
        edbId: "51445"
      },
      {
        id: 4,
        cveId: "CVE-2024-0723",
        title: "Cross-Site Scripting in Content Management",
        description: "Stored XSS vulnerability in content management system allowing execution of arbitrary JavaScript in victim browsers.",
        cvssScore: "6.1",
        severity: "MEDIUM",
        vendor: "Drupal",
        publishedDate: "2024-01-08",
        updatedDate: "2024-01-12",
        tags: ["xss", "cms", "drupal", "stored"],
        activelyExploited: false,
        edbId: null
      },
      {
        id: 5,
        cveId: "CVE-2024-1456",
        title: "Directory Traversal in File Manager",
        description: "Directory traversal vulnerability in file manager application allowing unauthorized access to system files.",
        cvssScore: "8.8",
        severity: "HIGH",
        vendor: "FileManager Pro",
        publishedDate: "2024-01-20",
        updatedDate: "2024-01-25",
        tags: ["traversal", "filemanager", "disclosure"],
        activelyExploited: true,
        edbId: "51567"
      },
      {
        id: 6,
        cveId: "CVE-2022-46663",
        title: "GFI LanGuard Code Injection",
        description: "A vulnerability exists in GFI LanGuard that allows remote code execution through insecure validation of user input.",
        cvssScore: "9.8",
        severity: "CRITICAL",
        vendor: "GFI Software",
        publishedDate: "2022-12-15",
        updatedDate: "2022-12-15",
        tags: ["rce", "code-injection", "langford"],
        activelyExploited: true,
        edbId: "52410"
      }
    ];

    sampleCVEs.forEach(cve => this.cves.set(cve.cveId, cve));

    // Seed MITRE ATT&CK data
    const sampleMitre: MitreAttack[] = [
      {
        id: 1,
        tacticId: "TA0001",
        tacticName: "Initial Access",
        tacticDescription: "The adversary is trying to get into your network.",
        techniqueId: "T1566.001",
        techniqueName: "Spearphishing Attachment",
        techniqueDescription: "Adversaries may send spearphishing emails with a malicious attachment in an attempt to gain access to victim systems."
      },
      {
        id: 2,
        tacticId: "TA0001",
        tacticName: "Initial Access",
        tacticDescription: "The adversary is trying to get into your network.",
        techniqueId: "T1190",
        techniqueName: "Exploit Public-Facing Application",
        techniqueDescription: "Adversaries may attempt to take advantage of a weakness in an Internet-facing computer or program using software, data, or commands."
      },
      {
        id: 3,
        tacticId: "TA0002",
        tacticName: "Execution",
        tacticDescription: "The adversary is trying to run malicious code.",
        techniqueId: "T1059.001",
        techniqueName: "PowerShell",
        techniqueDescription: "Adversaries may abuse PowerShell commands and scripts for execution."
      },
      {
        id: 4,
        tacticId: "TA0003",
        tacticName: "Persistence",
        tacticDescription: "The adversary is trying to maintain their foothold.",
        techniqueId: "T1547.001",
        techniqueName: "Registry Run Keys",
        techniqueDescription: "Adversaries may achieve persistence by adding a program to a startup folder or referencing it with a Registry run key."
      }
    ];

    sampleMitre.forEach(item => this.mitreData.set(`${item.tacticId}-${item.techniqueId}`, item));

    // Seed news
    const sampleNews: NewsArticle[] = [
      {
        id: 1,
        title: "Major APT Group Targets Critical Infrastructure with New Zero-Day Exploit",
        summary: "Security researchers have discovered a sophisticated campaign targeting energy and water utilities across North America. The attacks leverage a previously unknown vulnerability in industrial control systems.",
        content: "Full article content...",
        source: "ThreatPost",
        imageUrl: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
        tags: ["apt", "zeroday", "infrastructure"],
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        id: 2,
        title: "New Ransomware Family Uses AI to Evade Detection Systems",
        summary: "Cybercriminals are leveraging machine learning algorithms to create polymorphic ransomware that adapts its behavior to bypass traditional signature-based detection methods.",
        content: "Full article content...",
        source: "Dark Reading",
        imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
        tags: ["ransomware", "ai", "evasion"],
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },
      {
        id: 3,
        title: "CISA Releases Emergency Directive for Federal Agencies",
        summary: "The Cybersecurity and Infrastructure Security Agency has issued an emergency directive requiring all federal agencies to patch critical vulnerabilities within 72 hours following active exploitation reports.",
        content: "Full article content...",
        source: "SecurityWeek",
        imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
        tags: ["cisa", "directive", "federal"],
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
      }
    ];

    sampleNews.forEach(article => this.news.set(article.id, article));
    this.currentNewsId = sampleNews.length + 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      reputation: 0, 
      postCount: 0, 
      createdAt: new Date(),
      avatar: insertUser.avatar || null
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

  async updatePostInteraction(id: number, type: 'likes' | 'comments' | 'shares'): Promise<void> {
    const post = this.posts.get(id);
    if (post && post[type] !== null) {
      post[type] = (post[type] || 0) + 1;
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
        edbId: cve.edbId ?? existingCVE.edbId
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
        edbId: cve.edbId ?? null
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
}

export const storage = new MemStorage();
