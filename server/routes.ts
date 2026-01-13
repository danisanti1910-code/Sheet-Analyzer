import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertChartSchema, insertGlobalDashboardItemSchema } from "@shared/schema";
import { z } from "zod";
import { formatDatabaseError, isDatabaseConnected, lastDatabaseError, testConnection } from "./db";

// Helper to create error response with detailed info
function createErrorResponse(error: any, defaultMessage: string): { error: string; details?: string; code?: string } {
  const formattedError = formatDatabaseError(error);
  const isDatabaseError = error?.code && (
    ["EAI_AGAIN", "ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "28P01", "28000", "3D000"].includes(error.code) ||
    error.message?.includes("EAI_AGAIN")
  );

  if (isDatabaseError) {
    return {
      error: "Database connection error",
      details: formattedError,
      code: "DATABASE_ERROR"
    };
  }

  return { error: defaultMessage };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    const dbConnected = await testConnection();
    res.status(dbConnected ? 200 : 503).json({
      status: dbConnected ? "healthy" : "unhealthy",
      database: {
        connected: dbConnected,
        error: lastDatabaseError
      },
      timestamp: new Date().toISOString()
    });
  });

  // Projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      console.error("[routes] Failed to fetch projects:", error);
      res.status(500).json(createErrorResponse(error, "Failed to fetch projects"));
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("[routes] Failed to fetch project:", error);
      res.status(500).json(createErrorResponse(error, "Failed to fetch project"));
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validated = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validated);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("[routes] Failed to create project:", error);
      res.status(500).json(createErrorResponse(error, "Failed to create project"));
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const validated = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, validated);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("[routes] Failed to update project:", error);
      res.status(500).json(createErrorResponse(error, "Failed to update project"));
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("[routes] Failed to delete project:", error);
      res.status(500).json(createErrorResponse(error, "Failed to delete project"));
    }
  });

  // Charts
  app.get("/api/projects/:projectId/charts", async (req, res) => {
    try {
      const charts = await storage.getChartsByProject(req.params.projectId);
      res.json(charts);
    } catch (error) {
      console.error("[routes] Failed to fetch charts:", error);
      res.status(500).json(createErrorResponse(error, "Failed to fetch charts"));
    }
  });

  app.get("/api/charts/:id", async (req, res) => {
    try {
      const chart = await storage.getChart(req.params.id);
      if (!chart) {
        return res.status(404).json({ error: "Chart not found" });
      }
      res.json(chart);
    } catch (error) {
      console.error("[routes] Failed to fetch chart:", error);
      res.status(500).json(createErrorResponse(error, "Failed to fetch chart"));
    }
  });

  app.post("/api/charts", async (req, res) => {
    try {
      const validated = insertChartSchema.parse(req.body);
      const chart = await storage.createChart(validated);
      res.status(201).json(chart);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("[routes] Failed to create chart:", error);
      res.status(500).json(createErrorResponse(error, "Failed to create chart"));
    }
  });

  app.patch("/api/charts/:id", async (req, res) => {
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
      console.error("[routes] Failed to update chart:", error);
      res.status(500).json(createErrorResponse(error, "Failed to update chart"));
    }
  });

  app.delete("/api/charts/:id", async (req, res) => {
    try {
      await storage.deleteChart(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("[routes] Failed to delete chart:", error);
      res.status(500).json(createErrorResponse(error, "Failed to delete chart"));
    }
  });

  // Global Dashboard Items
  app.get("/api/global-dashboard", async (req, res) => {
    try {
      const items = await storage.getAllGlobalDashboardItems();
      res.json(items);
    } catch (error) {
      console.error("[routes] Failed to fetch global dashboard items:", error);
      res.status(500).json(createErrorResponse(error, "Failed to fetch global dashboard items"));
    }
  });

  app.post("/api/global-dashboard", async (req, res) => {
    try {
      const validated = insertGlobalDashboardItemSchema.parse(req.body);
      const item = await storage.createGlobalDashboardItem(validated);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("[routes] Failed to create global dashboard item:", error);
      res.status(500).json(createErrorResponse(error, "Failed to create global dashboard item"));
    }
  });

  app.patch("/api/global-dashboard/:id", async (req, res) => {
    try {
      const { layout } = req.body;
      await storage.updateGlobalDashboardItem(req.params.id, layout);
      res.status(204).send();
    } catch (error) {
      console.error("[routes] Failed to update global dashboard item:", error);
      res.status(500).json(createErrorResponse(error, "Failed to update global dashboard item"));
    }
  });

  app.delete("/api/global-dashboard/:id", async (req, res) => {
    try {
      await storage.deleteGlobalDashboardItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("[routes] Failed to delete global dashboard item:", error);
      res.status(500).json(createErrorResponse(error, "Failed to delete global dashboard item"));
    }
  });

  return httpServer;
}
