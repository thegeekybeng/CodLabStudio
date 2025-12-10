import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { gitService } from '../services/git/gitService';

const router = Router();

const commitSchema = z.object({
  notebookId: z.string().uuid(),
  message: z.string().min(1),
});

const pushPullSchema = z.object({
  notebookId: z.string().uuid(),
  remote: z.string().default('origin'),
  branch: z.string().default('main'),
});

// Initialize repository
router.post('/init', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    const { notebookId } = req.body;

    if (!userId) {
      throw new AppError('User ID not found', 401);
    }

    if (!notebookId) {
      throw new AppError('Notebook ID required', 400);
    }

    const result = await gitService.initializeRepo(notebookId, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Commit changes
router.post('/commit', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('User ID not found', 401);
    }

    const validated = commitSchema.parse(req.body);
    const result = await gitService.commitChanges(
      validated.notebookId,
      userId,
      validated.message
    );

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
});

// Get status
router.get('/status/:notebookId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    const { notebookId } = req.params;

    if (!userId) {
      throw new AppError('User ID not found', 401);
    }

    const status = await gitService.getStatus(notebookId, userId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

// Get log
router.get('/log/:notebookId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { notebookId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const log = await gitService.getLog(notebookId, limit);

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
});

// Push
router.post('/push', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('User ID not found', 401);
    }

    const validated = pushPullSchema.parse(req.body);
    const result = await gitService.push(
      validated.notebookId,
      userId,
      validated.remote,
      validated.branch
    );

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
});

// Pull
router.post('/pull', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('User ID not found', 401);
    }

    const validated = pushPullSchema.parse(req.body);
    const result = await gitService.pull(
      validated.notebookId,
      userId,
      validated.remote,
      validated.branch
    );

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
});

export default router;

