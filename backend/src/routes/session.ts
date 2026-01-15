import { Router, Response } from "express";
import prisma from "../database/client";
import { AuthRequest } from "../middleware/auth";
import {
  guestSessionMiddleware,
  GuestRequest,
} from "../middleware/guestSession";
import { AppError } from "../middleware/errorHandler";
import { sessionZipService } from "../services/session/sessionZipService";
import { sessionService } from "../services/session/sessionService";

const router = Router();

/**
 * Create/Start a new session
 */
router.post(
  "/",
  // Conditional authentication
  guestSessionMiddleware,
  async (req: AuthRequest | GuestRequest, res, next) => {
    try {
      const authReq = req as AuthRequest;
      const guestReq = req as GuestRequest;
      let userId: string;

      if (authReq.userId) {
        userId = authReq.userId;
      } else if (guestReq.guestSessionId) {
        userId = "guest_" + guestReq.guestSessionId;
      } else {
        throw new AppError("Session not found", 401);
      }

      const { language } = req.body;
      if (!language) throw new AppError("Language is required", 400);

      const result = await sessionService.createSession({
        userId,
        language,
      });

      res.json({
        success: true,
        data: {
          ...result,
          userId, // Send back the userId (e.g. guest_xyz) so frontend socket can join room
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get supported languages
 */
router.get("/languages", (_req, res) => {
  const languages = sessionService.getSupportedLanguages();
  res.json({
    success: true,
    data: languages,
  });
});

/**
 * Get session statistics (for UI display)
 */
router.get(
  "/stats",
  guestSessionMiddleware,
  async (req: AuthRequest | GuestRequest, res, next) => {
    try {
      const authReq = req as AuthRequest;
      const guestReq = req as GuestRequest;

      let userId: string | undefined;
      let guestSessionId: string | undefined;

      if (authReq.userId) {
        userId = authReq.userId;
      } else if (guestReq.guestSessionId) {
        guestSessionId = guestReq.guestSessionId;
      } else {
        throw new AppError("Session not found", 401);
      }

      // Get statistics
      const stats: any = {
        executions: 0,
        debugSessions: 0,
        notebooks: 0,
        totalSize: 0,
      };

      if (userId) {
        const [executions, debugSessions, notebooks] = await Promise.all([
          prisma.execution.count({ where: { userId } }),
          prisma.debugSession.count({ where: { userId } }),
          prisma.notebook.count({ where: { userId } }),
        ]);

        stats.executions = executions;
        stats.debugSessions = debugSessions;
        stats.notebooks = notebooks;
      } else if (guestSessionId) {
        // For guest sessions, count from audit logs
        // This is approximate - actual count would require querying audit logs
        stats.executions = 0; // Will be calculated from audit logs
        stats.debugSessions = 0;
        stats.notebooks = 0;
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Download session zip file
 * Works for both authenticated users and guest sessions
 */
router.get(
  "/download",
  guestSessionMiddleware, // Allow guest sessions
  async (req: AuthRequest | GuestRequest, res: Response, next) => {
    try {
      const authReq = req as AuthRequest;
      const guestReq = req as GuestRequest;

      let userId: string | undefined;
      let guestSessionId: string | undefined;

      // Check if authenticated user
      if (authReq.userId) {
        userId = authReq.userId;
      } else if (guestReq.guestSessionId) {
        guestSessionId = guestReq.guestSessionId;
      } else {
        throw new AppError(
          "Session not found. Please ensure you are logged in or in guest mode.",
          401
        );
      }

      // Generate zip file
      const zipBuffer = await sessionZipService.generateSessionZip({
        userId,
        guestSessionId,
        includeCode: true,
        includeExecutions: true,
        includeDebug: true,
        includeLogs: true,
      });

      // Set response headers
      const filename = `session_export_${Date.now()}.zip`;
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Length", zipBuffer.length.toString());

      // Send zip file
      res.send(zipBuffer);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get session status
 */
router.get(
  "/:sessionId",
  guestSessionMiddleware,
  async (req: AuthRequest | GuestRequest, res, next) => {
    try {
      const { sessionId } = req.params;
      const containerId = await sessionService.getSessionContainer(sessionId);

      // If we get here, session exists
      res.json({
        success: true,
        data: { sessionId, active: true, containerId },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Stop session
 */
router.delete(
  "/:sessionId",
  guestSessionMiddleware,
  async (req: AuthRequest | GuestRequest, res, next) => {
    try {
      const { sessionId } = req.params;
      await sessionService.stopSession(sessionId);
      res.json({ success: true, message: "Session stopped" });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
