import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPostSchema } from "@shared/schema";
import { z } from "zod";
import { MitreService } from "./services/mitre-service";
import { CVEService } from "./services/cve-service";
import { ExploitService } from "./services/exploit-service";
import { NewsService } from "./services/news-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const mitreService = MitreService.getInstance();
  const cveService = CVEService.getInstance();
  const exploitService = ExploitService.getInstance();
  const newsService = NewsService.getInstance();

  // Posts endpoints
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      res.json(posts);
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
      
      // Check which CVEs have real exploits
      const exploitService = (await import('./services/exploit-service.js')).ExploitService.getInstance();
      
      // Add exploit availability to each CVE
      for (const cve of result.data) {
        try {
          const exploits = await exploitService.getExploitsForCVE(cve.cveId);
          (cve as any).hasExploits = exploits.length > 0;
          (cve as any).exploitCount = exploits.length;
        } catch (error) {
          (cve as any).hasExploits = false;
          (cve as any).exploitCount = 0;
        }
      }
      
      console.log(`CVE result: ${result.data.length} CVEs returned (page ${pageNum}/${result.totalPages}, total: ${result.total})`);
      
      res.json(result);
    } catch (error) {
      console.error('CVE API error:', error);
      res.status(500).json({ error: "Failed to fetch CVEs from NVD" });
    }
  });

  app.get("/api/cves/:id", async (req, res) => {
    try {
      const cve = await cveService.getCVE(req.params.id);
      if (!cve) {
        return res.status(404).json({ error: "CVE not found" });
      }
      res.json(cve);
    } catch (error) {
      console.error('CVE details error:', error);
      res.status(500).json({ error: "Failed to fetch CVE details" });
    }
  });

  // Exploit endpoints - new functionality
  app.get("/api/cves/:id/exploits", async (req, res) => {
    try {
      const exploits = await exploitService.getExploitsForCVE(req.params.id);
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

  // News endpoints - now using real security news aggregation
  app.get("/api/news", async (req, res) => {
    try {
      const news = await newsService.getAllNews();
      res.json(news);
    } catch (error) {
      console.error('News API error:', error);
      res.status(500).json({ error: "Failed to fetch security news" });
    }
  });

  app.get("/api/news/:id", async (req, res) => {
    try {
      const article = await newsService.getNewsById(parseInt(req.params.id));
      if (!article) {
        return res.status(404).json({ error: "News article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error('News details error:', error);
      res.status(500).json({ error: "Failed to fetch news article" });
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
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch current user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
