import { v4 as uuidv4 } from 'uuid';
import { dockerService, ContainerConfig } from '../docker/dockerService';
import { AppError } from '../../middleware/errorHandler';

export interface CreateSessionInput {
    userId: string;
    language: string;
}

export interface SessionConfig {
    sessionId: string;
    containerId: string;
    language: string;
    status: 'active' | 'inactive';
    userId: string;
    createdAt: Date;
    lastActivity: Date;
}

export const LANGUAGE_IMAGES: Record<string, string> = {
    python: 'codlab-python:latest',
    py: 'codlab-python:latest',
    'python3.10': 'python:3.10-alpine',
    'python3.12': 'python:3.12-alpine',
    javascript: 'node:20-alpine',
    js: 'node:20-alpine',
    node: 'node:20-alpine',
    'node18': 'node:18-alpine',
    'node19': 'node:19-alpine',
    typescript: 'node:20-alpine',
    ts: 'node:20-alpine',
    java: 'eclipse-temurin:17-alpine',
    'java11': 'eclipse-temurin:11-alpine',
    'java21': 'eclipse-temurin:21-alpine',
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

// SUPPORTED_LANGUAGES removed as unused

// Languages verified to work in the current deployment environment
const ENABLED_LANGUAGES = [
    'python',
    'javascript',
    'typescript',
    'java'
];

export class SessionService {
    // In-memory store for active sessions in the Sandbox
    // In specific prod architecture, this would be Redis
    private activeSessions = new Map<string, SessionConfig>(); // key: sessionId
    private userSessions = new Map<string, string>(); // key: userId -> sessionId

    getSupportedLanguages(): string[] {
        return ENABLED_LANGUAGES;
    }

    async createSession(input: CreateSessionInput): Promise<{ sessionId: string }> {
        const { userId, language } = input;

        // 1. Check if user already has an active session for this language
        // Simplication: One session per user for now in Sandbox
        const existingSessionId = this.userSessions.get(userId);
        if (existingSessionId) {
            const existingSession = this.activeSessions.get(existingSessionId);
            if (existingSession && existingSession.status === 'active') {
                // If language matches, return existing. If not, stop old and create new.
                if (existingSession.language === language) {
                    console.log(`[SESSION] Reusing existing session ${existingSessionId} for ${userId}`);
                    existingSession.lastActivity = new Date();
                    return { sessionId: existingSessionId };
                } else {
                    console.log(`[SESSION] Switching language for ${userId}. Stopping session ${existingSessionId}`);
                    await this.stopSession(existingSessionId);
                }
            } else {
                // Cleanup stale reference
                this.userSessions.delete(userId);
            }
        }

        // 2. Validate Language
        const normalizedLanguage = language.toLowerCase();
        const image = LANGUAGE_IMAGES[normalizedLanguage];
        if (!image) {
            throw new AppError(`Language ${language} is not supported.`, 400);
        }

        console.log(`[SESSION] Creating new session for ${userId} in ${language} (Image: ${image})`);

        // 3. Create Session ID
        const sessionId = uuidv4();

        // 4. Create Persistent Container
        try {
            const networkName = process.env.DOCKER_NETWORK || 'bridge';
            const sessionVolume = process.env.SESSION_VOLUME || 'codlab_sessions';

            const containerConfig: ContainerConfig = {
                image,
                cmd: ['sh', '-c', 'mkdir -p /sessions/' + sessionId + ' && sleep infinity'],
                env: ['PYTHONUNBUFFERED=1'],
                networkMode: networkName, // Attach to Sandbox Network
                binds: [
                    `${sessionVolume}:/sessions` // Persist all sessions data
                ],
                workingDir: `/sessions/${sessionId}`
            };

            const container = await dockerService.createContainer(containerConfig);
            await container.start();

            const sessionConfig: SessionConfig = {
                sessionId,
                containerId: container.id,
                language: normalizedLanguage,
                status: 'active',
                userId,
                createdAt: new Date(),
                lastActivity: new Date()
            };

            this.activeSessions.set(sessionId, sessionConfig);
            this.userSessions.set(userId, sessionId);

            console.log(`[SESSION] Session ${sessionId} started successfully.`);
            return { sessionId };

        } catch (error) {
            console.error(`[SESSION] Failed to create session container:`, error);
            throw new AppError('Failed to initialize coding session', 500);
        }
    }

    async getSession(sessionId: string): Promise<SessionConfig | null> {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.lastActivity = new Date();
        }
        return session || null;
    }

    async getSessionContainer(sessionId: string): Promise<string> {
        const session = this.activeSessions.get(sessionId);
        if (!session || session.status !== 'active') {
            throw new AppError('Session not found or inactive', 404);
        }
        return session.containerId;
    }

    async stopSession(sessionId: string): Promise<void> {
        const session = this.activeSessions.get(sessionId);
        if (!session) return;

        console.log(`[SESSION] Stopping session ${sessionId} (Container: ${session.containerId})`);

        try {
            // Since DockerService doesn't expose getContainer directly by ID in current interface (it wraps create), 
            // we might need to rely on dockerode instance or add a helper.
            // However, dockerService.stopContainer takes a Container object.
            // Let's assume we can get it via dockerode global or add a helper. 
            // For now, let's look at DockerService again. It exports 'docker' instance? No, it's private.
            // I will add a method `getContainerById` to `DockerService` in next step to support this.
            // For now, assume it exists.
            await dockerService.stopContainerById(session.containerId);
        } catch (err) {
            console.error(`[SESSION] Error stopping container ${session.containerId}:`, err);
        }

        session.status = 'inactive';
        this.activeSessions.delete(sessionId);
        this.userSessions.delete(session.userId);
    }
}

export const sessionService = new SessionService();
