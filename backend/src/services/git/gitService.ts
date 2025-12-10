import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AppError } from '../../middleware/errorHandler';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

export interface GitOperationInput {
  notebookId: string;
  userId: string;
  operation: 'init' | 'commit' | 'push' | 'pull' | 'status' | 'log';
  message?: string;
  remote?: string;
  branch?: string;
}

export interface GitStatus {
  branch: string;
  changes: string[];
  untracked: string[];
  ahead: number;
  behind: number;
}

export class GitService {
  private getRepoPath(notebookId: string): string {
    return path.join(process.cwd(), 'repos', notebookId);
  }

  async initializeRepo(notebookId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const repoPath = this.getRepoPath(notebookId);

    try {
      // Sync notebook to repo first
      await this.syncNotebookToRepo(notebookId);

      // Initialize git repo
      await execAsync('git init', { cwd: repoPath });

      // Create initial commit
      await this.createInitialCommit(repoPath);

      // Log operation
      await prisma.auditLog.create({
        data: {
          userId,
          actionType: 'CREATE_NOTEBOOK', // Reuse action type
          resourceType: 'git',
          resourceId: notebookId,
          details: { operation: 'init' },
        },
      });

      return {
        success: true,
        message: 'Repository initialized successfully',
      };
    } catch (error) {
      console.error('Git init error:', error);
      throw new AppError(
        `Failed to initialize repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  async commitChanges(
    notebookId: string,
    userId: string,
    message: string
  ): Promise<{ success: boolean; commitHash: string }> {
    const repoPath = this.getRepoPath(notebookId);

    try {
      // Check if repo exists
      const gitPath = path.join(repoPath, '.git');
      try {
        await fs.access(gitPath);
      } catch {
        await this.initializeRepo(notebookId, userId);
      }

      // Sync current notebook state to repo
      await this.syncNotebookToRepo(notebookId);

      // Add all changes
      await execAsync('git add .', { cwd: repoPath });

      // Commit
      const { stdout } = await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
        cwd: repoPath,
      });

      const commitHash = stdout.match(/\[([a-f0-9]+)\]/)?.[1] || '';

      // Log operation
      await prisma.auditLog.create({
        data: {
          userId,
          actionType: 'UPDATE_NOTEBOOK',
          resourceType: 'git',
          resourceId: notebookId,
          details: { operation: 'commit', message, commitHash },
        },
      });

      return {
        success: true,
        commitHash,
      };
    } catch (error: any) {
      if (error.code === 1 && error.stdout.includes('nothing to commit')) {
        throw new AppError('No changes to commit', 400);
      }
      console.error('Git commit error:', error);
      throw new AppError(
        `Failed to commit changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  async getStatus(notebookId: string, _userId: string): Promise<GitStatus> {
    const repoPath = this.getRepoPath(notebookId);

    try {
      const gitPath = path.join(repoPath, '.git');
      await fs.access(gitPath);

      // Get branch name
      const { stdout: branch } = await execAsync('git branch --show-current', {
        cwd: repoPath,
      });

      // Get status
      const { stdout: status } = await execAsync('git status --porcelain', {
        cwd: repoPath,
      });

      const lines = status.trim().split('\n').filter(Boolean);
      const changes: string[] = [];
      const untracked: string[] = [];

      lines.forEach((line) => {
        if (line.startsWith('??')) {
          untracked.push(line.substring(3));
        } else {
          changes.push(line);
        }
      });

      // Get ahead/behind (if remote exists)
      let ahead = 0;
      let behind = 0;
      try {
        const { stdout: aheadBehind } = await execAsync('git rev-list --left-right --count @{u}...HEAD', {
          cwd: repoPath,
        });
        const [behindCount, aheadCount] = aheadBehind.trim().split('\t').map(Number);
        behind = behindCount || 0;
        ahead = aheadCount || 0;
      } catch {
        // No remote configured
      }

      return {
        branch: branch.trim() || 'main',
        changes,
        untracked,
        ahead,
        behind,
      };
    } catch (error) {
      // Repo not initialized
      return {
        branch: 'main',
        changes: [],
        untracked: [],
        ahead: 0,
        behind: 0,
      };
    }
  }

  async getLog(notebookId: string, limit: number = 20): Promise<any[]> {
    const repoPath = this.getRepoPath(notebookId);

    try {
      const gitPath = path.join(repoPath, '.git');
      await fs.access(gitPath);

      const { stdout } = await execAsync(
        `git log --pretty=format:"%H|%an|%ae|%ad|%s" --date=iso -n ${limit}`,
        { cwd: repoPath }
      );

      return stdout
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [hash, author, email, date, ...messageParts] = line.split('|');
          return {
            hash,
            author,
            email,
            date,
            message: messageParts.join('|'),
          };
        });
    } catch (error) {
      return [];
    }
  }

  async push(notebookId: string, userId: string, remote: string, branch: string): Promise<{ success: boolean; message: string }> {
    const repoPath = this.getRepoPath(notebookId);

    try {
      const gitPath = path.join(repoPath, '.git');
      await fs.access(gitPath);

      // Check if remote exists, add if not
      try {
        await execAsync(`git remote get-url ${remote}`, { cwd: repoPath });
      } catch {
        throw new AppError('Remote not configured. Please configure remote first.', 400);
      }

      await execAsync(`git push ${remote} ${branch}`, { cwd: repoPath });

      await prisma.auditLog.create({
        data: {
          userId,
          actionType: 'UPDATE_NOTEBOOK',
          resourceType: 'git',
          resourceId: notebookId,
          details: { operation: 'push', remote, branch },
        },
      });

      return {
        success: true,
        message: 'Pushed successfully',
      };
    } catch (error) {
      console.error('Git push error:', error);
      throw new AppError(
        `Failed to push: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  async pull(notebookId: string, userId: string, remote: string, branch: string): Promise<{ success: boolean; message: string }> {
    const repoPath = this.getRepoPath(notebookId);

    try {
      const gitPath = path.join(repoPath, '.git');
      await fs.access(gitPath);

      await execAsync(`git pull ${remote} ${branch}`, { cwd: repoPath });

      await prisma.auditLog.create({
        data: {
          userId,
          actionType: 'UPDATE_NOTEBOOK',
          resourceType: 'git',
          resourceId: notebookId,
          details: { operation: 'pull', remote, branch },
        },
      });

      return {
        success: true,
        message: 'Pulled successfully',
      };
    } catch (error) {
      console.error('Git pull error:', error);
      throw new AppError(
        `Failed to pull: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  async syncNotebookToRepo(notebookId: string): Promise<void> {
    const repoPath = this.getRepoPath(notebookId);

    try {
      // Get notebook from database
      const notebook = await prisma.notebook.findUnique({
        where: { id: notebookId },
      });

      if (!notebook) {
        throw new AppError('Notebook not found', 404);
      }

      // Ensure repo directory exists
      await fs.mkdir(repoPath, { recursive: true });

      // Write notebook content to file
      const filename = `notebook.${this.getFileExtension(notebook.language)}`;
      await fs.writeFile(path.join(repoPath, filename), notebook.content);

      // Write metadata
      await fs.writeFile(
        path.join(repoPath, 'notebook.json'),
        JSON.stringify({
          id: notebook.id,
          title: notebook.title,
          language: notebook.language,
          createdAt: notebook.createdAt,
          updatedAt: notebook.updatedAt,
        }, null, 2)
      );
    } catch (error) {
      console.error('Error syncing notebook to repo:', error);
      throw error;
    }
  }

  private getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
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
    return extensions[language.toLowerCase()] || 'txt';
  }

  private async createInitialCommit(repoPath: string): Promise<void> {
    // Create .gitignore
    await fs.writeFile(
      path.join(repoPath, '.gitignore'),
      'node_modules/\n.env\n*.log\n.DS_Store\n'
    );

    // Create README
    await fs.writeFile(
      path.join(repoPath, 'README.md'),
      '# Notebook Repository\n\nThis repository contains code notebooks.\n'
    );

    // Initial commit
    await execAsync('git add .', { cwd: repoPath });
    await execAsync('git commit -m "Initial commit"', {
      cwd: repoPath,
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: 'Universal Notebook',
        GIT_AUTHOR_EMAIL: 'notebook@universal-notebook.com',
        GIT_COMMITTER_NAME: 'Universal Notebook',
        GIT_COMMITTER_EMAIL: 'notebook@universal-notebook.com',
      },
    });
  }
}

export const gitService = new GitService();

