import "dotenv/config";
import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Configure CORS for your frontend domain
  app.use(cors({
    origin: function (origin, callback) {
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get('/health', (req, res) => {
    res.status(200).json({
      status: "OK",
      uptime: process.uptime(),
      timestamp: Date.now()
    });
  });

  // Proxy /api to https://sports.bzzoiro.com/api
  app.use(createProxyMiddleware({
    target: 'https://sports.bzzoiro.com',
    changeOrigin: true,
    pathFilter: '/api',
    on: {
      proxyReq: (proxyReq, req, res) => {
        if (!req.headers.authorization) {
          const apiKey = process.env.SPORTSBZZOIRO_API_KEY || '';
          proxyReq.setHeader('Authorization', `Token ${apiKey}`);
        }
      },
      error: (err, req, res) => {
        console.error('Proxy error (/api):', err);
        if ('headersSent' in res && !res.headersSent) {
          res.writeHead(502);
          res.end('Bad Gateway');
        }
      }
    }
  }));

  // Proxy /football-api to https://api.football-data.org/v4
  app.use(createProxyMiddleware({
    target: 'https://api.football-data.org/v4',
    changeOrigin: true,
    pathFilter: '/football-api',
    pathRewrite: {
      '^/football-api': '', // remove /football-api from the path
    },
    on: {
      proxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('X-Auth-Token', process.env.FOOTBALL_DATA_API_KEY || '');
      },
      error: (err, req, res) => {
        console.error('Proxy error (/football-api):', err);
        if ('headersSent' in res && !res.headersSent) {
          res.writeHead(502);
          res.end('Bad Gateway');
        }
      }
    }
  }));

  // Proxy /sportsdb-api to https://www.thesportsdb.com/api/v1/json/123
  app.use(createProxyMiddleware({
    target: 'https://www.thesportsdb.com/api/v1/json/123',
    changeOrigin: true,
    pathFilter: '/sportsdb-api',
    pathRewrite: {
      '^/sportsdb-api': '',
    },
    on: {
      error: (err, req, res) => {
        console.error('Proxy error (/sportsdb-api):', err);
        if ('headersSent' in res && !res.headersSent) {
          res.writeHead(502);
          res.end('Bad Gateway');
        }
      }
    }
  }));

  // Proxy /img to https://sports.bzzoiro.com/img
  app.use(createProxyMiddleware({
    target: 'https://sports.bzzoiro.com',
    changeOrigin: true,
    pathFilter: '/img',
    on: {
      proxyReq: (proxyReq, req, res) => {
        if (!req.headers.authorization) {
          const apiKey = process.env.SPORTSBZZOIRO_API_KEY || '';
          proxyReq.setHeader('Authorization', `Token ${apiKey}`);
        }
      },
      error: (err, req, res) => {
        console.error('Proxy error (/img):', err);
        if ('headersSent' in res && !res.headersSent) {
          res.writeHead(502);
          res.end('Bad Gateway');
        }
      }
    }
  }));

  // Remove trailing slashes to fix Vite resolving issues
  app.use((req, res, next) => {
    if (req.path.length > 1 && req.path.endsWith('/')) {
      const query = req.url.slice(req.path.length)
      const safepath = req.path.slice(0, -1)
      req.url = safepath + query
    }
    next()
  })

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
