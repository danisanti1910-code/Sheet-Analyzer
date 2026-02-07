import { z } from "zod";

// User (for auth and admin)
const userBaseSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  useCase: z.string().optional(),
});

export const insertUserSchema = userBaseSchema;
export const userSchema = userBaseSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  lastActiveAt: z.coerce.date(),
  isSuperAdmin: z.boolean().optional(),
  /** Solo presente en BD; nunca se devuelve por la API. */
  passwordHash: z.string().optional(),
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
