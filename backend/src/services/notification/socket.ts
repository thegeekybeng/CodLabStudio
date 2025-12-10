import { Server, Socket } from 'socket.io';
import { collaborationService } from '../collaboration/collaborationService';

export const initializeSocketIO = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    let currentUserId: string | null = null;
    let currentNotebookId: string | null = null;

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      if (currentUserId && currentNotebookId) {
        collaborationService.leaveSession(currentNotebookId, currentUserId, socket.id);
      }
    });

    // Join room for user-specific events
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      currentUserId = userId;
      console.log(`Socket ${socket.id} joined user room: ${userId}`);
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

export const emitToUser = (io: Server, userId: string, event: string, data: any): void => {
  io.to(`user:${userId}`).emit(event, data);
};

