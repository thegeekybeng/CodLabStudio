import { PrismaClient, AuditActionType } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogInput {
  userId?: string;
  actionType: AuditActionType;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  async log(input: AuditLogInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: input.userId || null,
          actionType: input.actionType,
          resourceType: input.resourceType || null,
          resourceId: input.resourceId || null,
          details: input.details || {},
          ipAddress: input.ipAddress || null,
          userAgent: input.userAgent || null,
        },
      });
    } catch (error) {
      // Don't throw - audit logging should not break the application
      console.error('Audit logging error:', error);
    }
  }

  async getAuditLogs(
    userId?: string,
    actionType?: AuditActionType,
    limit: number = 100
  ) {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    if (actionType) {
      where.actionType = actionType;
    }

    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }
}

export const auditService = new AuditService();

