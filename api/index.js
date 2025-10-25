// Vercel serverless function for API routes
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Get backend URL from environment variable
const BACKEND_URL = process.env.BACKEND_URL || 'https://your-backend-url.com';

// Proxy middleware function
const proxyRequest = async (req, res) => {
  try {
    const { method, url, headers, body } = req;
    
    // Forward the request to the backend
    const response = await axios({
      method,
      url: `${BACKEND_URL}${url.replace(/^\/api/, '')}`,
      headers: {
        ...headers,
        host: new URL(BACKEND_URL).host,
      },
      data: body,
      validateStatus: () => true,
    });
    
    // Return the response from the backend
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Handle all API routes
app.all('/api/*', proxyRequest);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Export the Express API
export default app;