import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { guestSessionMiddleware, GuestRequest } from '../middleware/guestSession';
import { AppError } from '../middleware/errorHandler';
import { debugService } from '../services/debug/debugService';
import { dockerService } from '../services/docker/dockerService';

const router = Router();

const startDebugSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  breakpoints: z.array(z.number().int().positive()).optional(),
  notebookId: z.string().uuid().optional(),
});

const debugCommandSchema = z.object({
  type: z.enum(['step_over', 'step_into', 'step_out', 'continue', 'pause', 'evaluate']),
  expression: z.string().optional(),
});

// Get debuggable languages
router.get('/languages', (_req, res) => {
  res.json({
    success: true,
    data: debugService.getDebuggableLanguages(),
  });
});

// Manual Prune (Zombie Killer)
router.post('/prune', async (_req, res, next) => {
  try {
    console.log('[DEBUG_ROUTE] Triggering manual zombie prune...');
    await dockerService.pruneSessionContainers();
    res.json({ success: true, message: 'Zombie containers pruned.' });
  } catch (error) {
    next(error);
  }
});

// Start debug session (supports both authenticated and guest sessions)
router.post(
  '/start',
  // Conditional authentication
  (req, res, next) => {
    if (req.headers.authorization) {
      return authenticate(req as any, res, next);
    }
    next();
  },
  guestSessionMiddleware, // Allow guest sessions
  async (req: AuthRequest | GuestRequest, res, next) => {
    try {
      const authReq = req as AuthRequest;
      const guestReq = req as GuestRequest;
      let userId: string;

      if (authReq.userId) {
        userId = authReq.userId;
      } else if (guestReq.guestSessionId) {
        userId = `guest_${guestReq.guestSessionId}`;
      } else {
        throw new AppError('Session not found', 401);
      }

      const validated = startDebugSchema.parse(req.body);
      console.log(`[DEBUG_ROUTE] valid body:`, validated);
      const result = await debugService.startDebugSession({
        ...validated,
        breakpoints: validated.breakpoints || [],
        userId,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError('Invalid input data', 400));
      } else {
        next(error);
      }
    }
  }
);

// Execute debug command
router.post(
  '/:sessionId/command',
  // Conditional authentication
  (req, res, next) => {
    if (req.headers.authorization) {
      return authenticate(req as any, res, next);
    }
    next();
  },
  guestSessionMiddleware, // Allow guest sessions
  async (req: AuthRequest | GuestRequest, res, next) => {
    try {
      const authReq = req as AuthRequest;
      const guestReq = req as GuestRequest;
      const { sessionId } = req.params;
      let userId: string;

      if (authReq.userId) {
        userId = authReq.userId;
      } else if (guestReq.guestSessionId) {
        userId = `guest_${guestReq.guestSessionId}`;
      } else {
        throw new AppError('Session not found', 401);
      }

      const validated = debugCommandSchema.parse(req.body);
      await debugService.executeDebugCommand(sessionId, userId, validated);

      res.json({
        success: true,
        message: 'Debug command executed',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError('Invalid input data', 400));
      } else {
        next(error);
      }
    }
  }
);

// Stop debug session
router.post(
  '/:sessionId/stop',
  // Conditional authentication
  (req, res, next) => {
    if (req.headers.authorization) {
      return authenticate(req as any, res, next);
    }
    next();
  },
  guestSessionMiddleware, // Allow guest sessions
  async (req: AuthRequest | GuestRequest, res, next) => {
    try {
      const authReq = req as AuthRequest;
      const guestReq = req as GuestRequest;
      const { sessionId } = req.params;
      let userId: string;

      if (authReq.userId) {
        userId = authReq.userId;
      } else if (guestReq.guestSessionId) {
        userId = `guest_${guestReq.guestSessionId}`;
      } else {
        throw new AppError('Session not found', 401);
      }

      await debugService.stopDebugSession(sessionId, userId);

      res.json({
        success: true,
        message: 'Debug session stopped',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get debug session
router.get(
  '/:sessionId',
  // Conditional authentication
  (req, res, next) => {
    if (req.headers.authorization) {
      return authenticate(req as any, res, next);
    }
    next();
  },
  guestSessionMiddleware, // Allow guest sessions
  async (req: AuthRequest | GuestRequest, res, next) => {
    try {
      const authReq = req as AuthRequest;
      const guestReq = req as GuestRequest;
      const { sessionId } = req.params;
      let userId: string;

      if (authReq.userId) {
        userId = authReq.userId;
      } else if (guestReq.guestSessionId) {
        userId = `guest_${guestReq.guestSessionId}`;
      } else {
        throw new AppError('Session not found', 401);
      }

      const session = await debugService.getDebugSession(sessionId, userId);

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

