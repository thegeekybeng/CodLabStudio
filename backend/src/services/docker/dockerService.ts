import Docker from 'dockerode';
import { AppError } from '../../middleware/errorHandler';

const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
});

export interface ContainerConfig {
  image: string;
  cmd: string[];
  env?: string[];
  workingDir?: string;
  memory?: number; // in bytes
  cpuPeriod?: number;
  cpuQuota?: number;
  networkDisabled?: boolean;
  networkMode?: string; // Add support for custom networks
  readonlyRootfs?: boolean;
  binds?: string[];
  labels?: Record<string, string>;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
}

export class DockerService {
  private readonly MAX_MEMORY = 512 * 1024 * 1024; // 512MB
  private readonly MAX_CPU_QUOTA = 100000; // 1 CPU core
  private readonly EXECUTION_TIMEOUT = parseInt(
    process.env.EXECUTION_TIMEOUT_MS || '30000',
    10
  );

  async createContainer(config: ContainerConfig): Promise<Docker.Container> {
    try {
      // Check if image exists, pull if not
      const imageExists = await this.imageExists(config.image);
      if (!imageExists) {
        console.log(`Image ${config.image} not found, pulling...`);
        await this.pullImage(config.image);
      }

      const containerConfig: Docker.ContainerCreateOptions = {
        Image: config.image,
        Cmd: config.cmd || ['sh', '-c', 'sleep infinity'],
        Env: config.env || [],
        WorkingDir: config.workingDir || '/tmp',
        HostConfig: {
          Memory: config.memory || this.MAX_MEMORY,
          CpuPeriod: config.cpuPeriod || 100000,
          CpuQuota: config.cpuQuota || this.MAX_CPU_QUOTA,
          NetworkMode: config.networkMode || (config.networkDisabled ? 'none' : 'bridge'),
          ReadonlyRootfs: config.readonlyRootfs || false,
          AutoRemove: true, // Auto-remove container when it stops
          Binds: config.binds || [],
        },
        AttachStdout: true,
        AttachStderr: true,
        Tty: false,
        Labels: config.labels || {},
      };

      const container = await docker.createContainer(containerConfig);
      console.log(`[DOCKER] Container created: ${container.id}`);
      return container;
    } catch (error) {
      console.error('[DOCKER] Error creating container:', error);
      throw new AppError('Failed to create execution container', 500);
    }
  }

  async executeCode(
    container: Docker.Container,
    code: string,
    language: string,
    onProgress?: (type: 'stdout' | 'stderr', data: string) => void
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Start container if not running
      try {
        await container.start();
      } catch (err: any) {
        // Ignore 304 (already started)
        if (err.statusCode !== 304) {
          // throw err; // Actually, looking at dockerode, 304 might be thrown as error or just returned.
          // The previous error log showed it throwing.
          console.log('[DOCKER] Container already running, proceeding...');
        }
      }

      // Create a script that writes code and executes it
      const executeScript = this.createExecuteScript(language, code);
      console.log('[DOCKER] Executing script:', executeScript);

      // Execute the script
      const exec = await container.exec({
        Cmd: ['sh', '-c', executeScript],
        AttachStdout: true,
        AttachStderr: true,
        Tty: false,
      });

      const stream = await exec.start({ hijack: true, stdin: false });

      let stdout = '';
      let stderr = '';
      let exitCode = 0;

      // Set timeout
      const timeout = setTimeout(async () => {
        try {
          await container.stop({ t: 0 });
        } catch (error) {
          console.error('Error stopping container:', error);
        }
      }, this.EXECUTION_TIMEOUT);

      // Collect output
      await new Promise<void>((resolve, reject) => {
        container.modem.demuxStream(stream, {
          write: (chunk: Buffer) => {
            const data = chunk.toString();
            console.log('[STREAM DEBUG] stdout chunk:', data);
            stdout += data;
            if (onProgress) onProgress('stdout', data);
          },
        }, {
          write: (chunk: Buffer) => {
            const data = chunk.toString();
            console.log('[STREAM DEBUG] stderr chunk:', data);
            stderr += data;
            if (onProgress) onProgress('stderr', data);
          },
        });

        stream.on('data', (chunk) => {
          console.log('[DOCKER RAW STREAM] Chunk length:', chunk.length);
          // Optional: Print first few bytes to see header
          if (chunk.length >= 8) {
            console.log('[DOCKER RAW HEADER]', chunk.slice(0, 8));
          }
        });

        stream.on('end', async () => {
          console.log('[DOCKER STREAM] Stream ended');
          clearTimeout(timeout);
          try {
            const inspect = await exec.inspect();
            exitCode = inspect.ExitCode || 0;
          } catch (err) {
            console.error('Error inspecting exec:', err);
          }
          resolve();
        });

        stream.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      const executionTime = Date.now() - startTime;

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode,
        executionTime,
      };
    } catch (error) {
      // executionTime not used here but could be logged
      console.error('Error executing code:', error);

      // Try to stop container
      try {
        await container.stop({ t: 0 });
      } catch (stopError) {
        console.error('Error stopping container:', stopError);
      }

      throw new AppError(
        `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  async stopContainer(container: Docker.Container): Promise<void> {
    try {
      await container.stop({ t: 0 });
    } catch (error) {
      // Container might already be stopped
      console.warn('Container stop warning:', error);
    }
  }

  getContainer(id: string): Docker.Container {
    return docker.getContainer(id);
  }

  async stopContainerById(id: string): Promise<void> {
    const container = this.getContainer(id);
    await this.stopContainer(container);
  }

  private createExecuteScript(language: string, code: string): string {
    // Escape code for shell
    const escapedCode = code.replace(/'/g, "'\\''");

    switch (language.toLowerCase()) {
      case 'python':
      case 'py':
      case 'python3.10':
      case 'python3.11':
      case 'python3.12':
        return `echo '${escapedCode}' > /tmp/code.py && python3 -u /tmp/code.py`;
      case 'javascript':
      case 'js':
      case 'node':
      case 'node18':
      case 'node19':
        return `echo '${escapedCode}' > /tmp/code.js && node /tmp/code.js`;
      case 'typescript':
      case 'ts':
        // simplified npx command
        return `echo '${escapedCode}' > /tmp/code.ts && (npx -y -p typescript tsc /tmp/code.ts 2>&1 && node /tmp/code.js || echo "TypeScript compilation failed")`;
      case 'java':
      case 'java11':
      case 'java17':
      case 'java21':
        return `echo '${escapedCode}' > /tmp/Main.java && javac /tmp/Main.java 2>&1 && java -cp /tmp Main`;
      case 'cpp':
        return `echo '${escapedCode}' > /tmp/code.cpp && g++ -o /tmp/code /tmp/code.cpp 2>&1 && /tmp/code`;
      case 'c':
        return `echo '${escapedCode}' > /tmp/code.c && gcc -o /tmp/code /tmp/code.c 2>&1 && /tmp/code`;
      case 'go':
      case 'go1.20':
      case 'go1.21':
      case 'go1.22':
        return `echo '${escapedCode}' > /tmp/code.go && go run /tmp/code.go`;
      case 'rust':
      case 'rust1.69':
      case 'rust1.70':
      case 'rust1.71':
        return `echo '${escapedCode}' > /tmp/code.rs && rustc /tmp/code.rs -o /tmp/code 2>&1 && /tmp/code`;
      case 'ruby':
      case 'ruby3.1':
      case 'ruby3.2':
      case 'ruby3.3':
        return `echo '${escapedCode}' > /tmp/code.rb && ruby /tmp/code.rb`;
      case 'php':
      case 'php8.1':
      case 'php8.2':
      case 'php8.3':
        return `echo '${escapedCode}' > /tmp/code.php && php /tmp/code.php`;
      case 'swift':
        return `echo '${escapedCode}' > /tmp/code.swift && swift /tmp/code.swift`;
      case 'kotlin':
        return `echo '${escapedCode}' > /tmp/code.kt && kotlinc /tmp/code.kt -include-runtime -d /tmp/code.jar && java -jar /tmp/code.jar`;
      case 'scala':
        return `echo '${escapedCode}' > /tmp/code.scala && scalac /tmp/code.scala && scala Main`;
      case 'r':
        return `echo '${escapedCode}' > /tmp/code.R && Rscript /tmp/code.R`;
      case 'julia':
        return `echo '${escapedCode}' > /tmp/code.jl && julia /tmp/code.jl`;
      case 'perl':
        return `echo '${escapedCode}' > /tmp/code.pl && perl /tmp/code.pl`;
      case 'bash':
      case 'shell':
        return `echo '${escapedCode}' > /tmp/code.sh && bash /tmp/code.sh`;
      default:
        return `echo '${escapedCode}' > /tmp/code && sh /tmp/code`;
    }
  }

  async pullImage(image: string): Promise<void> {
    return new Promise((resolve, reject) => {
      docker.pull(image, (err: any, stream: any) => {
        if (err) {
          reject(err);
          return;
        }

        docker.modem.followProgress(stream, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async getContainerInspect(id: string): Promise<Docker.ContainerInspectInfo> {
    const container = this.getContainer(id);
    return await container.inspect();
  }

  async execDetached(container: Docker.Container, cmd: string[]): Promise<void> {
    const exec = await container.exec({
      Cmd: cmd,
      AttachStdout: false,
      AttachStderr: false,
      Tty: false,
    });
    await exec.start({ Detach: true });
  }

  async imageExists(image: string): Promise<boolean> {
    try {
      const imageObj = docker.getImage(image);
      await imageObj.inspect();
      return true;
    } catch {
      return false;
    }
  }

  async pruneSessionContainers(): Promise<void> {
    try {
      console.log('[DOCKER] Scanning for orphan session containers (Legacy & Labeled)...');

      // 1. Get ALL containers (we need to inspect ones without labels too)
      const containers = await docker.listContainers({ all: true });

      if (containers.length === 0) {
        console.log('[DOCKER] No containers found.');
        return;
      }

      const ZOMBIE_IMAGES = [
        'codlab-python:latest',
        'node:20-alpine',
        'golang:1.21-alpine',
        'python:3.10-alpine',
        'python:3.12-alpine',
        'node:18-alpine',
        'eclipse-temurin:17-alpine',
        'gcc:latest',
        'rust:1.70-alpine',
        'ruby:3.2-alpine',
        'php:8.2-alpine'
      ];

      const zombies = containers.filter((info) => {
        const labels = info.Labels || {};

        // Criterion 1: New Labeled Zombies
        if (labels['type'] === 'session_worker' && labels['app'] === 'codlabstudio') {
          return true;
        }

        // Criterion 2: Legacy Zombies (No Compose Project, Known Image)
        const isComposeProject = labels['com.docker.compose.project'] !== undefined;
        const isSystemContainer = labels['io.portainer.server'] !== undefined; // Safe guard
        const image = info.Image;

        // Check if image matches any of our known runtime images (or starts with them)
        const isRuntimeImage = ZOMBIE_IMAGES.some(img => image.includes(img) || img.includes(image));

        if (!isComposeProject && !isSystemContainer && isRuntimeImage) {
          console.log(`[DOCKER] Identified Legacy Zombie: ${info.Names[0]} (${image})`);
          return true;
        }

        return false;
      });

      if (zombies.length === 0) {
        console.log('[DOCKER] No orphan containers found.');
        return;
      }

      console.log(`[DOCKER] Found ${zombies.length} orphan containers. Reaping...`);

      const promises = zombies.map(async (info) => {
        try {
          const container = docker.getContainer(info.Id);
          await container.remove({ force: true });
          console.log(`[DOCKER] Reaped container: ${info.Id.substring(0, 12)} (${info.Names[0]})`);
        } catch (e) {
          console.error(`[DOCKER] Failed to reap container ${info.Id.substring(0, 12)}:`, e);
        }
      });

      await Promise.all(promises);
      console.log('[DOCKER] Cleanup complete.');
    } catch (error) {
      console.error('[DOCKER] Startup cleanup failed:', error);
    }
  }
}

export const dockerService = new DockerService();
