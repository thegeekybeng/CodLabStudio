import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = (req as AuthRequest).userId || 'anonymous';

    console.log({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString(),
    });
  });

  next();
};

export const errorLogger = (error: Error, req: Request): void => {
  const userId = (req as AuthRequest).userId || 'anonymous';

  console.error({
    error: {
      message: error.message,
      stack: error.stack,
    },
    request: {
      method: req.method,
      path: req.path,
      userId,
      ip: req.ip || req.socket.remoteAddress,
      body: req.body,
      query: req.query,
      params: req.params,
    },
    timestamp: new Date().toISOString(),
  });
};

