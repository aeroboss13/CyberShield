import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPostSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // CVE endpoints
  app.get("/api/cves", async (req, res) => {
    try {
      const { search, severity } = req.query;
      let cves;
      
      if (search || severity) {
        cves = await storage.searchCVEs(
          search as string || "",
          severity as string
        );
      } else {
        cves = await storage.getAllCVEs();
      }
      
      res.json(cves);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch CVEs" });
    }
  });

  app.get("/api/cves/:id", async (req, res) => {
    try {
      const cve = await storage.getCVE(req.params.id);
      if (!cve) {
        return res.status(404).json({ error: "CVE not found" });
      }
      res.json(cve);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch CVE" });
    }
  });

  // MITRE ATT&CK endpoints
  app.get("/api/mitre/tactics", async (req, res) => {
    try {
      const tactics = await storage.getAllMitreTactics();
      res.json(tactics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch MITRE tactics" });
    }
  });

  app.get("/api/mitre/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: "Search query required" });
      }
      
      const techniques = await storage.searchMitreTechniques(q as string);
      res.json(techniques);
    } catch (error) {
      res.status(500).json({ error: "Failed to search MITRE techniques" });
    }
  });

  // News endpoints
  app.get("/api/news", async (req, res) => {
    try {
      const news = await storage.getAllNews();
      res.json(news);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  app.get("/api/news/:id", async (req, res) => {
    try {
      const article = await storage.getNews(parseInt(req.params.id));
      if (!article) {
        return res.status(404).json({ error: "News article not found" });
      }
      res.json(article);
    } catch (error) {
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
