import { Response, NextFunction } from 'express';
import { AuditActionType } from '@prisma/client';
import { auditService } from '../services/audit/auditService';
import { guestSessionService } from '../services/session/guestSessionService';
import { AuthRequest } from './auth';
import { GuestRequest } from './guestSession';

export const auditMiddleware = (actionType: AuditActionType) => {
  return async (req: AuthRequest | GuestRequest, res: Response, next: NextFunction): Promise<void> => {
    // Log after response is sent
    res.on('finish', () => {
      if (res.statusCode < 400) {
        const authReq = req as AuthRequest;
        const guestReq = req as GuestRequest;
        const ipAddress = req.ip || req.socket.remoteAddress || undefined;
        const userAgent = req.get('user-agent') || undefined;

        // If authenticated user, log normally
        if (authReq.userId) {
          auditService.log({
            userId: authReq.userId,
            actionType,
            resourceType: req.path.split('/')[2],
            resourceId: req.params.id,
            ipAddress,
            userAgent,
          }).catch((error) => {
            console.error('Audit logging error:', error);
          });
        }
        // If guest session, log with session tracking
        else if (guestReq.guestSessionId) {
          guestSessionService.logAction(
            guestReq.guestSessionId,
            actionType,
            req.path.split('/')[2],
            req.params.id,
            {},
            ipAddress,
            userAgent
          ).catch((error) => {
            console.error('Guest session logging error:', error);
          });
        }
      }
    });

    next();
  };
};

