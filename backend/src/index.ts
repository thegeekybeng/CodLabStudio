import express from 'express';
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
import authRoutes from './routes/auth';
import notebookRoutes from './routes/notebooks';
import executionRoutes from './routes/executions';
import debugRoutes from './routes/debug';
import packageRoutes from './routes/packages';
import gitRoutes from './routes/git';
import sessionRoutes from './routes/session';
import { initializeSocketIO } from './services/notification/socket';
import seed from './database/seed';

dotenv.config();

// Seed admin user on startup
seed().catch((error) => {
  console.error('Failed to seed database:', error);
});

const app = express();
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
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(requestLogger);

// Guest session middleware (before routes)
app.use(guestSessionMiddleware);

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
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

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { io };

