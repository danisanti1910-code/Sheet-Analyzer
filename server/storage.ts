import type {
  Project,
  InsertProject,
  Chart,
  InsertChart,
  GlobalDashboardItem,
  InsertGlobalDashboardItem,
} from "@shared/schema";
import {
  ProjectModel,
  ChartModel,
  GlobalDashboardItemModel,
} from "./models";
import type { Document } from "mongoose";

export interface IStorage {
  getAllProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<void>;

  getChartsByProject(projectId: string): Promise<Chart[]>;
  getChart(id: string): Promise<Chart | undefined>;
  createChart(chart: InsertChart): Promise<Chart>;
  updateChart(id: string, updates: Partial<InsertChart>): Promise<Chart | undefined>;
  deleteChart(id: string): Promise<void>;

  getAllGlobalDashboardItems(): Promise<GlobalDashboardItem[]>;
  createGlobalDashboardItem(item: InsertGlobalDashboardItem): Promise<GlobalDashboardItem>;
  deleteGlobalDashboardItem(id: string): Promise<void>;
  updateGlobalDashboardItem(id: string, layout: Record<string, unknown>): Promise<void>;
}

function toPlain<T>(doc: Document | null): T | undefined {
  if (!doc) return undefined;
  return doc.toJSON() as T;
}

function toPlainRequired<T>(doc: Document): T {
  return doc.toJSON() as T;
}

export class DatabaseStorage implements IStorage {
  async getAllProjects(): Promise<Project[]> {
    const docs = await ProjectModel.find().sort({ updatedAt: -1 }).exec();
    return docs.map((d) => d.toJSON() as Project);
  }

  async getProject(id: string): Promise<Project | undefined> {
    if (!id || !isValidObjectId(id)) return undefined;
    const doc = await ProjectModel.findById(id).exec();
    return toPlain<Project>(doc);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const doc = await ProjectModel.create(project);
    return toPlainRequired<Project>(doc);
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    if (!id || !isValidObjectId(id)) return undefined;
    const doc = await ProjectModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).exec();
    return toPlain<Project>(doc);
  }

  async deleteProject(id: string): Promise<void> {
    if (!id || !isValidObjectId(id)) return;
    await ProjectModel.findByIdAndDelete(id).exec();
    await ChartModel.deleteMany({ projectId: id }).exec();
    await GlobalDashboardItemModel.deleteMany({ projectId: id }).exec();
  }

  async getChartsByProject(projectId: string): Promise<Chart[]> {
    const docs = await ChartModel.find({ projectId }).sort({ createdAt: -1 }).exec();
    return docs.map((d) => d.toJSON() as Chart);
  }

  async getChart(id: string): Promise<Chart | undefined> {
    if (!id || !isValidObjectId(id)) return undefined;
    const doc = await ChartModel.findById(id).exec();
    return toPlain<Chart>(doc);
  }

  async createChart(chart: InsertChart): Promise<Chart> {
    const doc = await ChartModel.create(chart);
    return toPlainRequired<Chart>(doc);
  }

  async updateChart(id: string, updates: Partial<InsertChart>): Promise<Chart | undefined> {
    if (!id || !isValidObjectId(id)) return undefined;
    const doc = await ChartModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).exec();
    return toPlain<Chart>(doc);
  }

  async deleteChart(id: string): Promise<void> {
    if (!id || !isValidObjectId(id)) return;
    await ChartModel.findByIdAndDelete(id).exec();
    await GlobalDashboardItemModel.deleteMany({ chartId: id }).exec();
  }

  async getAllGlobalDashboardItems(): Promise<GlobalDashboardItem[]> {
    const docs = await GlobalDashboardItemModel.find().sort({ createdAt: -1 }).exec();
    return docs.map((d) => d.toJSON() as GlobalDashboardItem);
  }

  async createGlobalDashboardItem(item: InsertGlobalDashboardItem): Promise<GlobalDashboardItem> {
    const doc = await GlobalDashboardItemModel.create(item);
    return toPlainRequired<GlobalDashboardItem>(doc);
  }

  async deleteGlobalDashboardItem(id: string): Promise<void> {
    if (!id || !isValidObjectId(id)) return;
    await GlobalDashboardItemModel.findByIdAndDelete(id).exec();
  }

  async updateGlobalDashboardItem(id: string, layout: Record<string, unknown>): Promise<void> {
    if (!id || !isValidObjectId(id)) return;
    await GlobalDashboardItemModel.findByIdAndUpdate(id, { $set: { layout } }).exec();
  }
}

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export const storage = new DatabaseStorage();
