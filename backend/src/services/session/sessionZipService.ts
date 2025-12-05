import { PrismaClient } from '@prisma/client';
import archiver from 'archiver';
import { AppError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

export interface SessionZipOptions {
  userId?: string;
  guestSessionId?: string;
  includeCode?: boolean;
  includeExecutions?: boolean;
  includeDebug?: boolean;
  includeLogs?: boolean;
}

export class SessionZipService {
  /**
   * Generate zip file for a session
   */
  async generateSessionZip(options: SessionZipOptions): Promise<Buffer> {
    const { userId, guestSessionId, includeCode = true, includeExecutions = true, includeDebug = true, includeLogs = true } = options;

    if (!userId && !guestSessionId) {
      throw new AppError('Either userId or guestSessionId must be provided', 400);
    }

    return new Promise((resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      const chunks: Buffer[] = [];

      archive.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      archive.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      archive.on('error', (error) => {
        reject(error);
      });

      // Collect session data
      this.collectSessionData(archive, options)
        .then(() => {
          archive.finalize();
        })
        .catch(reject);
    });
  }

  private async collectSessionData(
    archive: archiver.Archiver,
    options: SessionZipOptions
  ): Promise<void> {
    const { userId, guestSessionId, includeCode, includeExecutions, includeDebug, includeLogs } = options;

    // Get session identifier for filtering
    let whereClause: any = {};
    if (userId) {
      whereClause.userId = userId;
    } else if (guestSessionId) {
      // For guest sessions, we need to get executions from audit logs
      // Since executions table has userId, we'll need to query differently
      // For now, we'll get all executions and filter by session metadata
      whereClause = {}; // Will filter by sessionId in details
    }

    // Add README
    archive.append(this.generateReadme(options), { name: 'README.txt' });

    // Collect code files (notebooks)
    if (includeCode && userId) {
      const notebooks = await prisma.notebook.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (notebooks.length > 0) {
        archive.append('=== CODE FILES ===\n\n', { name: 'code/README.txt' });
        
        notebooks.forEach((notebook, index) => {
          const extension = this.getFileExtension(notebook.language);
          const filename = `code/${notebook.title || `notebook_${index + 1}`}.${extension}`;
          archive.append(notebook.content, { name: filename });
          
          // Add metadata
          archive.append(
            JSON.stringify({
              title: notebook.title,
              language: notebook.language,
              createdAt: notebook.createdAt,
              updatedAt: notebook.updatedAt,
            }, null, 2),
            { name: `code/${notebook.title || `notebook_${index + 1}`}_metadata.json` }
          );
        });
      }
    }

    // Collect executions
    if (includeExecutions) {
      let executions: any[] = [];
      
      if (userId) {
        executions = await prisma.execution.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
      } else if (guestSessionId) {
        // For guest sessions, get executions by guest userId pattern
        // Guest sessions use "guest_${sessionId}" as userId in executions table
        const guestUserId = `guest_${guestSessionId}`;
        const guestExecutions = await prisma.execution.findMany({
          where: {
            userId: guestUserId,
          },
          orderBy: { createdAt: 'desc' },
        });

        executions = guestExecutions.map((exec) => ({
          id: exec.id,
          code: exec.code,
          language: exec.language,
          status: exec.status,
          stdout: exec.stdout,
          stderr: exec.stderr,
          exitCode: exec.exitCode,
          executionTimeMs: exec.executionTimeMs,
          createdAt: exec.createdAt,
          resourceUsage: exec.resourceUsage,
        }));

        // Also get any additional data from audit logs
        const auditLogs = await prisma.auditLog.findMany({
          where: {
            userId: null,
            actionType: 'EXECUTE_CODE',
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        });

        const sessionLogs = auditLogs.filter((log) => {
          const details = log.details as any;
          return details?.sessionId === guestSessionId;
        });

        // Add any executions from audit logs that aren't in the main list
        sessionLogs.forEach((log) => {
          const details = log.details as any;
          const executionId = log.resourceId;
          
          if (executionId && !executions.find((e) => e.id === executionId)) {
            executions.push({
              id: executionId,
              code: details?.code || 'N/A',
              language: details?.language || 'unknown',
              status: details?.status || 'UNKNOWN',
              stdout: details?.stdout || null,
              stderr: details?.stderr || null,
              exitCode: details?.exitCode || null,
              executionTimeMs: details?.executionTimeMs || null,
              createdAt: log.createdAt,
              resourceUsage: details?.resourceUsage || {},
            });
          }
        });
      }

      if (executions && executions.length > 0) {
        archive.append('=== EXECUTION RESULTS ===\n\n', { name: 'executions/README.txt' });
        
        executions.forEach((execution, index) => {
          const executionDir = `executions/execution_${index + 1}_${execution.id.substring(0, 8)}`;
          
          // Source code
          const extension = this.getFileExtension(execution.language);
          archive.append(execution.code, { 
            name: `${executionDir}/source.${extension}` 
          });

          // Execution results
          if (execution.stdout) {
            archive.append(execution.stdout, { 
              name: `${executionDir}/stdout.txt` 
            });
          }

          if (execution.stderr) {
            archive.append(execution.stderr, { 
              name: `${executionDir}/stderr.txt` 
            });
          }

          // Execution metadata
          archive.append(
            JSON.stringify({
              id: execution.id,
              language: execution.language,
              status: execution.status,
              exitCode: execution.exitCode,
              executionTimeMs: execution.executionTimeMs,
              createdAt: execution.createdAt,
              resourceUsage: execution.resourceUsage,
            }, null, 2),
            { name: `${executionDir}/metadata.json` }
          );
        });
      }
    }

    // Collect debug sessions
    if (includeDebug && userId) {
      const debugSessions = await prisma.debugSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (debugSessions.length > 0) {
        archive.append('=== DEBUG SESSIONS ===\n\n', { name: 'debug/README.txt' });
        
        debugSessions.forEach((session, index) => {
          const debugDir = `debug/session_${index + 1}_${session.id.substring(0, 8)}`;
          
          archive.append(
            JSON.stringify({
              id: session.id,
              status: session.status,
              breakpoints: session.breakpoints,
              currentLine: session.currentLine,
              variables: session.variables,
              callStack: session.callStack,
              createdAt: session.createdAt,
              updatedAt: session.updatedAt,
            }, null, 2),
            { name: `${debugDir}/debug_data.json` }
          );
        });
      }
    }

    // Collect audit logs (session activity)
    if (includeLogs) {
      let auditLogs;
      
      if (userId) {
        auditLogs = await prisma.auditLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 1000, // Limit to prevent huge files
        });
      } else if (guestSessionId) {
        // Query audit logs by sessionId in details
        auditLogs = await prisma.auditLog.findMany({
          where: {
            userId: null, // Guest sessions have null userId
            // Note: Prisma doesn't support JSON field queries easily
            // In production, you might need raw SQL or store sessionId separately
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        });

        // Filter by sessionId in details (client-side filter)
        auditLogs = auditLogs.filter((log) => {
          const details = log.details as any;
          return details?.sessionId === guestSessionId;
        });
      }

      if (auditLogs && auditLogs.length > 0) {
        archive.append('=== ACTIVITY LOGS ===\n\n', { name: 'logs/README.txt' });
        
        // Create a readable log file
        const logContent = auditLogs.map((log) => {
          const details = log.details as any;
          return JSON.stringify({
            timestamp: log.createdAt,
            action: log.actionType,
            resourceType: log.resourceType,
            resourceId: log.resourceId,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            details: details,
          }, null, 2);
        }).join('\n\n---\n\n');

        archive.append(logContent, { name: 'logs/activity_log.jsonl' });
      }
    }

    // Add session summary
    archive.append(
      this.generateSessionSummary(options),
      { name: 'SESSION_SUMMARY.txt' }
    );
  }

  private generateReadme(options: SessionZipOptions): string {
    const { userId, guestSessionId } = options;
    const sessionType = userId ? 'Authenticated User' : 'Guest Session';
    const sessionId = userId || guestSessionId || 'unknown';

    return `CodLabStudio - Session Export
========================================

Session Type: ${sessionType}
Session ID: ${sessionId}
Export Date: ${new Date().toISOString()}

Contents:
---------
- code/          : Source code files (notebooks)
- executions/    : Code execution results (stdout, stderr, metadata)
- debug/         : Debug session data
- logs/          : Activity and audit logs
- SESSION_SUMMARY.txt : Session overview

Note: This export contains all your session data including code, execution results, and activity logs.
For guest sessions, this data is temporary and will be cleared at session end.

Generated by CodLabStudio
`;
  }

  private generateSessionSummary(options: SessionZipOptions): string {
    const { userId, guestSessionId } = options;
    const sessionType = userId ? 'Authenticated User' : 'Guest Session';
    
    return `SESSION SUMMARY
===============

Session Type: ${sessionType}
Session ID: ${userId || guestSessionId || 'unknown'}
Export Date: ${new Date().toISOString()}

This archive contains all session data including:
- Source code files
- Execution results and outputs
- Debug session information
- Activity logs

For guest sessions, this data is temporary and will be cleared when the session ends.
`;
  }

  private getFileExtension(language: string): string {
    const extensionMap: Record<string, string> = {
      python: 'py',
      py: 'py',
      javascript: 'js',
      js: 'js',
      typescript: 'ts',
      ts: 'ts',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rust: 'rs',
      ruby: 'rb',
      php: 'php',
      swift: 'swift',
      kotlin: 'kt',
      scala: 'scala',
      r: 'r',
      julia: 'jl',
      perl: 'pl',
      bash: 'sh',
      shell: 'sh',
      sql: 'sql',
    };

    // Remove version numbers
    const baseLanguage = language.replace(/[0-9.]+/g, '').toLowerCase();
    return extensionMap[baseLanguage] || 'txt';
  }
}

export const sessionZipService = new SessionZipService();

