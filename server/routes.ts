import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertChartSchema, insertGlobalDashboardItemSchema } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Projects - protected routes
  app.get("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const projects = await storage.getProjectsByUser(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const project = await storage.getProject(req.params.id);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      console.log('[POST /api/projects] User:', userId);
      console.log('[POST /api/projects] Request body:', JSON.stringify(req.body));
      const validated = insertProjectSchema.parse({ ...req.body, userId });
      console.log('[POST /api/projects] Validated data:', JSON.stringify(validated));
      const project = await storage.createProject(validated);
      console.log('[POST /api/projects] Created project:', project.id);
      res.status(201).json(project);
    } catch (error) {
      console.error('[POST /api/projects] Error:', error);
      if (error instanceof z.ZodError) {
        console.error('[POST /api/projects] Validation errors:', JSON.stringify(error.errors));
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create project", details: String(error) });
    }
  });

  app.patch("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const existingProject = await storage.getProject(req.params.id);
      if (!existingProject || existingProject.userId !== userId) {
        return res.status(404).json({ error: "Project not found" });
      }
      const validated = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, validated);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const existingProject = await storage.getProject(req.params.id);
      if (!existingProject || existingProject.userId !== userId) {
        return res.status(404).json({ error: "Project not found" });
      }
      await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Charts - protected routes
  app.get("/api/projects/:projectId/charts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const project = await storage.getProject(req.params.projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: "Project not found" });
      }
      const charts = await storage.getChartsByProject(req.params.projectId);
      res.json(charts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch charts" });
    }
  });

  app.get("/api/charts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const chart = await storage.getChart(req.params.id);
      if (!chart) {
        return res.status(404).json({ error: "Chart not found" });
      }
      res.json(chart);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chart" });
    }
  });

  app.post("/api/charts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const project = await storage.getProject(req.body.projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: "Project not found" });
      }
      const validated = insertChartSchema.parse(req.body);
      const chart = await storage.createChart(validated);
      res.status(201).json(chart);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create chart" });
    }
  });

  app.patch("/api/charts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const validated = insertChartSchema.partial().parse(req.body);
      const chart = await storage.updateChart(req.params.id, validated);
      if (!chart) {
        return res.status(404).json({ error: "Chart not found" });
      }
      res.json(chart);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update chart" });
    }
  });

  app.delete("/api/charts/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteChart(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete chart" });
    }
  });

  // Global Dashboard Items - protected routes
  app.get("/api/global-dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const items = await storage.getGlobalDashboardItemsByUser(userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch global dashboard items" });
    }
  });

  app.post("/api/global-dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const project = await storage.getProject(req.body.projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: "Project not found" });
      }
      const validated = insertGlobalDashboardItemSchema.parse(req.body);
      const item = await storage.createGlobalDashboardItem(validated);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create global dashboard item" });
    }
  });

  app.patch("/api/global-dashboard/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { layout } = req.body;
      await storage.updateGlobalDashboardItem(req.params.id, layout);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to update global dashboard item" });
    }
  });

  app.delete("/api/global-dashboard/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteGlobalDashboardItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete global dashboard item" });
    }
  });

  return httpServer;
}
