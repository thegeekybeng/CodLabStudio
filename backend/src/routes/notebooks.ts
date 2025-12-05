import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

const createNotebookSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string(),
  language: z.string(),
  metadata: z.record(z.any()).optional(),
});

const updateNotebookSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  language: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Get all notebooks for authenticated user
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('User ID not found', 401);
    }

    const notebooks = await prisma.notebook.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      data: notebooks,
    });
  } catch (error) {
    next(error);
  }
});

// Get single notebook
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      throw new AppError('User ID not found', 401);
    }

    const notebook = await prisma.notebook.findFirst({
      where: {
        id,
        userId, // Ensure user owns the notebook
      },
    });

    if (!notebook) {
      throw new AppError('Notebook not found', 404);
    }

    res.json({
      success: true,
      data: notebook,
    });
  } catch (error) {
    next(error);
  }
});

// Create notebook
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('User ID not found', 401);
    }

    const validated = createNotebookSchema.parse(req.body);

    const notebook = await prisma.notebook.create({
      data: {
        ...validated,
        userId,
        metadata: validated.metadata || {},
      },
    });

    res.status(201).json({
      success: true,
      data: notebook,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Invalid input data', 400));
    } else {
      next(error);
    }
  }
});

// Update notebook
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      throw new AppError('User ID not found', 401);
    }

    // Verify ownership
    const existing = await prisma.notebook.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Notebook not found', 404);
    }

    const validated = updateNotebookSchema.parse(req.body);

    const notebook = await prisma.notebook.update({
      where: { id },
      data: validated,
    });

    res.json({
      success: true,
      data: notebook,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Invalid input data', 400));
    } else {
      next(error);
    }
  }
});

// Delete notebook
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      throw new AppError('User ID not found', 401);
    }

    // Verify ownership
    const existing = await prisma.notebook.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Notebook not found', 404);
    }

    await prisma.notebook.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Notebook deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

