import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPostSchema, insertNewsCommentSchema, insertPostCommentSchema, insertUserSubmissionSchema, publicUserSchema } from "@shared/schema";

// Helper to sanitize user data (remove email)
const toPublicUser = (u: any) => (u ? publicUserSchema.parse(u) : undefined);
import { z } from "zod";
import { MitreService } from "./services/mitre-service";
import { CVEService } from "./services/cve-service";
import { ExploitService } from "./services/exploit-service";
import { NewsService } from "./services/news-service";
import { newsRouter } from "./routes/news.js";
import { ingestionPipeline } from "./services/ingestion-pipeline";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const mitreService = MitreService.getInstance();
  const cveService = CVEService.getInstance(storage);
  const exploitService = ExploitService.getInstance();
  const newsService = NewsService.getInstance();

  // News routes with content extraction
  app.use("/api/news", newsRouter);

  // Posts endpoints
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      // Sanitize user data to prevent email exposure
      const safePosts = posts.map(post => ({
        ...post,
        user: toPublicUser((post as any).user)
      }));
      res.json(safePosts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const postData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid post data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create post" });
      }
    }
  });

  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      await storage.updatePostInteraction(postId, 'likes');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to like post" });
    }
  });

  // CVE endpoints - with server-side pagination
  app.get("/api/cves", async (req, res) => {
    try {
      const { search, severity, page = '1', limit = '100' } = req.query;
      const searchQuery = (search as string)?.trim() || "";
      const severityFilter = (severity as string)?.trim() || "";
      const pageNum = Math.max(1, parseInt(page as string));
      const limitNum = Math.min(100, Math.max(10, parseInt(limit as string))); // Min 10, Max 100 per page
      
      console.log(`CVE API request - search: "${searchQuery}", severity: "${severityFilter}", page: ${pageNum}, limit: ${limitNum}`);
      
      const result = await cveService.getCVEsPaginated({
        search: searchQuery,
        severity: severityFilter,
        page: pageNum,
        limit: limitNum
      });
      
      console.log(`CVE result: ${result.data.length} CVEs returned (page ${pageNum}/${result.totalPages}, total: ${result.total})`);
      
      res.json(result);
    } catch (error) {
      console.error('CVE API error:', error);
      res.status(500).json({ error: "Failed to fetch CVEs from NVD" });
    }
  });

  app.get("/api/cves/:id", async (req, res) => {
    try {
      const id = req.params.id;
      let cve;

      // Check if the ID is numeric (database ID) or CVE ID string
      if (/^\d+$/.test(id)) {
        // It's a numeric ID, use getCVEById
        console.log(`Fetching CVE by database ID: ${id}`);
        cve = await cveService.getCVEById(parseInt(id));
      } else {
        // It's a CVE ID string, use getCVE
        console.log(`Fetching CVE by CVE ID: ${id}`);
        cve = await cveService.getCVE(id);
      }

      if (!cve) {
        return res.status(404).json({ error: "CVE not found" });
      }
      res.json(cve);
    } catch (error) {
      console.error('CVE details error:', error);
      res.status(500).json({ error: "Failed to fetch CVE details" });
    }
  });

  // Exploit endpoints - with EDB-ID support
  app.get("/api/cves/:id/exploits", async (req, res) => {
    try {
      const cveId = req.params.id;
      const { edbId } = req.query; // Optional EDB-ID parameter
      
      console.log(`Fetching exploits for ${cveId}${edbId ? ` with EDB-ID: ${edbId}` : ''}`);
      const exploits = await exploitService.getExploitsForCVE(cveId, edbId as string);
      res.json(exploits);
    } catch (error) {
      console.error('Exploits API error:', error);
      res.status(500).json({ error: "Failed to fetch exploits" });
    }
  });

  app.get("/api/exploits/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: "Search query required" });
      }
      
      const exploits = await exploitService.searchExploits(q as string);
      res.json(exploits);
    } catch (error) {
      console.error('Exploit search error:', error);
      res.status(500).json({ error: "Failed to search exploits" });
    }
  });

  // MITRE ATT&CK endpoints - now using real MITRE data
  app.get("/api/mitre/tactics", async (req, res) => {
    try {
      const tactics = await mitreService.getAllTactics();
      res.json(tactics);
    } catch (error) {
      console.error('MITRE tactics error:', error);
      res.status(500).json({ error: "Failed to fetch MITRE tactics from GitHub" });
    }
  });

  app.get("/api/mitre/techniques", async (req, res) => {
    try {
      const { techniqueId } = req.query;
      if (techniqueId) {
        // Return specific technique details
        const techniques = await mitreService.searchTechniques(techniqueId as string);
        res.json(techniques);
      } else {
        // Return all techniques from all tactics
        const tactics = await mitreService.getAllTactics();
        const allTechniques = tactics.flatMap(tactic => tactic.techniques);
        res.json(allTechniques);
      }
    } catch (error) {
      console.error('MITRE techniques error:', error);
      res.status(500).json({ error: "Failed to fetch MITRE techniques" });
    }
  });

  app.get("/api/mitre/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: "Search query required" });
      }
      
      const techniques = await mitreService.searchTechniques(q as string);
      res.json(techniques);
    } catch (error) {
      console.error('MITRE search error:', error);
      res.status(500).json({ error: "Failed to search MITRE techniques" });
    }
  });

  app.get("/api/exploits", async (req, res) => {
    try {
      const { cveId } = req.query;
      if (!cveId) {
        return res.status(400).json({ error: "CVE ID required" });
      }
      
      const exploits = await exploitService.getExploitsForCVE(cveId as string);
      res.json(exploits);
    } catch (error) {
      console.error('Exploits API error:', error);
      res.status(500).json({ error: "Failed to fetch exploits" });
    }
  });


  // Ingestion pipeline endpoints
  app.post("/api/ingest/run", async (req, res) => {
    try {
      if (ingestionPipeline.isIngestionRunning()) {
        return res.status(409).json({ error: "Ingestion pipeline is already running" });
      }

      const { maxCVEs, startYear, endYear, concurrency } = req.body;
      const options = {
        maxCVEs: maxCVEs || 1000,      // Default: 1000 CVEs
        startYear: startYear || 2020,   // Default: from 2020
        endYear: endYear || new Date().getFullYear(),
        concurrency: concurrency || 3  // Default: 3 concurrent requests
      };

      console.log(`🚀 Starting ingestion pipeline with options:`, options);
      
      // Start ingestion in background (don't await)
      ingestionPipeline.startIngestion(options).catch(error => {
        console.error('Background ingestion error:', error);
      });

      res.json({ 
        message: "Ingestion pipeline started successfully",
        options
      });
    } catch (error) {
      console.error('Ingestion start error:', error);
      res.status(500).json({ error: "Failed to start ingestion pipeline" });
    }
  });

  app.get("/api/ingest/status", async (req, res) => {
    try {
      const progress = ingestionPipeline.getProgress();
      const isRunning = ingestionPipeline.isIngestionRunning();
      
      res.json({
        isRunning,
        ...progress
      });
    } catch (error) {
      console.error('Ingestion status error:', error);
      res.status(500).json({ error: "Failed to get ingestion status" });
    }
  });

  app.post("/api/ingest/stop", async (req, res) => {
    try {
      if (!ingestionPipeline.isIngestionRunning()) {
        return res.status(400).json({ error: "Ingestion pipeline is not running" });
      }

      await ingestionPipeline.stopIngestion();
      res.json({ message: "Ingestion pipeline stopped successfully" });
    } catch (error) {
      console.error('Ingestion stop error:', error);
      res.status(500).json({ error: "Failed to stop ingestion pipeline" });
    }
  });

  // User endpoints
  app.get("/api/users/current", async (req, res) => {
    try {
      // For demo purposes, return the first user
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(toPublicUser(user));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch current user" });
    }
  });

  // News Comments endpoints
  app.get("/api/news/:id/comments", async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      if (isNaN(articleId)) {
        return res.status(400).json({ error: "Invalid article ID" });
      }
      
      const comments = await storage.getNewsComments(articleId);
      // Sanitize user data to prevent email exposure
      const safeComments = Array.isArray(comments)
        ? comments.map(c => ({ ...c, user: toPublicUser((c as any).user) }))
        : comments;
      res.json(safeComments);
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/news/:id/comments", async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      if (isNaN(articleId)) {
        return res.status(400).json({ error: "Invalid article ID" });
      }

      // Get current user (for demo, use user ID 1)
      const currentUser = await storage.getUser(1);
      if (!currentUser) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const commentData = insertNewsCommentSchema.parse({
        ...req.body,
        articleId,
        userId: currentUser.id
      });

      const comment = await storage.createNewsComment(commentData);
      
      // Return comment with safe user info (no email)
      const commentWithUser = {
        ...comment,
        user: toPublicUser(currentUser)
      };
      
      res.status(201).json(commentWithUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid comment data", details: error.errors });
      } else {
        console.error('Create comment error:', error);
        res.status(500).json({ error: "Failed to create comment" });
      }
    }
  });

  app.delete("/api/news/comments/:commentId", async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      if (isNaN(commentId)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }

      await storage.deleteNewsComment(commentId);
      res.status(204).send();
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Post Comments endpoints
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }
      
      const comments = await storage.getPostComments(postId);
      // Sanitize user data to prevent email exposure
      const safeComments = Array.isArray(comments)
        ? comments.map(c => ({ ...c, user: toPublicUser((c as any).user) }))
        : comments;
      res.json(safeComments);
    } catch (error) {
      console.error('Get post comments error:', error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }

      // Get current user (for demo, use user ID 1)
      const currentUser = await storage.getUser(1);
      if (!currentUser) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Only accept content from client, userId comes from current user
      const { content } = req.body;
      if (!content?.trim()) {
        return res.status(400).json({ error: "Comment content is required" });
      }

      const commentData = {
        content: content.trim(),
        postId,
        userId: currentUser.id
      };

      const comment = await storage.createPostComment(commentData);
      
      // Increment post comment count
      await storage.updatePostInteraction(postId, 'comments');
      
      // Return comment with safe user info (no email) 
      const commentWithUser = {
        ...comment,
        user: toPublicUser(currentUser)
      };
      
      res.status(201).json(commentWithUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid comment data", details: error.errors });
      } else {
        console.error('Create post comment error:', error);
        res.status(500).json({ error: "Failed to create comment" });
      }
    }
  });

  app.delete("/api/posts/comments/:commentId", async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      if (isNaN(commentId)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }

      // Get current user (for demo, use user ID 1)
      const currentUser = await storage.getUser(1);
      if (!currentUser) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Check if comment exists and get its postId for decrementing count
      const comment = await storage.getPostCommentById(commentId);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      // Check ownership (for demo, allow deletion - in real app, enforce ownership)
      // if (comment.userId !== currentUser.id) {
      //   return res.status(403).json({ error: "Not authorized to delete this comment" });
      // }

      await storage.deletePostComment(commentId);
      
      // Decrement post comment count
      await storage.updatePostInteraction(comment.postId, 'comments', -1);
      
      res.status(204).send();
    } catch (error) {
      console.error('Delete post comment error:', error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // User Statistics endpoints
  app.get("/api/users/:id/stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const userStats = await storage.getUserStats(userId);
      // Sanitize user data to prevent email exposure
      res.json(toPublicUser(userStats));
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ error: "Failed to fetch user statistics" });
    }
  });

  // User Submissions endpoints
  app.post("/api/submissions", async (req, res) => {
    try {
      // Get current user (for demo, use user ID 1)
      const currentUser = await storage.getUser(1);
      if (!currentUser) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const submissionData = insertUserSubmissionSchema.parse({
        ...req.body,
        userId: currentUser.id
      });

      const submission = await storage.createUserSubmission(submissionData);
      
      // Return submission with safe user info (no email)
      const submissionWithUser = {
        ...submission,
        user: toPublicUser(currentUser)
      };
      
      res.status(201).json(submissionWithUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid submission data", details: error.errors });
      } else {
        console.error('Create submission error:', error);
        res.status(500).json({ error: "Failed to create submission" });
      }
    }
  });

  app.get("/api/submissions", async (req, res) => {
    try {
      const submissions = await storage.getAllSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error('Get submissions error:', error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.get("/api/users/:id/submissions", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const submissions = await storage.getUserSubmissions(userId);
      res.json(submissions);
    } catch (error) {
      console.error('Get user submissions error:', error);
      res.status(500).json({ error: "Failed to fetch user submissions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
