import { PrismaClient, ExecutionStatus } from '@prisma/client';
import { dockerService, ContainerConfig } from '../docker/dockerService';
import { AppError } from '../../middleware/errorHandler';
import { emitToUser } from '../notification/socket';
import { io } from '../../index';

const prisma = new PrismaClient();

export interface ExecuteCodeInput {
  code: string;
  language: string;
  userId: string;
  notebookId?: string;
}

const LANGUAGE_IMAGES: Record<string, string> = {
  python: 'python:3.11-alpine',
  py: 'python:3.11-alpine',
  'python3.10': 'python:3.10-alpine',
  'python3.12': 'python:3.12-alpine',
  javascript: 'node:20-alpine',
  js: 'node:20-alpine',
  node: 'node:20-alpine',
  'node18': 'node:18-alpine',
  'node19': 'node:19-alpine',
  typescript: 'node:20-alpine',
  ts: 'node:20-alpine',
  java: 'openjdk:17-alpine',
  'java11': 'openjdk:11-alpine',
  'java21': 'openjdk:21-alpine',
  cpp: 'gcc:latest',
  c: 'gcc:latest',
  go: 'golang:1.21-alpine',
  'go1.20': 'golang:1.20-alpine',
  'go1.22': 'golang:1.22-alpine',
  rust: 'rust:1.70-alpine',
  'rust1.69': 'rust:1.69-alpine',
  'rust1.71': 'rust:1.71-alpine',
  ruby: 'ruby:3.2-alpine',
  'ruby3.1': 'ruby:3.1-alpine',
  'ruby3.3': 'ruby:3.3-alpine',
  php: 'php:8.2-alpine',
  'php8.1': 'php:8.1-alpine',
  'php8.3': 'php:8.3-alpine',
  swift: 'swift:5.9',
  kotlin: 'openjdk:17-alpine',
  scala: 'openjdk:17-alpine',
  r: 'r-base:latest',
  julia: 'julia:1.9',
  perl: 'perl:5.36',
  bash: 'bash:latest',
  shell: 'bash:latest',
};

const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_IMAGES);

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

    // Validate language
    const normalizedLanguage = language.toLowerCase();
    if (!LANGUAGE_IMAGES[normalizedLanguage]) {
      throw new AppError(
        `Language ${language} is not supported. Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`,
        400
      );
    }

    const image = LANGUAGE_IMAGES[normalizedLanguage];

    // Check if image exists, pull if not
    const imageExists = await dockerService.imageExists(image);
    if (!imageExists) {
      emitToUser(io, userId, 'execution:status', {
        status: 'PULLING_IMAGE',
        message: `Pulling ${image}...`,
      });
      await dockerService.pullImage(image);
    }

    // Determine auth type
    const isGuest = userId.startsWith('guest_');
    const dbUserId = isGuest ? undefined : userId;
    const dbGuestId = isGuest ? userId.replace('guest_', '') : undefined;

    // Create execution record
    const execution = await prisma.execution.create({
      data: {
        code,
        language: normalizedLanguage,
        status: ExecutionStatus.PENDING,
        userId: dbUserId,
        guestId: dbGuestId,
        notebookId: notebookId || null,
      },
    });

    // Execute in background
    this.executeInContainer(execution.id, code, normalizedLanguage, image, userId)
      .catch((error) => {
        console.error('Background execution error:', error);
      });

    return { executionId: execution.id };
  }

  private async executeInContainer(
    executionId: string,
    code: string,
    language: string,
    image: string,
    userId: string
  ): Promise<void> {
    try {
      // Update status to RUNNING
      await prisma.execution.update({
        where: { id: executionId },
        data: { status: ExecutionStatus.RUNNING },
      });

      emitToUser(io, userId, 'execution:status', {
        executionId,
        status: 'RUNNING',
        message: 'Execution started...',
      });

      // Create container
      const containerConfig: ContainerConfig = {
        image,
        cmd: ['sh', '-c', 'sleep infinity'], // Keep container alive
        env: ['PYTHONPATH=/python/site-packages'],
        workingDir: '/tmp',
        memory: 512 * 1024 * 1024, // 512MB
        networkDisabled: true, // No network access for security
        readonlyRootfs: false, // Need to write code file
        binds: ['codlabstudio_codlabstudio_packages:/python/site-packages'],
      };

      const container = await dockerService.createContainer(containerConfig);

      // Execute code with progress streaming
      const result = await dockerService.executeCode(
        container,
        code,
        language,
        (type, data) => {
          // Emit streaming output to user
          emitToUser(io, userId, 'execution:output', {
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

      emitToUser(io, userId, 'execution:complete', {
        executionId,
        status: 'COMPLETED',
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTime: result.executionTime,
      });

      // Cleanup container
      await dockerService.stopContainer(container);
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

      emitToUser(io, userId, 'execution:error', {
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
    return SUPPORTED_LANGUAGES;
  }
}

export const executionService = new ExecutionService();
