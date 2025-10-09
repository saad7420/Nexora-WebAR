import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertWorkspaceSchema, insertProjectSchema, insertArModelSchema, insertAnalyticsEventSchema } from "@shared/schema";
import { fileUploadService } from "./services/file-upload";
import { modelConversionService } from "./services/model-conversion";
import { analyticsService } from "./services/analytics";
import { stripeService } from "./services/stripe-service";
import multer from "multer";
import { nanoid } from "nanoid";

const upload = multer({ 
  dest: '/tmp/uploads',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Workspace routes
  app.post('/api/workspaces', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workspaceData = insertWorkspaceSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      
      const workspace = await storage.createWorkspace(workspaceData);
      res.json(workspace);
    } catch (error) {
      console.error("Error creating workspace:", error);
      res.status(400).json({ message: "Failed to create workspace" });
    }
  });

  app.get('/api/workspaces', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workspaces = await storage.getUserWorkspaces(userId);
      res.json(workspaces);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      res.status(500).json({ message: "Failed to fetch workspaces" });
    }
  });

  app.get('/api/workspaces/:id', isAuthenticated, async (req: any, res) => {
    try {
      const workspace = await storage.getWorkspace(req.params.id);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      res.json(workspace);
    } catch (error) {
      console.error("Error fetching workspace:", error);
      res.status(500).json({ message: "Failed to fetch workspace" });
    }
  });

  app.put('/api/workspaces/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updates = insertWorkspaceSchema.partial().parse(req.body);
      const workspace = await storage.updateWorkspace(req.params.id, updates);
      res.json(workspace);
    } catch (error) {
      console.error("Error updating workspace:", error);
      res.status(400).json({ message: "Failed to update workspace" });
    }
  });

  app.delete('/api/workspaces/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteWorkspace(req.params.id);
      res.json({ message: "Workspace deleted successfully" });
    } catch (error) {
      console.error("Error deleting workspace:", error);
      res.status(500).json({ message: "Failed to delete workspace" });
    }
  });

  // Project routes
  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Failed to create project" });
    }
  });

  app.get('/api/workspaces/:workspaceId/projects', isAuthenticated, async (req: any, res) => {
    try {
      const projects = await storage.getProjectsByWorkspaceId(req.params.workspaceId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updates = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, updates);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ message: "Failed to update project" });
    }
  });

  // AR Model routes
  app.post('/api/models/upload', isAuthenticated, upload.single('model'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const modelData = insertArModelSchema.parse({
        ...req.body,
        allergenTags: req.body.allergenTags ? JSON.parse(req.body.allergenTags) : [],
        status: 'uploading',
        shortLink: nanoid(8),
      });

      // Save model record first
      const model = await storage.createArModel(modelData);

      // Upload file to cloud storage
      const fileUrl = await fileUploadService.uploadFile(req.file, model.id);
      
      // Update model with file URL and start conversion
      await storage.updateModel(model.id, { 
        originalFileUrl: fileUrl,
        status: 'processing' 
      });

      // Start async conversion process
      modelConversionService.convertModel(model.id, req.file.path);

      res.json(model);
    } catch (error) {
      console.error("Error uploading model:", error);
      res.status(400).json({ message: "Failed to upload model" });
    }
  });

  app.get('/api/projects/:projectId/models', isAuthenticated, async (req: any, res) => {
    try {
      const models = await storage.getModelsByProjectId(req.params.projectId);
      res.json(models);
    } catch (error) {
      console.error("Error fetching models:", error);
      res.status(500).json({ message: "Failed to fetch models" });
    }
  });

  app.get('/api/models/:id', async (req: any, res) => {
    try {
      const model = await storage.getModel(req.params.id);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      res.json(model);
    } catch (error) {
      console.error("Error fetching model:", error);
      res.status(500).json({ message: "Failed to fetch model" });
    }
  });

  app.get('/ar/:shortLink', async (req: any, res) => {
    try {
      const model = await storage.getModelByShortLink(req.params.shortLink);
      if (!model) {
        return res.status(404).json({ message: "AR experience not found" });
      }

      // Record analytics event
      await analyticsService.recordEvent({
        modelId: model.id,
        projectId: model.projectId,
        workspaceId: (await storage.getProject(model.projectId))?.workspaceId || '',
        eventType: 'view',
        sessionId: nanoid(),
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip,
      });

      // Return WebAR viewer HTML
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${model.name} - AR Experience</title>
          <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
          <style>
            body { margin: 0; background: transparent; }
            model-viewer { width: 100vw; height: 100vh; background-color: transparent; }
            .ar-button { position: absolute; bottom: 20px; right: 20px; }
          </style>
        </head>
        <body>
          <model-viewer
            src="${model.glbFileUrl}"
            ios-src="${model.usdzFileUrl}"
            alt="${model.description || model.name}"
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            environment-image="neutral"
            poster="${model.thumbnailUrl}"
            shadow-intensity="1"
            auto-rotate
            reveal="interaction">
            <div class="ar-button">
              <button slot="ar-button" style="background: #6366F1; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer;">
                View in AR
              </button>
            </div>
          </model-viewer>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Error serving AR experience:", error);
      res.status(500).send("Error loading AR experience");
    }
  });

  // Analytics routes
  app.post('/api/analytics/event', async (req: any, res) => {
    try {
      const eventData = insertAnalyticsEventSchema.parse(req.body);
      const event = await storage.recordAnalyticsEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error recording analytics event:", error);
      res.status(400).json({ message: "Failed to record event" });
    }
  });

  app.get('/api/analytics/:workspaceId/summary', isAuthenticated, async (req: any, res) => {
    try {
      const { days = 7 } = req.query;
      const summary = await storage.getAnalyticsSummary(
        req.params.workspaceId, 
        parseInt(days as string)
      );
      res.json(summary);
    } catch (error) {
      console.error("Error fetching analytics summary:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Team management routes
  app.post('/api/workspaces/:workspaceId/team', isAuthenticated, async (req: any, res) => {
    try {
      const teamMember = await storage.addTeamMember({
        workspaceId: req.params.workspaceId,
        userId: req.body.userId,
        role: req.body.role || 'viewer',
        invitedBy: req.user.claims.sub,
      });
      res.json(teamMember);
    } catch (error) {
      console.error("Error adding team member:", error);
      res.status(400).json({ message: "Failed to add team member" });
    }
  });

  app.get('/api/workspaces/:workspaceId/team', isAuthenticated, async (req: any, res) => {
    try {
      const teamMembers = await storage.getTeamMembersByWorkspaceId(req.params.workspaceId);
      res.json(teamMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Stripe/Billing routes
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.email) {
        return res.status(400).json({ message: "User email required" });
      }

      const subscription = await stripeService.createSubscription(
        user.email,
        user.firstName + ' ' + user.lastName,
        req.body.priceId
      );

      // Update user with Stripe customer ID
      await storage.upsertUser({
        ...user,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { limit = 50, offset = 0 } = req.query;
      const users = await storage.getAllUsers(parseInt(limit as string), parseInt(offset as string));
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
