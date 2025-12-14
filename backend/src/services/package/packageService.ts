import { PrismaClient } from '@prisma/client';
import { dockerService } from '../docker/dockerService';
import { sessionService } from '../session/sessionService';
import { AppError } from '../../middleware/errorHandler';
import { emitToUser } from '../notification/socket';

const prisma = new PrismaClient();

export interface InstallPackageInput {
  language: string;
  packages: string[];
  userId: string;
  notebookId?: string;
}

export interface PackageInfo {
  name: string;
  version?: string;
  description?: string;
}

export type PackageSearchResult = PackageInfo;

const PACKAGE_MANAGERS: Record<string, { command: string; installCmd: string }> = {
  python: {
    command: 'pip',
    installCmd: 'pip install',
  },
  py: {
    command: 'pip',
    installCmd: 'pip install',
  },
  javascript: {
    command: 'npm',
    installCmd: 'npm install',
  },
  js: {
    command: 'npm',
    installCmd: 'npm install',
  },
  node: {
    command: 'npm',
    installCmd: 'npm install',
  },
  typescript: {
    command: 'npm',
    installCmd: 'npm install',
  },
  ts: {
    command: 'npm',
    installCmd: 'npm install',
  },
  java: {
    command: 'mvn',
    installCmd: 'mvn dependency:resolve',
  },
  go: {
    command: 'go',
    installCmd: 'go get',
  },
  rust: {
    command: 'cargo',
    installCmd: 'cargo add',
  },
  ruby: {
    command: 'gem',
    installCmd: 'gem install',
  },
  php: {
    command: 'composer',
    installCmd: 'composer require',
  },
};

export class PackageService {
  async installPackages(input: InstallPackageInput): Promise<{ success: boolean; output: string }> {
    const { language, packages, userId } = input;

    const normalizedLanguage = language.toLowerCase();
    const packageManager = PACKAGE_MANAGERS[normalizedLanguage];

    if (!packageManager) {
      throw new AppError(`Package management not supported for ${language}`, 400);
    }

    if (packages.length === 0) {
      throw new AppError('No packages specified', 400);
    }

    try {
      // 1. Get Session Container
      const { sessionId } = await sessionService.createSession({ userId, language });
      const containerId = await sessionService.getSessionContainer(sessionId);
      const container = dockerService.getContainer(containerId);

      emitToUser(userId, 'package:install', {
        status: 'INSTALLING',
        message: 'Installing packages...',
        packages,
      });

      // 2. Install packages directly in session container
      // Use standard install command (no --target hacks needed for persistent container)
      const installCmd = `${packageManager.installCmd} ${packages.join(' ')}`;

      const exec = await container.exec({
        Cmd: ['sh', '-c', installCmd],
        AttachStdout: true,
        AttachStderr: true,
      });

      const stream = await exec.start({ hijack: true, stdin: false });
      let output = '';
      let errorOutput = '';

      await new Promise<void>((resolve, reject) => {
        container.modem.demuxStream(stream, {
          write: (chunk: Buffer) => {
            output += chunk.toString();
          },
        }, {
          write: (chunk: Buffer) => {
            errorOutput += chunk.toString();
          },
        });

        stream.on('end', () => {
          resolve();
        });

        stream.on('error', (error) => {
          reject(error);
        });
      });

      const inspect = await exec.inspect();
      const exitCode = inspect.ExitCode || 0;

      // Log package installation
      const isGuest = userId.startsWith('guest_');
      await prisma.auditLog.create({
        data: {
          userId: isGuest ? null : userId, // Pass null for guest users
          actionType: 'UPLOAD_FILE', // Reuse action type for now (should add INSTALL_PACKAGE enum)
          resourceType: 'package',
          details: {
            language,
            packages,
            success: exitCode === 0,
          },
        },
      });

      return {
        success: exitCode === 0,
        output: exitCode === 0 ? output : errorOutput || output,
      };
    } catch (error) {
      console.error('Package installation error:', error);
      throw new AppError(
        `Failed to install packages: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  async searchPackage(
    language: string,
    _notebookId?: string
  ): Promise<PackageSearchResult[]> {
    const normalizedLanguage = language.toLowerCase();
    const packageManager = PACKAGE_MANAGERS[normalizedLanguage];

    if (!packageManager) {
      throw new AppError(`Package search not supported for ${language}`, 400);
    }

    // This would integrate with package registries (PyPI, npm, etc.)
    // For now, return a placeholder
    return [];
  }

  async listInstalledPackages(language: string): Promise<PackageInfo[]> {
    const normalizedLanguage = language.toLowerCase();
    const packageManager = PACKAGE_MANAGERS[normalizedLanguage];

    if (!packageManager) {
      throw new AppError(`Package listing not supported for ${language}`, 400);
    }

    // This would list packages from a requirements file or package.json
    // For now, return empty array
    return [];
  }

  getSupportedLanguages(): string[] {
    return Object.keys(PACKAGE_MANAGERS);
  }
}

export const packageService = new PackageService();
