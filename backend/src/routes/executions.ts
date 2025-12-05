import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { guestSessionMiddleware, GuestRequest } from '../middleware/guestSession';
import { executionRateLimiter } from '../middleware/rateLimiter';
import { AppError } from '../middleware/errorHandler';
import { executionService } from '../services/execution/executionService';
import { guestSessionService } from '../services/session/guestSessionService';
import { AuditActionType } from '@prisma/client';

const router = Router();

const executeCodeSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  notebookId: z.string().uuid().optional(),
});

// Get supported languages
router.get('/languages', (req, res) => {
  res.json({
    success: true,
    data: executionService.getSupportedLanguages(),
  });
});

// Execute code (supports both authenticated and guest sessions)
router.post(
  '/execute',
  guestSessionMiddleware, // Allow guest sessions
  executionRateLimiter,
  async (req: AuthRequest | GuestRequest, res, next) => {
    try {
      const authReq = req as AuthRequest;
      const guestReq = req as GuestRequest;

      let userId: string;
      let guestSessionId: string | undefined;

      // Check if authenticated user
      if (authReq.userId) {
        userId = authReq.userId;
      } else if (guestReq.guestSessionId) {
        // For guest sessions, prefix with "guest_" for identification
        // This allows us to easily identify guest executions in the database
        userId = `guest_${guestReq.guestSessionId}`;
        guestSessionId = guestReq.guestSessionId;
      } else {
        throw new AppError('Session not found. Please ensure you are logged in or in guest mode.', 401);
      }

      const validated = executeCodeSchema.parse(req.body);
      const result = await executionService.executeCode({
        ...validated,
        userId,
      });

      // Log execution for guest sessions
      if (guestSessionId) {
        await guestSessionService.logAction(
          guestSessionId,
          'EXECUTE_CODE' as AuditActionType,
          'execution',
          result.executionId,
          {
            code: validated.code.substring(0, 500), // Store first 500 chars
            language: validated.language,
          },
          req.ip || req.socket.remoteAddress || undefined,
          req.get('user-agent') || undefined
        ).catch(console.error);
      }

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

// Get execution by ID
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      throw new AppError('User ID not found', 401);
    }

    const execution = await executionService.getExecution(id, userId);

    res.json({
      success: true,
      data: execution,
    });
  } catch (error) {
    next(error);
  }
});

// Get user's executions
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('User ID not found', 401);
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const executions = await executionService.getUserExecutions(userId, limit);

    res.json({
      success: true,
      data: executions,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
