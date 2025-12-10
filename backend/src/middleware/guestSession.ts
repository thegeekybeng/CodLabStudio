import { Request, Response, NextFunction } from 'express';
import { guestSessionService } from '../services/session/guestSessionService';
import { AuthRequest } from './auth';

export interface GuestRequest extends Request {
  guestSessionId?: string;
}

/**
 * Middleware to handle guest sessions
 * Extracts session ID from header or creates new one
 */
export const guestSessionMiddleware = (
  req: GuestRequest,
  res: Response,
  next: NextFunction
): void => {
  // Check if user is authenticated (not a guest)
  const authReq = req as AuthRequest;
  if (authReq.userId) {
    // Authenticated user - skip guest session handling
    return next();
  }

  // Check for guest session ID in header
  const sessionId = req.headers['x-guest-session-id'] as string;

  if (sessionId && guestSessionService.getSession(sessionId)) {
    // Existing session
    req.guestSessionId = sessionId;
    guestSessionService.updateActivity(sessionId);
  } else if (sessionId) {
    // Invalid session ID - create new one (or re-create if valid format)
    const ipAddress = req.ip || req.socket.remoteAddress || undefined;
    const userAgent = req.get('user-agent') || undefined;

    // If the provided session ID looks valid (starts with guest_), reuse it
    // This handles server restarts where in-memory sessions are lost but client keys persist
    const existingId = sessionId && sessionId.startsWith('guest_') ? sessionId : undefined;

    const newSessionId = guestSessionService.createSession(ipAddress, userAgent, existingId);
    req.guestSessionId = newSessionId;
    res.setHeader('X-Guest-Session-Id', newSessionId);
  }
  // If no session ID, don't create one automatically
  // Let the frontend create it when entering guest mode

  next();
};

/**
 * Optional authentication - allows both authenticated and guest users
 */
export const optionalAuth = (
  req: GuestRequest | AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // Try to authenticate first
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Has auth token - will be handled by authenticate middleware
    // This is just a pass-through
    return next();
  }

  // No auth token - check for guest session
  guestSessionMiddleware(req, res, next);
};

