import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { packageService } from '../services/package/packageService';

const router = Router();

const installPackagesSchema = z.object({
  language: z.string().min(1),
  packages: z.array(z.string().min(1)),
  notebookId: z.string().uuid().optional(),
});

const searchPackageSchema = z.object({
  language: z.string().min(1),
  query: z.string().min(1),
});

// Get supported languages for package management
router.get('/supported', async (_req, res) => {
  res.json({
    success: true,
    data: packageService.getSupportedLanguages(),
  });
});

import { guestSessionMiddleware, GuestRequest } from '../middleware/guestSession';

// Install packages
router.post(
  '/install',
  // Conditional authentication
  (req, res, next) => {
    if (req.headers.authorization) {
      return authenticate(req as any, res, next);
    }
    next();
  },
  guestSessionMiddleware,
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
        throw new AppError('User ID not found', 401);
      }

      const validated = installPackagesSchema.parse(req.body);
      const result = await packageService.installPackages({
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
  }
);

// Search packages
router.post('/search', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const validated = searchPackageSchema.parse(req.body);
    const result = await packageService.searchPackage(
      validated.language,
      validated.query
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

// List installed packages
router.get('/installed', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const language = req.query.language as string;
    if (!language) {
      throw new AppError('Language parameter required', 400);
    }

    const result = await packageService.listInstalledPackages(language);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

