import { z } from "zod";

// Subscription plans
export const PLAN_NAMES = ["free", "pro", "business"] as const;
export type PlanName = (typeof PLAN_NAMES)[number];

export const PLAN_LIMITS: Record<PlanName, number> = {
  free: 3,
  pro: 25,
  business: Infinity,
};

export const subscriptionStatusEnum = z.enum(["active", "canceled", "past_due", "none"]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusEnum>;

// User (for auth and admin)
const userBaseSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  useCase: z.string().optional(),
});

export const insertUserSchema = userBaseSchema;

// Registration requires password
export const registerUserSchema = userBaseSchema.extend({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

// Login only requires email + password
export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "La contraseña es requerida"),
});
// Forgot password
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// Reset password with token
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const userSchema = userBaseSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  lastActiveAt: z.coerce.date(),
  isSuperAdmin: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  /** Solo presente en BD; nunca se devuelve por la API. */
  passwordHash: z.string().optional(),
  // Stripe subscription fields
  stripeCustomerId: z.string().optional(),
  subscriptionPlan: z.enum(PLAN_NAMES).default("free"),
  stripeSubscriptionId: z.string().optional(),
  subscriptionStatus: subscriptionStatusEnum.default("none"),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;

// Zod schemas for API validation (MongoDB-compatible)
const projectBaseSchema = z.object({
  name: z.string().min(1),
  sourceUrl: z.string().optional().nullable(),
  sheetData: z.unknown().optional().nullable(),
  userId: z.string().optional().nullable(),
});

const chartBaseSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
  includeInsights: z.boolean().optional().default(false),
  chartConfig: z.record(z.unknown()),
  dashboardLayout: z.unknown().optional().nullable(),
});

const globalDashboardItemBaseSchema = z.object({
  projectId: z.string().min(1),
  chartId: z.string().min(1),
  layout: z.record(z.unknown()),
});

export const insertProjectSchema = projectBaseSchema;
export const insertChartSchema = chartBaseSchema;
export const insertGlobalDashboardItemSchema = globalDashboardItemBaseSchema;

// Document types (with id and timestamps)
export const projectSchema = projectBaseSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const chartSchema = chartBaseSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const globalDashboardItemSchema = globalDashboardItemBaseSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = z.infer<typeof projectSchema>;

export type InsertChart = z.infer<typeof insertChartSchema>;
export type Chart = z.infer<typeof chartSchema>;

export type InsertGlobalDashboardItem = z.infer<typeof insertGlobalDashboardItemSchema>;
export type GlobalDashboardItem = z.infer<typeof globalDashboardItemSchema>;
