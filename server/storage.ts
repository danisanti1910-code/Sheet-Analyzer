import { 
  type Project, 
  type InsertProject,
  type Chart,
  type InsertChart,
  type GlobalDashboardItem,
  type InsertGlobalDashboardItem,
  projects,
  charts,
  globalDashboardItems
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Projects
  getAllProjects(): Promise<Project[]>;
  getProjectsByUser(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<void>;
  
  // Charts
  getChartsByProject(projectId: string): Promise<Chart[]>;
  getChart(id: string): Promise<Chart | undefined>;
  createChart(chart: InsertChart): Promise<Chart>;
  updateChart(id: string, updates: Partial<InsertChart>): Promise<Chart | undefined>;
  deleteChart(id: string): Promise<void>;
  
  // Global Dashboard
  getAllGlobalDashboardItems(): Promise<GlobalDashboardItem[]>;
  getGlobalDashboardItemsByUser(userId: string): Promise<GlobalDashboardItem[]>;
  createGlobalDashboardItem(item: InsertGlobalDashboardItem): Promise<GlobalDashboardItem>;
  deleteGlobalDashboardItem(id: string): Promise<void>;
  updateGlobalDashboardItem(id: string, layout: any): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Projects
  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.updatedAt));
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Charts
  async getChartsByProject(projectId: string): Promise<Chart[]> {
    return await db.select().from(charts).where(eq(charts.projectId, projectId)).orderBy(desc(charts.createdAt));
  }

  async getChart(id: string): Promise<Chart | undefined> {
    const [chart] = await db.select().from(charts).where(eq(charts.id, id));
    return chart;
  }

  async createChart(chart: InsertChart): Promise<Chart> {
    const [newChart] = await db.insert(charts).values(chart).returning();
    return newChart;
  }

  async updateChart(id: string, updates: Partial<InsertChart>): Promise<Chart | undefined> {
    const [updated] = await db
      .update(charts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(charts.id, id))
      .returning();
    return updated;
  }

  async deleteChart(id: string): Promise<void> {
    await db.delete(charts).where(eq(charts.id, id));
  }

  // Global Dashboard
  async getAllGlobalDashboardItems(): Promise<GlobalDashboardItem[]> {
    return await db.select().from(globalDashboardItems).orderBy(desc(globalDashboardItems.createdAt));
  }

  async getGlobalDashboardItemsByUser(userId: string): Promise<GlobalDashboardItem[]> {
    return await db
      .select({ 
        id: globalDashboardItems.id,
        projectId: globalDashboardItems.projectId,
        chartId: globalDashboardItems.chartId,
        layout: globalDashboardItems.layout,
        createdAt: globalDashboardItems.createdAt
      })
      .from(globalDashboardItems)
      .innerJoin(projects, eq(globalDashboardItems.projectId, projects.id))
      .where(eq(projects.userId, userId))
      .orderBy(desc(globalDashboardItems.createdAt));
  }

  async createGlobalDashboardItem(item: InsertGlobalDashboardItem): Promise<GlobalDashboardItem> {
    const [newItem] = await db.insert(globalDashboardItems).values(item).returning();
    return newItem;
  }

  async deleteGlobalDashboardItem(id: string): Promise<void> {
    await db.delete(globalDashboardItems).where(eq(globalDashboardItems.id, id));
  }

  async updateGlobalDashboardItem(id: string, layout: any): Promise<void> {
    await db
      .update(globalDashboardItems)
      .set({ layout })
      .where(eq(globalDashboardItems.id, id));
  }
}

export const storage = new DatabaseStorage();
