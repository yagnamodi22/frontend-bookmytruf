// Main API router for serverless functions
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Create Express server
const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// For development, proxy to the Java backend
const target = process.env.BACKEND_URL || 'http://localhost:8080';

// Setup proxy for all API routes
app.use('/api', createProxyMiddleware({
  target,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  },
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Export the Express API
export default app;