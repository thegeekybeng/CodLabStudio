import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { debugService } from '../services/debug/debugService';

const router = Router();

const startDebugSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  breakpoints: z.array(z.number().int().positive()),
  notebookId: z.string().uuid().optional(),
});

const debugCommandSchema = z.object({
  type: z.enum(['step_over', 'step_into', 'step_out', 'continue', 'pause', 'evaluate']),
  expression: z.string().optional(),
});

// Get debuggable languages
router.get('/languages', (req, res) => {
  res.json({
    success: true,
    data: debugService.getDebuggableLanguages(),
  });
});

// Start debug session
router.post('/start', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('User ID not found', 401);
    }

    const validated = startDebugSchema.parse(req.body);
    const result = await debugService.startDebugSession({
      ...validated,
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
});

// Execute debug command
router.post('/:sessionId/command', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;

    if (!userId) {
      throw new AppError('User ID not found', 401);
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
});

// Stop debug session
router.post('/:sessionId/stop', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;

    if (!userId) {
      throw new AppError('User ID not found', 401);
    }

    await debugService.stopDebugSession(sessionId, userId);

    res.json({
      success: true,
      message: 'Debug session stopped',
    });
  } catch (error) {
    next(error);
  }
});

// Get debug session
router.get('/:sessionId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;

    if (!userId) {
      throw new AppError('User ID not found', 401);
    }

    const session = await debugService.getDebugSession(sessionId, userId);

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

