import { PrismaClient, DebugSessionStatus } from '@prisma/client';
import { dockerService } from '../docker/dockerService';
import { sessionService } from '../session/sessionService';
import { AppError } from '../../middleware/errorHandler';
import { emitToUser } from '../notification/socket';
import { DapClient } from './dapClient';

const prisma = new PrismaClient();

export interface StartDebugSessionInput {
  code: string;
  language: string;
  breakpoints: number[];
  userId: string;
  notebookId?: string;
}

export interface DebugCommand {
  type: 'step_over' | 'step_into' | 'step_out' | 'continue' | 'pause' | 'evaluate' | 'stop';
  expression?: string;
}

const DEBUG_CONFIG: Record<string, { cmd: string; port: number }> = {
  python: {
    // Optimized: debugpy is pre-installed in codlab-python
    cmd: 'python3 -m debugpy --listen 0.0.0.0:5678 --wait-for-client /sessions/{sessionId}/user_script.py',
    port: 5678,
  },
  go: {
    cmd: 'sh -c "go install github.com/go-delve/delve/cmd/dlv@latest && /go/bin/dlv debug --headless --listen=:5678 --api-version=2 --accept-multiclient ."',
    port: 5678,
  }
  // Add other languages here
};

export class DebugService {
  private activeClients = new Map<string, DapClient>(); // sessionId -> DapClient

  async startDebugSession(input: StartDebugSessionInput): Promise<{ sessionId: string }> {
    const { code, language, breakpoints, userId, notebookId } = input;
    console.log(`[DEBUG_SERVICE] startDebugSession breakpoints:`, breakpoints);
    const normalizedLanguage = language.toLowerCase();

    // 1. Get or Create Session
    const { sessionId } = await sessionService.createSession({ userId, language: normalizedLanguage });
    const containerId = await sessionService.getSessionContainer(sessionId);
    const container = dockerService.getContainer(containerId);

    // 2. Write Code to Session Volume
    // We reuse the session volume mount at /sessions/{sessionId}
    // Note: In real app, we might use a proper FileService. Here we use docker exec to write.
    const filename = normalizedLanguage === 'go' ? 'main.go' : 'user_script.py';
    const filePath = `/sessions/${sessionId}/${filename}`;
    const writeCmd = `cat <<EOF > ${filePath}\n${code}\nEOF`;

    await dockerService.executeCode(container, writeCmd, 'bash'); // Quick write using bash header

    // 3. Get Debug Config
    const config = DEBUG_CONFIG[normalizedLanguage] || DEBUG_CONFIG['python']; // Fallback/Default
    if (!config) throw new AppError('Debug not supported for this language', 400);

    const debugCmd = config.cmd.replace('{sessionId}', sessionId);

    // 4. Cleanup Port & Start Debugger inside Container (Detached)
    // Ensure port is free (kill any zombie debugpy from previous timeouts)
    // BusyBox fuser syntax: fuser -k 5678/tcp
    const cleanupCmd = `fuser -k ${config.port}/tcp || true`;
    await dockerService.executeCode(container, cleanupCmd, 'sh');

    // We assume the debugger will listen on 0.0.0.0 inside the container
    await dockerService.execDetached(container, ['sh', '-c', debugCmd]);

    // 5. Get Container IP to connect DAP Client
    // Use configured network or default to the first available one
    const inspect = await dockerService.getContainerInspect(containerId);
    const networks = inspect.NetworkSettings.Networks;
    const networkName = process.env.DOCKER_NETWORK;
    const targetNet = networkName ? networks[networkName] : Object.values(networks)[0];

    if (!targetNet) {
      console.error('[DEBUG] Available networks:', Object.keys(networks));
      throw new AppError('Could not find accessible network for container', 500);
    }
    const containerIp = targetNet.IPAddress;

    // 6. Connect DAP Client
    console.log(`[DEBUG] Connecting to DAP at ${containerIp}:${config.port}`);

    // Retry logic for connection (debugger takes time to start, especially with pip install)
    let client: DapClient | null = null;
    let connected = false;

    for (let i = 0; i < 120; i++) { // 120 retries * 1000ms = 2 minutes (needed for initial go install dlv)
      try {
        client = new DapClient(containerIp, config.port);
        await client.connect();
        connected = true;
        break;
      } catch (e) {
        // console.log('Retrying connection...');
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    if (!connected || !client) throw new AppError('Failed to connect to debugger', 500);

    this.activeClients.set(sessionId, client);

    // 7. Initialize DAP
    this.setupDapListeners(sessionId, userId, client);

    await client.sendRequest('initialize', {
      adapterID: normalizedLanguage,
      linesStartAt1: true,
      columnsStartAt1: true,
      pathFormat: 'path',
    });

    await client.sendRequest('attach', {
      name: 'Remote Attach',
      type: 'python',
      request: 'attach',
      connect: {
        host: 'localhost', // ignored by debugpy when we are the client connected via TCP?
        port: config.port
      },
      pathMappings: [
        {
          localRoot: `/sessions/${sessionId}`, // We are running inside the container technically? No backend is separate.
          remoteRoot: `/sessions/${sessionId}` // They share the volume mount path!
        }
      ]
    });

    // Set Breakpoints (Simplified: assuming file path matches)
    if (breakpoints.length > 0) {
      await client.sendRequest('setBreakpoints', {
        source: { path: filePath },
        breakpoints: breakpoints.map(l => ({ line: l })),
      });
    }

    await client.sendRequest('configurationDone');

    // Create DB Record
    await prisma.debugSession.create({
      data: {
        id: sessionId,
        userId: userId,
        notebookId: notebookId,
        status: DebugSessionStatus.ACTIVE,
        breakpoints: JSON.stringify(breakpoints) as any,
      }
    }).catch(e => console.error("DB Error (ignoring for now):", e));

    return { sessionId };
  }

  private setupDapListeners(sessionId: string, userId: string, client: DapClient) {
    client.on('stopped', async (event) => {
      // Fetch stack trace when stopped
      const threadId = event.threadId;
      const stack = await client.sendRequest('stackTrace', { threadId });
      const topFrame = stack.stackFrames[0];

      let variables: any[] = [];
      if (topFrame) {
        const scopes = await client.sendRequest('scopes', { frameId: topFrame.id });
        if (scopes.scopes.length > 0) {
          const vars = await client.sendRequest('variables', { variablesReference: scopes.scopes[0].variablesReference });
          variables = vars.variables;
        }
      }

      emitToUser(userId, 'debug:paused', {
        sessionId,
        reason: event.reason,
        stack: stack.stackFrames,
        variables,
      });
    });

    client.on('output', (event) => {
      if (event.category === 'stdout' || event.category === 'stderr') {
        emitToUser(userId, 'debug:output', {
          sessionId,
          type: event.category,
          content: event.output
        });
      }
    });

    client.on('terminated', () => {
      this.activeClients.delete(sessionId);
      emitToUser(userId, 'debug:terminated', { sessionId });
    });
  }

  async stopDebugSession(sessionId: string, userId: string): Promise<void> {
    console.log(`[DEBUG] Stopping session ${sessionId} for user ${userId}`);
    const client = this.activeClients.get(sessionId);
    if (client) {
      await client.disconnect();
      this.activeClients.delete(sessionId);
    }

    // Update DB
    await prisma.debugSession.update({
      where: { id: sessionId },
      data: { status: DebugSessionStatus.TERMINATED }
    }).catch(e => console.log('DB update failed, ignoring', e));

    emitToUser(userId, 'debug:terminated', { sessionId });
  }

  async getDebugSession(sessionId: string, userId: string): Promise<any> {
    // Return DB record or active status
    const session = await prisma.debugSession.findUnique({
      where: { id: sessionId }
    });

    if (!session || session.userId !== userId) {
      throw new AppError('Debug session not found', 404);
    }

    const isActive = this.activeClients.has(sessionId);
    return { ...session, isActive };
  }

  async executeDebugCommand(sessionId: string, _userId: string, command: DebugCommand): Promise<void> {
    const client = this.activeClients.get(sessionId);
    if (!client) throw new AppError('Debug session not found', 404);

    switch (command.type) {
      case 'step_over':
        await client.sendRequest('next', { threadId: 1 }); // customize threadId if needed
        break;
      case 'step_into':
        await client.sendRequest('stepIn', { threadId: 1 });
        break;
      case 'step_out':
        await client.sendRequest('stepOut', { threadId: 1 });
        break;
      case 'continue':
        await client.sendRequest('continue', { threadId: 1 });
        break;
      case 'stop':
        await client.disconnect();
        this.activeClients.delete(sessionId);
        break;
      case 'evaluate':
        if (command.expression) {
          // Get info for context, assume frameId 0 or tracked state
          // Simplified:
          // const resp = await client.sendRequest('evaluate', { expression: command.expression, frameId: ... });
        }
        break;
    }
  }

  getDebuggableLanguages(): string[] {
    return Object.keys(DEBUG_CONFIG);
  }
}

export const debugService = new DebugService();
