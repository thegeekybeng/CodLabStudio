import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { securityHeaders, sanitizeInput, validateRequestSize } from './middleware/security';
import { requestLogger } from './middleware/logger';
import { guestSessionMiddleware } from './middleware/guestSession';
import { telemetryMiddleware } from './middleware/telemetry';
import authRoutes from './routes/auth';
import notebookRoutes from './routes/notebooks';
import executionRoutes from './routes/executions';
import debugRoutes from './routes/debug';
import packageRoutes from './routes/packages';
import gitRoutes from './routes/git';
import sessionRoutes from './routes/session';
import { sessionService } from './services/session/sessionService';
import { initializeSocketIO } from './services/notification/socket';
import { dockerService } from './services/docker/dockerService';
import seed from './database/seed';

dotenv.config();

// Cleanup orphan containers on startup
dockerService.pruneSessionContainers().catch(console.error);

// Seed admin user on startup
seed().catch((error) => {
  console.error('Failed to seed database:', error);
});

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);
// Socket.IO CORS - allow multiple origins
const socketOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'development'
      ? true  // Allow all origins in development
      : socketOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(securityHeaders);
app.use(sanitizeInput);
app.use(validateRequestSize(10 * 1024 * 1024)); // 10MB max
// CORS configuration - allow multiple origins for development
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow strictly defined origins, OR any localhost/127.0.0.1 for better DX
    if (
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV === 'development' ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      callback(null, true);
    } else {
      console.error(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(requestLogger);

// Telemetry (Low-volume visitor tracking)
app.use(telemetryMiddleware);

// Guest session middleware (before routes)
app.use(guestSessionMiddleware);

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/notebooks', notebookRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/git', gitRoutes);
app.use('/api/session', sessionRoutes);

// Initialize Socket.IO
initializeSocketIO(io);

// Error handling middleware (must be last)
app.use(errorHandler);

const gracefulShutdown = async (signal: string) => {
  console.log(`[SERVER] Received ${signal}. Starting graceful shutdown...`);

  // 1. Close HTTP server to stop accepting new requests
  httpServer.close(() => {
    console.log('[SERVER] HTTP server closed.');
  });

  // 2. Cleanup active sessions
  try {
    console.log('[SERVER] Cleaning up active sessions...');
    await sessionService.terminateAllSessions();
    // Also run the docker prune as a safety net
    await dockerService.pruneSessionContainers();
    console.log('[SERVER] Session cleanup complete.');
  } catch (err) {
    console.error('[SERVER] Error during session cleanup:', err);
  }

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { io };

