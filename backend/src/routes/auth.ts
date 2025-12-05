import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth/authService';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { guestSessionService } from '../services/session/guestSessionService';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// Registration disabled - admin account is auto-created on startup
router.post('/register', async (req, res, next) => {
  next(new AppError('Registration is disabled. Please contact administrator.', 403));
});

router.post('/login', async (req, res, next) => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await authService.login(validated);

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

router.post('/refresh', async (req, res, next) => {
  try {
    const validated = refreshTokenSchema.parse(req.body);
    const tokens = await authService.refreshToken(validated.refreshToken);

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Invalid input data', 400));
    } else {
      next(error);
    }
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('User ID not found', 401);
    }

    const user = await authService.getUserById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// Create guest session
router.post('/guest/session', async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress || undefined;
    const userAgent = req.get('user-agent') || undefined;
    
    const sessionId = guestSessionService.createSession(ipAddress, userAgent);

    res.json({
      success: true,
      data: {
        sessionId,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

