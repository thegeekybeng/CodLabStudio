import { Server, Socket } from 'socket.io';
import { collaborationService } from '../collaboration/collaborationService';
import { sessionService } from '../session/sessionService';

const DISCONNECT_GRACE_PERIOD = 30000; // 30 seconds debounce

// Singleton instance
let ioInstance: Server | null = null;
const disconnectTimeouts = new Map<string, NodeJS.Timeout>(); // sessionId -> timeout

export const initializeSocketIO = (io: Server): void => {
  ioInstance = io;
  io.on('connection', (socket: Socket) => {
    // ... existing connection logic ...
    console.log('Client connected:', socket.id);

    let currentUserId: string | null = null;
    let currentNotebookId: string | null = null;

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      // Cleanup Collaboration
      if (currentUserId && currentNotebookId) {
        collaborationService.leaveSession(currentNotebookId, currentUserId, socket.id);
      }

      // Schedule Session Termination if this user owns a session
      // Note: This logic assumes 1 session per user which matches sessionService assumption
      if (currentUserId) {
        logAndScheduleTermination(currentUserId);
      }
    });

    // Handle session keep-alive on reconnect
    const clearPendingTermination = (userId: string) => {
      const timeout = disconnectTimeouts.get(userId);
      if (timeout) {
        console.log(`[GOVERNANCE] User ${userId} reconnected. Cancelling session termination.`);
        clearTimeout(timeout);
        disconnectTimeouts.delete(userId);
      }
    };

    // Join room for user-specific events
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      currentUserId = userId;
      console.log(`Socket ${socket.id} joined user room: ${userId}`);

      // Cancel any pending kill timer for this user
      clearPendingTermination(userId);
    });

    // Leave user room
    socket.on('leave:user', (userId: string) => {
      socket.leave(`user:${userId}`);
      console.log(`Socket ${socket.id} left user room: ${userId}`);
    });

    // Collaboration events
    socket.on('collaboration:join', async (data: { notebookId: string; userId: string; email: string }) => {
      currentNotebookId = data.notebookId;
      socket.join(`notebook:${data.notebookId}`);
      collaborationService.joinSession(data.notebookId, data.userId, data.email, socket.id);
    });

    socket.on('collaboration:leave', (data: { notebookId: string; userId: string }) => {
      socket.leave(`notebook:${data.notebookId}`);
      collaborationService.leaveSession(data.notebookId, data.userId, socket.id);
      currentNotebookId = null;
    });

    socket.on('collaboration:content_update', (data: { notebookId: string; userId: string; content: string; language: string }) => {
      collaborationService.updateContent(data.notebookId, data.userId, data.content, data.language);
    });

    socket.on('collaboration:cursor_update', (data: { notebookId: string; userId: string; cursor: { line: number; column: number } }) => {
      collaborationService.updateCursor(data.notebookId, data.userId, data.cursor);
    });

    socket.on('collaboration:edit', (data: { notebookId: string; userId: string; operation: any }) => {
      collaborationService.applyEdit(data.notebookId, data.userId, data.operation);
    });

    socket.on('collaboration:save', async (data: { notebookId: string }) => {
      await collaborationService.saveSession(data.notebookId);
      io.to(`notebook:${data.notebookId}`).emit('collaboration:saved', { notebookId: data.notebookId });
    });
  });
};

export const emitToUser = (userId: string, event: string, data: any): void => {
  if (!ioInstance) {
    console.warn('[SOCKET] emitToUser called before socket initialization (OK for testing)');
    return;
  }
  ioInstance.to(`user:${userId}`).emit(event, data);
};



export const getIO = (): Server | null => ioInstance;

const logAndScheduleTermination = (userId: string) => {
  // We need to look up the session ID for this user.
  // Ideally sessionService should expose a way to get session by user without creating one.
  // For now we can try to look it up map if we had access, but sessionService methods are public.

  // NOTE: This runs AFTER socket disconnect, so we can't ask the client.
  // We'll set a timeout that checks session existence.

  if (disconnectTimeouts.has(userId)) return; // Already scheduled

  console.log(`[GOVERNANCE] User ${userId} disconnected. Scheduling termination in ${DISCONNECT_GRACE_PERIOD}ms...`);

  const timeout = setTimeout(async () => {
    try {
      // We need to find the session for this user.
      // Using a private property accessor is hacky, but sessionService doesn't export the map.
      // Let's rely on standard method if possible or standard pattern.
      // The sessionService has `userSessions` map. We'll add a helper to sessionService or just blindly try to stop?
      // "stopSession" requires sessionId.
      // Let's modify sessionService to expose `getSessionIdByUserId`.

      // Wait, I can't easily modify sessionService interface AND use it here without ensuring it's available.
      // Let's assume we modify sessionService to add `getSessionIdByUser`.
      // FOR NOW, to avoid breaking compilation if I missed a step:
      // I will use a direct check if possible, OR I will assume the frontend sends a explicit "leave" or we rely on sessionService internals.

      // BETTER APPROACH: Add `terminateUserSession(userId)` to SessionService.
      await sessionService.terminateUserSession(userId);
      disconnectTimeouts.delete(userId);
    } catch (err) {
      console.error(`[GOVERNANCE] Failed to terminate session for user ${userId}`, err);
    }
  }, DISCONNECT_GRACE_PERIOD);

  disconnectTimeouts.set(userId, timeout);
};

