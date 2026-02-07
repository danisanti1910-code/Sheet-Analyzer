import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { insertProjectSchema, insertChartSchema, insertGlobalDashboardItemSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

const setPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAIL ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isSuperAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validated = insertUserSchema.parse(req.body);
      const user = await storage.createOrUpdateUser(validated);
      const withRole = {
        ...user,
        isSuperAdmin: isSuperAdmin(user.email),
      };
      res.status(200).json(withRole);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to register", details: String(error) });
    }
  });

  // Asignar / cambiar contraseña del super administrador (solo emails en SUPER_ADMIN_EMAIL)
  app.post("/api/auth/set-password", async (req, res) => {
    try {
      const parsed = setPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const { email, password } = parsed.data;
      const trimmedEmail = email.trim().toLowerCase();
      if (!isSuperAdmin(trimmedEmail)) {
        return res.status(403).json({ error: "Solo un super administrador puede asignar contraseña. Añade tu email a SUPER_ADMIN_EMAIL en .env" });
      }
      const existing = await storage.getUserByEmail(trimmedEmail);
      if (!existing) {
        return res.status(400).json({ error: "Primero inicia sesión en la app con tu nombre y este email; después podrás asignar la contraseña de administrador." });
      }
      const hash = await bcrypt.hash(password, 10);
      const updated = await storage.setUserPassword(trimmedEmail, hash);
      if (!updated) {
        return res.status(500).json({ error: "No se pudo guardar la contraseña" });
      }
      res.status(200).json({ message: "Contraseña guardada. Usa esta contraseña en la página de Administración." });
    } catch (error) {
      console.error("[POST /api/auth/set-password]", error);
      res.status(500).json({ error: "Error al guardar contraseña", details: String(error) });
    }
  });

  // Admin (solo super admin): requiere email; si el usuario tiene contraseña, también X-Admin-Password
  app.get("/api/admin/users", async (req, res) => {
    try {
      const email = ((req.headers["x-user-email"] ?? req.query.email) as string) ?? "";
      const trimmedEmail = String(email).trim().toLowerCase();
      const adminPassword = (req.headers["x-admin-password"] as string) ?? "";
      if (!trimmedEmail) {
        return res.status(401).json({ error: "Falta email (header X-User-Email o query email)" });
      }
      if (!isSuperAdmin(trimmedEmail)) {
        return res.status(403).json({ error: "Forbidden: super admin only" });
      }
      const storedHash = await storage.getPasswordHash(trimmedEmail);
      if (storedHash) {
        if (!adminPassword) {
          return res.status(401).json({ error: "Contraseña de administrador requerida", code: "ADMIN_PASSWORD_REQUIRED" });
        }
        const ok = await bcrypt.compare(adminPassword, storedHash);
        if (!ok) {
          return res.status(401).json({ error: "Contraseña incorrecta" });
        }
      }
      const stats = await storage.getAdminUserStats();
      res.json(stats);
    } catch (error) {
      console.error("[GET /api/admin/users]", error);
      res.status(500).json({ error: "Failed to fetch admin users" });
    }
  });

  // Projects
  app.get("/api/projects", async (req, res) => {
    try {
      const userId = (req.query.userId as string) ?? undefined;
      const projects = await storage.getAllProjects(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
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
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validated = insertProjectSchema.parse(req.body);
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
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Charts
  app.get("/api/projects/:projectId/charts", async (req, res) => {
    try {
      const charts = await storage.getChartsByProject(req.params.projectId);
      res.json(charts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch charts" });
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
      res.status(500).json({ error: "Failed to fetch chart" });
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
      res.status(500).json({ error: "Failed to create chart" });
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
      res.status(500).json({ error: "Failed to update chart" });
    }
  });

  app.delete("/api/charts/:id", async (req, res) => {
    try {
      await storage.deleteChart(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete chart" });
    }
  });

  // Global Dashboard Items
  app.get("/api/global-dashboard", async (req, res) => {
    try {
      const items = await storage.getAllGlobalDashboardItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch global dashboard items" });
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
      res.status(500).json({ error: "Failed to create global dashboard item" });
    }
  });

  app.patch("/api/global-dashboard/:id", async (req, res) => {
    try {
      const { layout } = req.body;
      await storage.updateGlobalDashboardItem(req.params.id, layout);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to update global dashboard item" });
    }
  });

  app.delete("/api/global-dashboard/:id", async (req, res) => {
    try {
      await storage.deleteGlobalDashboardItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete global dashboard item" });
    }
  });

  return httpServer;
}
