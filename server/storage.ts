import {
  users,
  workspaces,
  projects,
  arModels,
  teamMembers,
  analyticsEvents,
  subscriptions,
  usageMetrics,
  type User,
  type UpsertUser,
  type Workspace,
  type InsertWorkspace,
  type Project,
  type InsertProject,
  type ArModel,
  type InsertArModel,
  type TeamMember,
  type InsertTeamMember,
  type AnalyticsEvent,
  type InsertAnalyticsEvent,
  type Subscription,
  type UsageMetrics,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, sum } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Workspace operations
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  getWorkspacesByUserId(userId: string): Promise<Workspace[]>;
  getWorkspace(id: string): Promise<Workspace | undefined>;
  updateWorkspace(id: string, updates: Partial<InsertWorkspace>): Promise<Workspace>;
  deleteWorkspace(id: string): Promise<void>;

  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProjectsByWorkspaceId(workspaceId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // AR Model operations
  createArModel(model: InsertArModel): Promise<ArModel>;
  getModelsByProjectId(projectId: string): Promise<ArModel[]>;
  getModelsByWorkspaceId(workspaceId: string): Promise<ArModel[]>;
  getModel(id: string): Promise<ArModel | undefined>;
  getModelByShortLink(shortLink: string): Promise<ArModel | undefined>;
  updateModel(id: string, updates: Partial<InsertArModel>): Promise<ArModel>;
  deleteModel(id: string): Promise<void>;

  // Team operations
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  getTeamMembersByWorkspaceId(workspaceId: string): Promise<(TeamMember & { user: User })[]>;
  updateTeamMemberRole(id: string, role: string): Promise<TeamMember>;
  removeTeamMember(id: string): Promise<void>;
  getUserWorkspaces(userId: string): Promise<Workspace[]>;

  // Analytics operations
  recordAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalyticsEvents(filters: {
    workspaceId?: string;
    projectId?: string;
    modelId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AnalyticsEvent[]>;
  getAnalyticsSummary(workspaceId: string, days: number): Promise<{
    totalViews: number;
    arLaunches: number;
    avgSessionDuration: number;
    uniqueUsers: number;
  }>;

  // Admin operations
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  getAllWorkspaces(limit?: number, offset?: number): Promise<(Workspace & { owner: User })[]>;
  getSystemStats(): Promise<{
    totalUsers: number;
    totalWorkspaces: number;
    totalModels: number;
    totalViews: number;
  }>;

  // Usage tracking
  updateUsageMetrics(workspaceId: string, month: string, metrics: Partial<UsageMetrics>): Promise<void>;
  getUsageMetrics(workspaceId: string, months: number): Promise<UsageMetrics[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Workspace operations
  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const [newWorkspace] = await db
      .insert(workspaces)
      .values(workspace)
      .returning();
    return newWorkspace;
  }

  async getWorkspacesByUserId(userId: string): Promise<Workspace[]> {
    return await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, userId))
      .orderBy(desc(workspaces.createdAt));
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id));
    return workspace;
  }

  async updateWorkspace(id: string, updates: Partial<InsertWorkspace>): Promise<Workspace> {
    const [workspace] = await db
      .update(workspaces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workspaces.id, id))
      .returning();
    return workspace;
  }

  async deleteWorkspace(id: string): Promise<void> {
    await db.delete(workspaces).where(eq(workspaces.id, id));
  }

  // Project operations
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  async getProjectsByWorkspaceId(workspaceId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId))
      .orderBy(desc(projects.updatedAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // AR Model operations
  async createArModel(model: InsertArModel): Promise<ArModel> {
    const [newModel] = await db
      .insert(arModels)
      .values(model)
      .returning();
    return newModel;
  }

  async getModelsByProjectId(projectId: string): Promise<ArModel[]> {
    return await db
      .select()
      .from(arModels)
      .where(eq(arModels.projectId, projectId))
      .orderBy(desc(arModels.updatedAt));
  }

  async getModelsByWorkspaceId(workspaceId: string): Promise<ArModel[]> {
    return await db
      .select()
      .from(arModels)
      .leftJoin(projects, eq(arModels.projectId, projects.id))
      .where(eq(projects.workspaceId, workspaceId))
      .orderBy(desc(arModels.updatedAt));
  }

  async getModel(id: string): Promise<ArModel | undefined> {
    const [model] = await db
      .select()
      .from(arModels)
      .where(eq(arModels.id, id));
    return model;
  }

  async getModelByShortLink(shortLink: string): Promise<ArModel | undefined> {
    const [model] = await db
      .select()
      .from(arModels)
      .where(eq(arModels.shortLink, shortLink));
    return model;
  }

  async updateModel(id: string, updates: Partial<InsertArModel>): Promise<ArModel> {
    const [model] = await db
      .update(arModels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(arModels.id, id))
      .returning();
    return model;
  }

  async deleteModel(id: string): Promise<void> {
    await db.delete(arModels).where(eq(arModels.id, id));
  }

  // Team operations
  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [newMember] = await db
      .insert(teamMembers)
      .values(member)
      .returning();
    return newMember;
  }

  async getTeamMembersByWorkspaceId(workspaceId: string): Promise<(TeamMember & { user: User })[]> {
    return await db
      .select()
      .from(teamMembers)
      .leftJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.workspaceId, workspaceId)) as any;
  }

  async updateTeamMemberRole(id: string, role: string): Promise<TeamMember> {
    const [member] = await db
      .update(teamMembers)
      .set({ role: role as any })
      .where(eq(teamMembers.id, id))
      .returning();
    return member;
  }

  async removeTeamMember(id: string): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.id, id));
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const ownedWorkspaces = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, userId));

    const teamWorkspaces = await db
      .select()
      .from(workspaces)
      .leftJoin(teamMembers, eq(workspaces.id, teamMembers.workspaceId))
      .where(eq(teamMembers.userId, userId));

    return [...ownedWorkspaces, ...teamWorkspaces.map(tw => tw.workspaces!)]
      .filter((workspace, index, self) => 
        index === self.findIndex(w => w.id === workspace.id)
      );
  }

  // Analytics operations
  async recordAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [newEvent] = await db
      .insert(analyticsEvents)
      .values(event)
      .returning();
    return newEvent;
  }

  async getAnalyticsEvents(filters: {
    workspaceId?: string;
    projectId?: string;
    modelId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AnalyticsEvent[]> {
    let query = db.select().from(analyticsEvents);
    
    const conditions = [];
    if (filters.workspaceId) conditions.push(eq(analyticsEvents.workspaceId, filters.workspaceId));
    if (filters.projectId) conditions.push(eq(analyticsEvents.projectId, filters.projectId));
    if (filters.modelId) conditions.push(eq(analyticsEvents.modelId, filters.modelId));
    if (filters.startDate) conditions.push(sql`${analyticsEvents.timestamp} >= ${filters.startDate}`);
    if (filters.endDate) conditions.push(sql`${analyticsEvents.timestamp} <= ${filters.endDate}`);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(analyticsEvents.timestamp));
  }

  async getAnalyticsSummary(workspaceId: string, days: number): Promise<{
    totalViews: number;
    arLaunches: number;
    avgSessionDuration: number;
    uniqueUsers: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [summary] = await db
      .select({
        totalViews: count(sql`CASE WHEN ${analyticsEvents.eventType} = 'view' THEN 1 END`),
        arLaunches: count(sql`CASE WHEN ${analyticsEvents.eventType} = 'ar_launch' THEN 1 END`),
        avgSessionDuration: sql`AVG(${analyticsEvents.sessionDuration})`,
        uniqueUsers: sql`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.workspaceId, workspaceId),
          sql`${analyticsEvents.timestamp} >= ${startDate}`
        )
      );

    return {
      totalViews: Number(summary.totalViews) || 0,
      arLaunches: Number(summary.arLaunches) || 0,
      avgSessionDuration: Number(summary.avgSessionDuration) || 0,
      uniqueUsers: Number(summary.uniqueUsers) || 0,
    };
  }

  // Admin operations
  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt));
  }

  async getAllWorkspaces(limit = 50, offset = 0): Promise<(Workspace & { owner: User })[]> {
    return await db
      .select()
      .from(workspaces)
      .leftJoin(users, eq(workspaces.ownerId, users.id))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(workspaces.createdAt)) as any;
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalWorkspaces: number;
    totalModels: number;
    totalViews: number;
  }> {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [workspaceCount] = await db.select({ count: count() }).from(workspaces);
    const [modelCount] = await db.select({ count: count() }).from(arModels);
    const [viewCount] = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, 'view'));

    return {
      totalUsers: Number(userCount.count),
      totalWorkspaces: Number(workspaceCount.count),
      totalModels: Number(modelCount.count),
      totalViews: Number(viewCount.count),
    };
  }

  // Usage tracking
  async updateUsageMetrics(workspaceId: string, month: string, metrics: Partial<UsageMetrics>): Promise<void> {
    await db
      .insert(usageMetrics)
      .values({
        workspaceId,
        month,
        ...metrics,
      })
      .onConflictDoUpdate({
        target: [usageMetrics.workspaceId, usageMetrics.month],
        set: metrics,
      });
  }

  async getUsageMetrics(workspaceId: string, months: number): Promise<UsageMetrics[]> {
    return await db
      .select()
      .from(usageMetrics)
      .where(eq(usageMetrics.workspaceId, workspaceId))
      .orderBy(desc(usageMetrics.month))
      .limit(months);
  }
}

export const storage = new DatabaseStorage();
