import { PrismaClient, ExecutionStatus } from '@prisma/client';
import { dockerService } from '../docker/dockerService';
import { sessionService } from '../session/sessionService'; // Import Service
import { AppError } from '../../middleware/errorHandler';
import { emitToUser } from '../notification/socket';

const prisma = new PrismaClient();

export interface ExecuteCodeInput {
  code: string;
  language: string;
  userId: string;
  notebookId?: string;
}

export class ExecutionService {
  async executeCode(input: ExecuteCodeInput): Promise<{ executionId: string }> {
    const { code, language, userId, notebookId } = input;

    // Validate code size
    const maxCodeSize = parseInt(
      process.env.MAX_CODE_SIZE_BYTES || '10485760',
      10
    );
    if (Buffer.from(code).length > maxCodeSize) {
      throw new AppError('Code size exceeds maximum limit', 400);
    }

    // 1. Get or Create Session (Persistent Container)
    const { sessionId } = await sessionService.createSession({ userId, language });
    const containerId = await sessionService.getSessionContainer(sessionId);
    const container = dockerService.getContainer(containerId);

    // Determine auth type
    const isGuest = userId.startsWith('guest_');
    const dbUserId = isGuest ? undefined : userId;
    const dbGuestId = isGuest ? userId.replace('guest_', '') : undefined;

    // Create execution record
    const execution = await prisma.execution.create({
      data: {
        code,
        language: language.toLowerCase(),
        status: ExecutionStatus.PENDING,
        userId: dbUserId,
        guestId: dbGuestId,
        notebookId: notebookId || null,
      },
    });

    // Execute in background
    console.log(`[EXEC] Starting background execution for ${execution.id} in session ${sessionId}`);
    this.executeInContainer(execution.id, code, language, container, userId)
      .then(() => console.log(`[EXEC] Finished background execution for ${execution.id}`))
      .catch((error) => {
        console.error(`[EXEC] Background execution error for ${execution.id}:`, error);
      });

    return { executionId: execution.id };
  }

  private async executeInContainer(
    executionId: string,
    code: string,
    language: string,
    container: any, // Docker.Container
    userId: string
  ): Promise<void> {
    try {
      // Update status to RUNNING
      await prisma.execution.update({
        where: { id: executionId },
        data: { status: ExecutionStatus.RUNNING },
      });

      emitToUser(userId, 'execution:status', {
        executionId,
        status: 'RUNNING',
        message: 'Execution started...',
      });

      // No need to create container here anymore!

      // Execute code with progress streaming
      const result = await dockerService.executeCode(
        container,
        code,
        language,
        (type, data) => {
          // Emit streaming output to user
          emitToUser(userId, 'execution:output', {
            executionId,
            type, // 'stdout' or 'stderr'
            data
          });
        }
      );

      // Update execution record
      await prisma.execution.update({
        where: { id: executionId },
        data: {
          status: ExecutionStatus.COMPLETED,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
          executionTimeMs: result.executionTime,
        },
      });

      // For guest sessions, also log execution results to audit for zip export
      // Guest sessions have userId that starts with "guest_"
      if (userId.startsWith('guest_')) {
        const { auditService } = await import('../audit/auditService');
        const sessionId = userId.replace('guest_', '');
        await auditService.log({
          userId: undefined,
          actionType: 'EXECUTE_CODE' as any, // Use any or proper type cast if available
          resourceType: 'execution',
          resourceId: executionId,
          details: {
            sessionId: sessionId,
            code: code.substring(0, 1000), // Store first 1000 chars
            language: language,
            status: 'COMPLETED',
            stdout: result.stdout?.substring(0, 5000) || null, // Store first 5000 chars
            stderr: result.stderr?.substring(0, 5000) || null,
            exitCode: result.exitCode,
            executionTimeMs: result.executionTime,
          },
        }).catch(console.error);
      }

      emitToUser(userId, 'execution:complete', {
        executionId,
        status: 'COMPLETED',
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTime: result.executionTime,
      });

      // Cleanup container - NO LONGER NEEDED as container is persistent
      // await dockerService.stopContainer(container); 
      // But we might want to manually invoke garbage collection eventually?

    } catch (error) {
      console.error('Execution error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await prisma.execution.update({
        where: { id: executionId },
        data: {
          status: ExecutionStatus.FAILED,
          stderr: errorMessage,
        },
      });

      emitToUser(userId, 'execution:error', {
        executionId,
        status: 'FAILED',
        error: errorMessage,
      });
    }
  }

  async getExecution(executionId: string, userId: string) {
    // Determine auth type for lookup
    const isGuest = userId.startsWith('guest_');
    const dbUserId = isGuest ? undefined : userId;
    const dbGuestId = isGuest ? userId.replace('guest_', '') : undefined;

    const execution = await prisma.execution.findFirst({
      where: {
        id: executionId,
        userId: dbUserId,
        guestId: dbGuestId
      },
    });

    if (!execution) {
      throw new AppError('Execution not found', 404);
    }

    return execution;
  }

  async getUserExecutions(userId: string, limit: number = 50) {
    const isGuest = userId.startsWith('guest_');
    const dbUserId = isGuest ? undefined : userId;
    const dbGuestId = isGuest ? userId.replace('guest_', '') : undefined;

    return prisma.execution.findMany({
      where: {
        userId: dbUserId,
        guestId: dbGuestId
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  getSupportedLanguages(): string[] {
    return sessionService.getSupportedLanguages();
  }
}

export const executionService = new ExecutionService();
