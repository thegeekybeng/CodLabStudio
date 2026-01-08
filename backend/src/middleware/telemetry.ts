import { Request, Response, NextFunction } from 'express';

export const telemetryMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    // Ignored paths
    if (
        req.path.startsWith('/_next') ||
        req.path.startsWith('/static') ||
        /\.(map|js|css|ico|png|jpg|jpeg|svg|woff|woff2|ttf|eot)$/.test(req.path)
    ) {
        return next();
    }

    // Extract IP
    let ip = req.headers['cf-connecting-ip'] as string;
    if (!ip) {
        ip = req.socket.remoteAddress || '';
        // Handle IPv6 mapped IPv4 addresses
        if (ip.startsWith('::ffff:')) {
            ip = ip.substring(7);
        }
    }

    // Extract User Agent
    const ua = req.headers['user-agent'] || 'unknown';

    // Extract Referer
    const ref = req.headers['referer'] || 'direct';

    // Log Telemetry
    // Format: [TELEMETRY] IP=<ip> PATH=<path> REF=<referer> UA=<user_agent>
    console.log(`[TELEMETRY] IP=${ip} PATH=${req.path} REF=${ref} UA=${ua}`);

    next();
};
