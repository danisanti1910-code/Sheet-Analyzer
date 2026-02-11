import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";
import { insertProjectSchema, insertChartSchema, insertGlobalDashboardItemSchema, insertUserSchema, registerUserSchema, loginUserSchema, forgotPasswordSchema, resetPasswordSchema, PLAN_LIMITS } from "@shared/schema";
import type { PlanName } from "@shared/schema";
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
  
  // Auth – Register (creates new user with password + sends verification email)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validated = registerUserSchema.parse(req.body);
      const email = validated.email.trim().toLowerCase();

      // Check if user already exists
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "Ya existe una cuenta con este correo electrónico. Por favor inicia sesión." });
      }

      const hash = await bcrypt.hash(validated.password, 10);
      const user = await storage.createNewUser({
        email,
        firstName: validated.firstName,
        lastName: validated.lastName,
        useCase: validated.useCase,
        passwordHash: hash,
      });

      // Generate verification token and send email
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await storage.setVerificationToken(email, verificationToken, expiry);

      let emailSent = false;
      try {
        await sendVerificationEmail(email, verificationToken, validated.firstName);
        emailSent = true;
        console.log(`[Register] Verification email sent successfully to ${email}`);
      } catch (emailErr) {
        console.error("═══════════════════════════════════════════════════════");
        console.error("[Register] ❌ FAILED to send verification email:");
        console.error(`  Email: ${email}`);
        console.error(`  Error:`, emailErr);
        console.error(`  Error details:`, emailErr instanceof Error ? emailErr.message : String(emailErr));
        console.error("═══════════════════════════════════════════════════════");
        // Don't block registration if email fails, but log it prominently
      }

      const withRole = {
        ...user,
        isSuperAdmin: isSuperAdmin(user.email),
        emailVerified: false,
      };
      
      const message = emailSent
        ? "Cuenta creada. Revisa tu correo para verificar tu cuenta."
        : "Cuenta creada, pero hubo un problema al enviar el correo de verificación. Contacta al soporte.";
      
      res.status(201).json({ ...withRole, message, emailSent });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Error al registrar", details: String(error) });
    }
  });

  // Auth – Login (verifies email + password + checks email verified)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validated = loginUserSchema.parse(req.body);
      const email = validated.email.trim().toLowerCase();
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "No existe una cuenta con este correo electrónico." });
      }
      const storedHash = await storage.getPasswordHash(email);
      if (!storedHash) {
        return res.status(401).json({ error: "Esta cuenta no tiene contraseña configurada. Por favor regístrate de nuevo." });
      }
      const isValid = await bcrypt.compare(validated.password, storedHash);
      if (!isValid) {
        return res.status(401).json({ error: "Contraseña incorrecta." });
      }

      // Check if email is verified
      const verified = await storage.isEmailVerified(email);
      if (!verified) {
        return res.status(403).json({
          error: "Tu correo electrónico aún no ha sido verificado. Revisa tu bandeja de entrada.",
          code: "EMAIL_NOT_VERIFIED",
        });
      }

      // Update lastActiveAt
      await storage.createOrUpdateUser({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        useCase: user.useCase ?? "",
      });
      // Re-fetch to get updated data
      const updatedUser = await storage.getUserByEmail(email);
      const withRole = {
        ...updatedUser,
        isSuperAdmin: isSuperAdmin(email),
      };
      res.status(200).json(withRole);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Error al iniciar sesión", details: String(error) });
    }
  });

  // Auth – Get current user info (for session refresh)
  app.get("/api/auth/me", async (req, res) => {
    try {
      const email = (req.query.email as string)?.trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ error: "Email requerido" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      const withRole = {
        ...user,
        isSuperAdmin: isSuperAdmin(email),
      };
      res.status(200).json(withRole);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener usuario", details: String(error) });
    }
  });

  // Auth – Verify email
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const token = (req.query.token as string)?.trim();
      if (!token) {
        return res.status(400).json({ error: "Token de verificación requerido." });
      }
      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ error: "Token de verificación inválido o ya utilizado." });
      }
      // Check expiry
      const tokenData = await storage.getVerificationToken(user.email);
      if (!tokenData || new Date() > new Date(tokenData.expiry)) {
        return res.status(400).json({ error: "El enlace de verificación ha expirado. Solicita uno nuevo." });
      }
      await storage.verifyUserEmail(user.email);
      res.status(200).json({ message: "Correo verificado correctamente. Ya puedes iniciar sesión." });
    } catch (error) {
      console.error("[GET /api/auth/verify-email]", error);
      res.status(500).json({ error: "Error al verificar correo." });
    }
  });

  // Auth – Resend verification email
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email requerido." });
      }
      const trimmedEmail = email.trim().toLowerCase();
      const user = await storage.getUserByEmail(trimmedEmail);
      if (!user) {
        // Don't reveal if the email exists
        return res.status(200).json({ message: "Si el correo está registrado, recibirás un nuevo enlace de verificación." });
      }
      const verified = await storage.isEmailVerified(trimmedEmail);
      if (verified) {
        return res.status(200).json({ message: "Tu correo ya está verificado. Puedes iniciar sesión." });
      }
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await storage.setVerificationToken(trimmedEmail, verificationToken, expiry);
      try {
        await sendVerificationEmail(trimmedEmail, verificationToken, user.firstName);
      } catch (emailErr) {
        console.error("[Resend verification] Failed to send email:", emailErr);
      }
      res.status(200).json({ message: "Si el correo está registrado, recibirás un nuevo enlace de verificación." });
    } catch (error) {
      console.error("[POST /api/auth/resend-verification]", error);
      res.status(500).json({ error: "Error al reenviar verificación." });
    }
  });

  // Auth – Forgot password (sends reset email)
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const validated = forgotPasswordSchema.parse(req.body);
      const email = validated.email.trim().toLowerCase();
      const user = await storage.getUserByEmail(email);
      // Always return the same response to not reveal if email exists
      const genericMsg = "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.";
      if (!user) {
        return res.status(200).json({ message: genericMsg });
      }
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await storage.setResetPasswordToken(email, resetToken, expiry);
      try {
        await sendPasswordResetEmail(email, resetToken, user.firstName);
      } catch (emailErr) {
        console.error("[Forgot password] Failed to send email:", emailErr);
      }
      res.status(200).json({ message: genericMsg });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Error al procesar la solicitud." });
    }
  });

  // Auth – Reset password (with token)
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const validated = resetPasswordSchema.parse(req.body);
      const user = await storage.getUserByResetToken(validated.token);
      if (!user) {
        return res.status(400).json({ error: "Token de restablecimiento inválido o ya utilizado." });
      }
      // Check expiry
      if (user.resetPasswordTokenExpiry && new Date() > new Date(user.resetPasswordTokenExpiry)) {
        return res.status(400).json({ error: "El enlace de restablecimiento ha expirado. Solicita uno nuevo." });
      }
      const hash = await bcrypt.hash(validated.password, 10);
      await storage.setUserPassword(user.email, hash);
      await storage.clearResetPasswordToken(user.email);
      // Also verify the email if it wasn't verified yet (they got the email)
      const verified = await storage.isEmailVerified(user.email);
      if (!verified) {
        await storage.verifyUserEmail(user.email);
      }
      res.status(200).json({ message: "Contraseña restablecida correctamente. Ya puedes iniciar sesión." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("[POST /api/auth/reset-password]", error);
      res.status(500).json({ error: "Error al restablecer contraseña." });
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

      // --- Plan-based project limit check ---
      const userId = validated.userId;
      if (userId) {
        const user = await storage.getUserById(userId);
        if (user) {
          const plan: PlanName = (user.subscriptionPlan as PlanName) ?? "free";
          const limit = PLAN_LIMITS[plan];
          const currentCount = await storage.getProjectCountByUser(userId);
          if (currentCount >= limit) {
            return res.status(403).json({
              error: "Project limit reached",
              details: `Tu plan "${plan}" permite un máximo de ${limit} proyecto(s). Actualiza tu plan para crear más.`,
              plan,
              limit,
              current: currentCount,
            });
          }
        }
      }

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
