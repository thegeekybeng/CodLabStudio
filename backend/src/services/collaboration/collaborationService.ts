import { getIO } from '../notification/socket';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CollaborationSession {
  notebookId: string;
  participants: Map<string, Participant>;
  content: string;
  language: string;
  cursors: Map<string, CursorPosition>;
}

export interface Participant {
  userId: string;
  email: string;
  socketId: string;
  color: string;
  cursor?: CursorPosition;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface EditOperation {
  type: 'insert' | 'delete' | 'replace';
  position: number;
  length?: number;
  text?: string;
}

const PARTICIPANT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

export class CollaborationService {
  private sessions = new Map<string, CollaborationSession>();
  private userSessions = new Map<string, string>(); // userId -> notebookId

  joinSession(notebookId: string, userId: string, email: string, socketId: string): void {
    let session = this.sessions.get(notebookId);

    if (!session) {
      session = {
        notebookId,
        participants: new Map(),
        content: '',
        language: 'python',
        cursors: new Map(),
      };
      this.sessions.set(notebookId, session);
    }

    // Check if user already in session
    if (session.participants.has(userId)) {
      const existing = session.participants.get(userId)!;
      existing.socketId = socketId;
      return;
    }

    // Assign color
    const usedColors = Array.from(session.participants.values()).map((p) => p.color);
    const availableColor = PARTICIPANT_COLORS.find((c) => !usedColors.includes(c)) || PARTICIPANT_COLORS[0];

    const participant: Participant = {
      userId,
      email,
      socketId,
      color: availableColor,
    };

    session.participants.set(userId, participant);
    this.userSessions.set(userId, notebookId);

    // Notify other participants
    this.broadcastToSession(notebookId, 'collaboration:user_joined', {
      userId,
      email,
      color: availableColor,
      totalParticipants: session.participants.size,
    }, socketId);

    // Send current state to new participant
    const io = getIO();
    if (io) {
      io.to(socketId).emit('collaboration:session_state', {
        content: session.content,
        language: session.language,
        participants: Array.from(session.participants.values()).map((p) => ({
          userId: p.userId,
          email: p.email,
          color: p.color,
        })),
      });
    }
  }

  leaveSession(notebookId: string, userId: string, socketId: string): void {
    const session = this.sessions.get(notebookId);
    if (!session) return;

    session.participants.delete(userId);
    this.userSessions.delete(userId);

    if (session.participants.size === 0) {
      this.sessions.delete(notebookId);
    } else {
      this.broadcastToSession(notebookId, 'collaboration:user_left', {
        userId,
        totalParticipants: session.participants.size,
      }, socketId);
    }
  }

  updateContent(notebookId: string, userId: string, content: string, language: string): void {
    const session = this.sessions.get(notebookId);
    if (!session) return;

    session.content = content;
    session.language = language;

    // Broadcast to all participants except sender
    const participant = session.participants.get(userId);
    if (!participant) return;

    this.broadcastToSession(notebookId, 'collaboration:content_update', {
      content,
      language,
      userId,
    }, participant.socketId);
  }

  updateCursor(notebookId: string, userId: string, cursor: CursorPosition): void {
    const session = this.sessions.get(notebookId);
    if (!session) return;

    const participant = session.participants.get(userId);
    if (!participant) return;

    participant.cursor = cursor;
    session.cursors.set(userId, cursor);

    // Broadcast cursor position to others
    this.broadcastToSession(notebookId, 'collaboration:cursor_update', {
      userId,
      cursor,
      color: participant.color,
    }, participant.socketId);
  }

  applyEdit(notebookId: string, userId: string, operation: EditOperation): void {
    const session = this.sessions.get(notebookId);
    if (!session) return;

    // Apply operation to content
    let newContent = session.content;
    switch (operation.type) {
      case 'insert':
        if (operation.text) {
          newContent = newContent.slice(0, operation.position) + operation.text + newContent.slice(operation.position);
        }
        break;
      case 'delete':
        if (operation.length) {
          newContent = newContent.slice(0, operation.position) + newContent.slice(operation.position + operation.length);
        }
        break;
      case 'replace':
        if (operation.text !== undefined && operation.length !== undefined) {
          newContent = newContent.slice(0, operation.position) + operation.text + newContent.slice(operation.position + operation.length);
        }
        break;
    }

    session.content = newContent;

    // Broadcast edit to all participants
    const participant = session.participants.get(userId);
    if (!participant) return;

    this.broadcastToSession(notebookId, 'collaboration:edit', {
      operation,
      userId,
      content: newContent,
    }, participant.socketId);
  }

  private broadcastToSession(notebookId: string, event: string, data: any, excludeSocketId?: string): void {
    const session = this.sessions.get(notebookId);
    if (!session) return;

    const io = getIO();
    if (!io) return;

    session.participants.forEach((participant) => {
      if (participant.socketId !== excludeSocketId) {
        io.to(participant.socketId).emit(event, data);
      }
    });
  }

  getSession(notebookId: string): CollaborationSession | undefined {
    return this.sessions.get(notebookId);
  }

  async saveSession(notebookId: string): Promise<void> {
    const session = this.sessions.get(notebookId);
    if (!session) return;

    // Save to database
    try {
      await prisma.notebook.update({
        where: { id: notebookId },
        data: {
          content: session.content,
          language: session.language,
        },
      });
    } catch (error) {
      console.error('Failed to save collaboration session:', error);
    }
  }
}

export const collaborationService = new CollaborationService();
