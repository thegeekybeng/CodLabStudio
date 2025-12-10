import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const executionRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10, // 10 executions per minute per IP
  message: 'Too many execution requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

