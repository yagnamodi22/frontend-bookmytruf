// Main API router for serverless functions
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Create Express server
const app = express();

// Enable CORS with proper cross-domain configuration
app.use(cors({
  origin: ['https://frontend-bookmytruf.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Authorization', 'Set-Cookie'],
  credentials: true,
  maxAge: 86400
}));

// Parse JSON bodies
app.use(express.json());

// For development, proxy to the Java backend
const target = process.env.BACKEND_URL || 'http://localhost:8080';

// Setup proxy for all API routes with cookie support
app.use('/api', createProxyMiddleware({
  target,
  changeOrigin: true,
  cookieDomainRewrite: 'frontend-bookmytruf.vercel.app',
  pathRewrite: {
    '^/api': '/api'
  },
  onProxyRes: (proxyRes) => {
    if (proxyRes.headers['set-cookie']) {
      const cookies = proxyRes.headers['set-cookie'].map(cookie =>
        cookie.replace(/SameSite=Lax/gi, 'SameSite=None; Secure')
      );
      proxyRes.headers['set-cookie'] = cookies;
    }
  },
  withCredentials: true
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Export the Express API
export default app;