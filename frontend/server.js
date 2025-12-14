
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { createProxyMiddleware } = require('http-proxy-middleware');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Define proxy middleware
const apiProxy = createProxyMiddleware({
  target: 'http://backend:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api', // keep /api prefix
  },
});

const socketProxy = createProxyMiddleware({
  target: 'http://backend:3001',
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  // Ensure we proxy to /socket.io/ (trailing slash handled by target + path)
});

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      // Handle API routes via proxy
      if (pathname.startsWith('/api')) {
        return apiProxy(req, res);
      }

      // Handle Socket.IO via proxy (Polling)
      if (pathname.startsWith('/socket.io')) {
        return socketProxy(req, res);
      }

      // Handle all other routes via Next.js
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Handle WebSocket Upgrades
  server.on('upgrade', (req, socket, head) => {
    const parsedUrl = parse(req.url, true);
    if (parsedUrl.pathname.startsWith('/socket.io')) {
      socketProxy.upgrade(req, socket, head);
    } else {
      socket.destroy();
    }
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
