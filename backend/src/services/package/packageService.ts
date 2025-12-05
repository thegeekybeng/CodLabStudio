import { PrismaClient } from '@prisma/client';
import { dockerService } from '../docker/dockerService';
import { AppError } from '../../middleware/errorHandler';

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
    const { language, packages, userId, notebookId } = input;

    const normalizedLanguage = language.toLowerCase();
    const packageManager = PACKAGE_MANAGERS[normalizedLanguage];

    if (!packageManager) {
      throw new AppError(`Package management not supported for ${language}`, 400);
    }

    if (packages.length === 0) {
      throw new AppError('No packages specified', 400);
    }

    try {
      // Create a temporary container to install packages
      const image = this.getLanguageImage(normalizedLanguage);
      const container = await dockerService.createContainer({
        image,
        cmd: ['sh', '-c', 'sleep infinity'],
        workingDir: '/tmp',
        memory: 1024 * 1024 * 1024, // 1GB for package installation
        networkDisabled: false, // Need network for package downloads
        readonlyRootfs: false,
      });

      await container.start();

      // Install packages
      const installCommand = `${packageManager.installCmd} ${packages.join(' ')}`;
      const exec = await container.exec({
        Cmd: ['sh', '-c', installCommand],
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

      await dockerService.stopContainer(container);

      // Log package installation
      await prisma.auditLog.create({
        data: {
          userId,
          actionType: 'UPLOAD_FILE', // Reuse action type
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

  async searchPackage(language: string, query: string): Promise<PackageInfo[]> {
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

  private getLanguageImage(language: string): string {
    const images: Record<string, string> = {
      python: 'python:3.11-alpine',
      py: 'python:3.11-alpine',
      javascript: 'node:20-alpine',
      js: 'node:20-alpine',
      node: 'node:20-alpine',
      typescript: 'node:20-alpine',
      ts: 'node:20-alpine',
      java: 'openjdk:17-alpine',
      go: 'golang:1.21-alpine',
      rust: 'rust:1.70-alpine',
      ruby: 'ruby:3.2-alpine',
      php: 'php:8.2-alpine',
    };

    return images[language] || 'python:3.11-alpine';
  }
}

export const packageService = new PackageService();

