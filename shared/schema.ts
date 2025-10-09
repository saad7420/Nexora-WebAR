import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'client']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'canceled', 'past_due', 'unpaid']);
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['starter', 'professional', 'enterprise']);
export const modelStatusEnum = pgEnum('model_status', ['uploading', 'processing', 'complete', 'failed']);
export const teamRoleEnum = pgEnum('team_role', ['owner', 'admin', 'editor', 'viewer']);

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('client'),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionPlan: subscriptionPlanEnum("subscription_plan").default('starter'),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workspaces
export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logoUrl: varchar("logo_url"),
  website: varchar("website"),
  contactEmail: varchar("contact_email"),
  phone: varchar("phone"),
  location: varchar("location"),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team members
export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: teamRoleEnum("role").default('viewer'),
  invitedBy: varchar("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at").defaultNow(),
  joinedAt: timestamp("joined_at"),
});

// Projects
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon"),
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  status: varchar("status").default('active'), // active, archived
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AR Models
export const arModels = pgTable("ar_models", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  category: varchar("category"),
  allergenTags: jsonb("allergen_tags").default([]),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  originalFileUrl: varchar("original_file_url"),
  glbFileUrl: varchar("glb_file_url"),
  usdzFileUrl: varchar("usdz_file_url"),
  thumbnailUrl: varchar("thumbnail_url"),
  status: modelStatusEnum("status").default('uploading'),
  processingLogs: jsonb("processing_logs").default([]),
  arSettings: jsonb("ar_settings").default({}),
  hotspots: jsonb("hotspots").default([]),
  shortLink: varchar("short_link").unique(),
  qrCodeUrl: varchar("qr_code_url"),
  metadata: jsonb("metadata").default({}), // vertices, triangles, textures, file size
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analytics Events
export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  modelId: uuid("model_id").references(() => arModels.id).notNull(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  eventType: varchar("event_type").notNull(), // view, ar_launch, hotspot_click, session_end
  sessionId: varchar("session_id"),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  country: varchar("country"),
  device: varchar("device"), // ios, android, desktop
  sessionDuration: integer("session_duration"), // seconds
  eventData: jsonb("event_data").default({}),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Subscriptions (Stripe)
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id").unique().notNull(),
  stripePriceId: varchar("stripe_price_id").notNull(),
  plan: subscriptionPlanEnum("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Usage tracking
export const usageMetrics = pgTable("usage_metrics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  month: varchar("month").notNull(), // YYYY-MM
  arViews: integer("ar_views").default(0),
  modelsCreated: integer("models_created").default(0),
  storageUsed: integer("storage_used").default(0), // in MB
  teamMembers: integer("team_members").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  teamMemberships: many(teamMembers),
  subscriptions: many(subscriptions),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  projects: many(projects),
  teamMembers: many(teamMembers),
  usageMetrics: many(usageMetrics),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
  arModels: many(arModels),
  analyticsEvents: many(analyticsEvents),
}));

export const arModelsRelations = relations(arModels, ({ one, many }) => ({
  project: one(projects, {
    fields: [arModels.projectId],
    references: [projects.id],
  }),
  analyticsEvents: many(analyticsEvents),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [teamMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  model: one(arModels, {
    fields: [analyticsEvents.modelId],
    references: [arModels.id],
  }),
  project: one(projects, {
    fields: [analyticsEvents.projectId],
    references: [projects.id],
  }),
  workspace: one(workspaces, {
    fields: [analyticsEvents.workspaceId],
    references: [workspaces.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArModelSchema = createInsertSchema(arModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  invitedAt: true,
  joinedAt: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  timestamp: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ArModel = typeof arModels.$inferSelect;
export type InsertArModel = z.infer<typeof insertArModelSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type UsageMetrics = typeof usageMetrics.$inferSelect;
