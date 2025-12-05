import { v4 as uuidv4 } from 'uuid';
import { auditService } from '../audit/auditService';
import { AuditActionType } from '@prisma/client';

export interface GuestSession {
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
  actions: number;
}

export class GuestSessionService {
  private sessions = new Map<string, GuestSession>();

  /**
   * Create a new guest session
   */
  createSession(ipAddress?: string, userAgent?: string): string {
    const sessionId = `guest_${uuidv4()}`;
    const now = new Date();

    const session: GuestSession = {
      sessionId,
      startTime: now,
      lastActivity: now,
      ipAddress,
      userAgent,
      actions: 0,
    };

    this.sessions.set(sessionId, session);

    // Log session creation
    auditService.log({
      userId: null, // Guest sessions have no userId
      actionType: 'LOGIN' as AuditActionType, // Reuse LOGIN for session start
      resourceType: 'session',
      resourceId: sessionId,
      details: {
        sessionType: 'guest',
        startTime: now.toISOString(),
        ipAddress,
        userAgent,
      },
      ipAddress,
      userAgent,
    }).catch((error) => {
      console.error('Failed to log guest session creation:', error);
    });

    console.log(`[SESSION] Guest session created: ${sessionId}`);
    return sessionId;
  }

  /**
   * Get session information
   */
  getSession(sessionId: string): GuestSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Update session activity
   */
  updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      session.actions++;
    }
  }

  /**
   * Log action for guest session
   */
  async logAction(
    sessionId: string,
    actionType: AuditActionType,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[SESSION] Attempted to log action for unknown session: ${sessionId}`);
      return;
    }

    // Update session activity
    this.updateActivity(sessionId);

    // Log to audit service
    await auditService.log({
      userId: null, // Guest sessions have no userId
      actionType,
      resourceType,
      resourceId,
      details: {
        ...details,
        sessionId,
        sessionStartTime: session.startTime.toISOString(),
        sessionDuration: Date.now() - session.startTime.getTime(),
        totalActions: session.actions,
      },
      ipAddress: ipAddress || session.ipAddress,
      userAgent: userAgent || session.userAgent,
    });
  }

  /**
   * End session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    const duration = Date.now() - session.startTime.getTime();

    // Log session end
    await auditService.log({
      userId: null,
      actionType: 'LOGOUT' as AuditActionType, // Reuse LOGOUT for session end
      resourceType: 'session',
      resourceId: sessionId,
      details: {
        sessionType: 'guest',
        endTime: new Date().toISOString(),
        startTime: session.startTime.toISOString(),
        duration,
        totalActions: session.actions,
      },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    // Remove from memory
    this.sessions.delete(sessionId);
    console.log(`[SESSION] Guest session ended: ${sessionId} (${duration}ms, ${session.actions} actions)`);
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): {
    duration: number;
    actions: number;
    startTime: Date;
    lastActivity: Date;
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      duration: Date.now() - session.startTime.getTime(),
      actions: session.actions,
      startTime: session.startTime,
      lastActivity: session.lastActivity,
    };
  }

  /**
   * Clean up old sessions (older than 24 hours)
   */
  cleanupOldSessions(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.startTime.getTime() > maxAge) {
        this.endSession(sessionId).catch((error) => {
          console.error(`Failed to end old session ${sessionId}:`, error);
        });
      }
    }
  }
}

export const guestSessionService = new GuestSessionService();

// Clean up old sessions every hour
setInterval(() => {
  guestSessionService.cleanupOldSessions();
}, 60 * 60 * 1000);

