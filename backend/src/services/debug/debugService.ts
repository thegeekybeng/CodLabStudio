import { PrismaClient, DebugSessionStatus } from '@prisma/client';
import { dockerService, ContainerConfig } from '../docker/dockerService';
import { AppError } from '../../middleware/errorHandler';
import { emitToUser } from '../notification/socket';
import { io } from '../../index';

const prisma = new PrismaClient();

export interface StartDebugSessionInput {
  code: string;
  language: string;
  breakpoints: number[];
  userId: string;
  notebookId?: string;
}

export interface DebugCommand {
  type: 'step_over' | 'step_into' | 'step_out' | 'continue' | 'pause' | 'evaluate';
  expression?: string;
}

const DEBUGGABLE_LANGUAGES: Record<string, { image: string; debugger: string }> = {
  python: {
    image: 'python:3.11-alpine',
    debugger: 'debugpy',
  },
  py: {
    image: 'python:3.11-alpine',
    debugger: 'debugpy',
  },
  'python3.10': {
    image: 'python:3.10-alpine',
    debugger: 'debugpy',
  },
  'python3.12': {
    image: 'python:3.12-alpine',
    debugger: 'debugpy',
  },
  javascript: {
    image: 'node:20-alpine',
    debugger: 'node-inspector',
  },
  js: {
    image: 'node:20-alpine',
    debugger: 'node-inspector',
  },
  node: {
    image: 'node:20-alpine',
    debugger: 'node-inspector',
  },
  typescript: {
    image: 'node:20-alpine',
    debugger: 'node-inspector',
  },
  ts: {
    image: 'node:20-alpine',
    debugger: 'node-inspector',
  },
  java: {
    image: 'openjdk:17-alpine',
    debugger: 'jdwp',
  },
  go: {
    image: 'golang:1.21-alpine',
    debugger: 'delve',
  },
  rust: {
    image: 'rust:1.70-alpine',
    debugger: 'lldb',
  },
};

export class DebugService {
  private activeSessions = new Map<string, any>(); // sessionId -> container/debugger info

  async startDebugSession(input: StartDebugSessionInput): Promise<{ sessionId: string }> {
    const { code, language, breakpoints, userId, notebookId } = input;

    const normalizedLanguage = language.toLowerCase();

    if (!DEBUGGABLE_LANGUAGES[normalizedLanguage]) {
      throw new AppError(
        `Debugging not supported for ${language}. Supported languages: ${Object.keys(DEBUGGABLE_LANGUAGES).join(', ')}`,
        400
      );
    }

    const langConfig = DEBUGGABLE_LANGUAGES[normalizedLanguage];
    const image = langConfig.image;

    // Check if image exists
    const imageExists = await dockerService.imageExists(image);
    if (!imageExists) {
      emitToUser(io, userId, 'debug:status', {
        status: 'PULLING_IMAGE',
        message: `Pulling ${image}...`,
      });
      await dockerService.pullImage(image);
    }

    // Determine auth type
    const isGuest = userId.startsWith('guest_');
    const dbUserId = isGuest ? undefined : userId;
    const dbGuestId = isGuest ? userId.replace('guest_', '') : undefined;

    // Create debug session record
    const session = await prisma.debugSession.create({
      data: {
        notebookId: notebookId || undefined,
        userId: dbUserId,
        guestId: dbGuestId,
        breakpoints: breakpoints as any,
        status: DebugSessionStatus.ACTIVE,
        variables: {},
        callStack: [],
      },
    });

    // Start debug session in background
    this.initializeDebugSession(session.id, code, normalizedLanguage, image, userId, breakpoints)
      .catch((error) => {
        console.error('Debug session initialization error:', error);
      });

    return { sessionId: session.id };
  }

  private async initializeDebugSession(
    sessionId: string,
    code: string,
    language: string,
    image: string,
    userId: string,
    breakpoints: number[]
  ): Promise<void> {
    try {
      emitToUser(io, userId, 'debug:status', {
        sessionId,
        status: 'INITIALIZING',
        message: 'Starting debug session...',
      });

      // Create container with debugger
      const containerConfig: ContainerConfig = {
        image,
        cmd: this.getDebugCommand(language),
        env: this.getDebugEnv(language),
        workingDir: '/tmp',
        memory: 512 * 1024 * 1024,
        networkDisabled: false, // Debuggers need network for DAP/CDP
        readonlyRootfs: false,
      };

      const container = await dockerService.createContainer(containerConfig);
      await container.start();

      // Store session info
      this.activeSessions.set(sessionId, {
        container,
        language,
        userId,
        status: 'active',
      });

      // Stream logs
      const stream = await container.attach({
        stream: true,
        stdout: true,
        stderr: true,
      });

      container.modem.demuxStream(stream, {
        write: (chunk: Buffer) => {
          emitToUser(io, userId, 'debug:output', {
            sessionId,
            type: 'stdout',
            content: chunk.toString(),
          });
        },
      }, {
        write: (chunk: Buffer) => {
          emitToUser(io, userId, 'debug:output', {
            sessionId,
            type: 'stderr',
            content: chunk.toString(),
          });
        },
      });

      // Write code with breakpoints
      await this.setupDebugCode(container, code, language, breakpoints);

      emitToUser(io, userId, 'debug:ready', {
        sessionId,
        status: 'READY',
        message: 'Debug session ready',
      });
    } catch (error) {
      console.error('Debug session initialization error:', error);
      await prisma.debugSession.update({
        where: { id: sessionId },
        data: { status: DebugSessionStatus.TERMINATED },
      });

      emitToUser(io, userId, 'debug:error', {
        sessionId,
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Failed to initialize debug session',
      });
    }
  }

  async executeDebugCommand(
    sessionId: string,
    userId: string,
    command: DebugCommand
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      throw new AppError('Debug session not found or inactive', 404);
    }

    // Verify ownership
    const isGuest = userId.startsWith('guest_');
    const dbUserId = isGuest ? undefined : userId;
    const dbGuestId = isGuest ? userId.replace('guest_', '') : undefined;

    const dbSession = await prisma.debugSession.findFirst({
      where: {
        id: sessionId,
        userId: dbUserId,
        guestId: dbGuestId
      },
    });

    if (!dbSession) {
      throw new AppError('Debug session not found', 404);
    }

    try {
      // Execute debug command based on language
      const result = await this.handleDebugCommand(session, command);

      // Update session state
      await prisma.debugSession.update({
        where: { id: sessionId },
        data: {
          currentLine: result.currentLine,
          variables: result.variables as any,
          callStack: result.callStack as any,
        },
      });

      emitToUser(io, userId, 'debug:event', {
        sessionId,
        type: command.type,
        currentLine: result.currentLine,
        variables: result.variables,
        callStack: result.callStack,
      });
    } catch (error) {
      console.error('Debug command error:', error);
      emitToUser(io, userId, 'debug:error', {
        sessionId,
        error: error instanceof Error ? error.message : 'Debug command failed',
      });
    }
  }

  async stopDebugSession(sessionId: string, userId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      throw new AppError('Debug session not found', 404);
    }

    // Verify ownership
    // Verify ownership
    const isGuest = userId.startsWith('guest_');
    const dbUserId = isGuest ? undefined : userId;
    const dbGuestId = isGuest ? userId.replace('guest_', '') : undefined;

    const dbSession = await prisma.debugSession.findFirst({
      where: {
        id: sessionId,
        userId: dbUserId,
        guestId: dbGuestId
      },
    });

    if (!dbSession) {
      throw new AppError('Debug session not found', 404);
    }

    try {
      // Stop container
      if (session.container) {
        await dockerService.stopContainer(session.container);
      }

      // Update session
      await prisma.debugSession.update({
        where: { id: sessionId },
        data: { status: DebugSessionStatus.TERMINATED },
      });

      // Remove from active sessions
      this.activeSessions.delete(sessionId);

      emitToUser(io, userId, 'debug:stopped', {
        sessionId,
        status: 'STOPPED',
      });
    } catch (error) {
      console.error('Error stopping debug session:', error);
      throw new AppError('Failed to stop debug session', 500);
    }
  }

  async getDebugSession(sessionId: string, userId: string) {
    const isGuest = userId.startsWith('guest_');
    const dbUserId = isGuest ? undefined : userId;
    const dbGuestId = isGuest ? userId.replace('guest_', '') : undefined;

    const session = await prisma.debugSession.findFirst({
      where: {
        id: sessionId,
        userId: dbUserId,
        guestId: dbGuestId
      },
    });

    if (!session) {
      throw new AppError('Debug session not found', 404);
    }

    return session;
  }

  private async setupDebugCode(
    container: any,
    code: string,
    _language: string,
    _breakpoints: number[]
  ): Promise<void> {
    // This would write code with debugger configuration
    // Implementation depends on specific debugger protocol
    const exec = await container.exec({
      Cmd: ['sh', '-c', `echo '${code.replace(/'/g, "'\\''")}' > /tmp/user_script.py`],
      AttachStdout: true,
      AttachStderr: true,
    });

    await exec.start({});
  }

  private async handleDebugCommand(_session: any, _command: DebugCommand): Promise<any> {
    // Simplified implementation - would integrate with actual debugger protocols
    // (DAP for Python, CDP for Node.js)
    return {
      currentLine: 1,
      variables: {},
      callStack: [],
    };
  }

  private getDebugCommand(language: string): string[] {
    switch (language) {
      case 'python':
      case 'py':
        return ['sh', '-c', 'pip install debugpy && python3 -m debugpy --listen 0.0.0.0:5678 --wait-for-client /tmp/user_script.py'];
      case 'javascript':
      case 'js':
      case 'node':
        return ['sh', '-c', 'node --inspect=0.0.0.0:9229 /tmp/code.js'];
      default:
        return ['sh', '-c', 'sleep infinity'];
    }
  }

  private getDebugEnv(language: string): string[] {
    switch (language) {
      case 'python':
      case 'py':
        return ['PYTHONUNBUFFERED=1'];
      case 'javascript':
      case 'js':
      case 'node':
        return ['NODE_OPTIONS=--inspect'];
      default:
        return [];
    }
  }

  getDebuggableLanguages(): string[] {
    return Object.keys(DEBUGGABLE_LANGUAGES);
  }
}

export const debugService = new DebugService();

