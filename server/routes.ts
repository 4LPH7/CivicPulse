import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertIssueSchema, insertVoteSchema, insertCommentSchema, insertStatusUpdateSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|mp4|mov/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);
    
    if (mimeType && extName) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, videos, and PDFs are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Mock authentication middleware (replace with real authentication)
  const getCurrentUser = async (req: any): Promise<any> => {
    // In a real app, this would extract user from JWT token or session
    // For now, we'll create a mock user if none exists
    let user = await storage.getUserByEmail('demo@civicpulse.com');
    if (!user) {
      user = await storage.createUser({
        name: 'Rajesh Kumar',
        email: 'demo@civicpulse.com',
        aadhaarNumber: '1234-5678-9012',
        phoneNumber: '+91-9876543210',
        address: 'Koramangala, Bangalore',
        wardNumber: 'Ward 184',
        district: 'Bangalore Urban',
        state: 'Karnataka',
        isVerified: true,
      });
    }
    return user;
  };

  // User routes
  app.get('/api/user/profile', async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      const userWithStats = await storage.getUserWithStats(user.id);
      res.json(userWithStats);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Failed to fetch user profile' });
    }
  });

  app.put('/api/user/profile', async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      const userData = insertUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(user.id, userData);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Failed to update user profile' });
    }
  });

  app.get('/api/user/activity', async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      const activity = await storage.getUserActivity(user.id, 20);
      res.json(activity);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      res.status(500).json({ message: 'Failed to fetch user activity' });
    }
  });

  app.get('/api/user/badges', async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      const badges = await storage.getUserBadges(user.id);
      res.json(badges);
    } catch (error) {
      console.error('Error fetching user badges:', error);
      res.status(500).json({ message: 'Failed to fetch user badges' });
    }
  });

  // Issue routes
  app.get('/api/issues', async (req, res) => {
    try {
      const {
        category,
        status,
        wardNumber,
        district,
        search,
        sortBy,
        sortOrder,
        limit = '20',
        offset = '0'
      } = req.query;

      const issues = await storage.getIssues({
        category: category as string,
        status: status as string,
        wardNumber: wardNumber as string,
        district: district as string,
        search: search as string,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json(issues);
    } catch (error) {
      console.error('Error fetching issues:', error);
      res.status(500).json({ message: 'Failed to fetch issues' });
    }
  });

  app.get('/api/issues/hot', async (req, res) => {
    try {
      const { wardNumber, district } = req.query;
      const hotIssues = await storage.getHotIssues(
        wardNumber as string,
        district as string
      );
      res.json(hotIssues);
    } catch (error) {
      console.error('Error fetching hot issues:', error);
      res.status(500).json({ message: 'Failed to fetch hot issues' });
    }
  });

  app.get('/api/issues/priority', async (req, res) => {
    try {
      const { wardNumber, district } = req.query;
      const priorityIssues = await storage.getPriorityIssues(
        wardNumber as string,
        district as string
      );
      res.json(priorityIssues);
    } catch (error) {
      console.error('Error fetching priority issues:', error);
      res.status(500).json({ message: 'Failed to fetch priority issues' });
    }
  });

  app.get('/api/issues/:id', async (req, res) => {
    try {
      const issueId = parseInt(req.params.id);
      const issue = await storage.getIssueWithDetails(issueId);
      
      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }

      res.json(issue);
    } catch (error) {
      console.error('Error fetching issue:', error);
      res.status(500).json({ message: 'Failed to fetch issue' });
    }
  });

  app.post('/api/issues', upload.array('media', 5), async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      const issueData = insertIssueSchema.parse({
        ...req.body,
        createdBy: user.id,
      });

      // Handle file uploads
      const mediaUrls: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          // In a real app, you'd upload to cloud storage (AWS S3, etc.)
          const filename = `${Date.now()}-${file.originalname}`;
          const filepath = path.join('uploads', filename);
          await fs.rename(file.path, filepath);
          mediaUrls.push(`/uploads/${filename}`);
        }
      }

      const issue = await storage.createIssue({
        ...issueData,
        mediaUrls,
      });

      // Broadcast new issue to connected clients
      broadcast({
        type: 'new_issue',
        data: await storage.getIssueWithDetails(issue.id),
      });

      res.status(201).json(issue);
    } catch (error) {
      console.error('Error creating issue:', error);
      res.status(500).json({ message: 'Failed to create issue' });
    }
  });

  app.put('/api/issues/:id/status', async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      const issueId = parseInt(req.params.id);
      const { status, message } = req.body;

      const statusUpdate = await storage.createStatusUpdate({
        issueId,
        userId: user.id,
        status,
        message,
      });

      const updatedIssue = await storage.getIssueWithDetails(issueId);

      // Broadcast status update
      broadcast({
        type: 'status_update',
        data: {
          issueId,
          status,
          message,
          issue: updatedIssue,
        },
      });

      res.json(statusUpdate);
    } catch (error) {
      console.error('Error updating issue status:', error);
      res.status(500).json({ message: 'Failed to update issue status' });
    }
  });

  // Vote routes
  app.post('/api/issues/:id/vote', async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      const issueId = parseInt(req.params.id);
      const voteData = insertVoteSchema.parse({
        issueId,
        userId: user.id,
        rating: req.body.rating,
      });

      // Check if user already voted
      const existingVote = await storage.getUserVoteForIssue(user.id, issueId);
      
      let vote;
      if (existingVote) {
        vote = await storage.updateVote(existingVote.id, voteData.rating);
      } else {
        vote = await storage.createVote(voteData);
      }

      // Check escalation thresholds
      await storage.checkEscalationThresholds(issueId);

      const updatedIssue = await storage.getIssueWithDetails(issueId);

      // Broadcast vote update
      broadcast({
        type: 'vote_update',
        data: {
          issueId,
          vote,
          issue: updatedIssue,
        },
      });

      res.json(vote);
    } catch (error) {
      console.error('Error voting on issue:', error);
      res.status(500).json({ message: 'Failed to vote on issue' });
    }
  });

  app.get('/api/issues/:id/my-vote', async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      const issueId = parseInt(req.params.id);
      const vote = await storage.getUserVoteForIssue(user.id, issueId);
      res.json(vote || null);
    } catch (error) {
      console.error('Error fetching user vote:', error);
      res.status(500).json({ message: 'Failed to fetch user vote' });
    }
  });

  // Comment routes
  app.get('/api/issues/:id/comments', async (req, res) => {
    try {
      const issueId = parseInt(req.params.id);
      const comments = await storage.getIssueComments(issueId);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  });

  app.post('/api/issues/:id/comments', async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      const issueId = parseInt(req.params.id);
      const commentData = insertCommentSchema.parse({
        issueId,
        userId: user.id,
        content: req.body.content,
        isAnonymous: req.body.isAnonymous || false,
      });

      const comment = await storage.createComment(commentData);

      // Broadcast new comment
      broadcast({
        type: 'new_comment',
        data: {
          issueId,
          comment,
        },
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: 'Failed to create comment' });
    }
  });

  // Analytics routes
  app.get('/api/analytics/dashboard', async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      const { wardNumber, district } = req.query;

      const [issueStats, categoryStats, userStats] = await Promise.all([
        storage.getIssueStats(wardNumber as string, district as string),
        storage.getCategoryStats(wardNumber as string, district as string),
        storage.getUserStats(user.id),
      ]);

      res.json({
        issueStats,
        categoryStats,
        userStats,
      });
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard analytics' });
    }
  });

  app.get('/api/analytics/government', async (req, res) => {
    try {
      const { wardNumber, district } = req.query;

      const [issueStats, categoryStats, priorityIssues] = await Promise.all([
        storage.getIssueStats(wardNumber as string, district as string),
        storage.getCategoryStats(wardNumber as string, district as string),
        storage.getPriorityIssues(wardNumber as string, district as string),
      ]);

      res.json({
        issueStats,
        categoryStats,
        priorityIssues,
      });
    } catch (error) {
      console.error('Error fetching government analytics:', error);
      res.status(500).json({ message: 'Failed to fetch government analytics' });
    }
  });

  // File serving for uploads
  app.use('/uploads', async (req, res, next) => {
    try {
      const filePath = path.join(process.cwd(), 'uploads', req.path);
      await fs.access(filePath);
      res.sendFile(filePath);
    } catch (error) {
      res.status(404).json({ message: 'File not found' });
    }
  });

  return httpServer;
}
