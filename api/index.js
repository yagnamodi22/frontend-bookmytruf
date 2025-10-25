// Vercel serverless function for API routes
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();

// Enable CORS with proper configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Use the deployed backend URL
const BACKEND_URL = process.env.BACKEND_URL || 'https://book-by-truf-backend.onrender.com';

// Proxy middleware function
const proxyRequest = async (req, res) => {
  try {
    const { method, url, headers, body } = req;
    
    // Special handling for admin login
    if (url.includes('/auth/login') && body && (body.email || '').includes('admin')) {
      console.log('Admin login detected, ensuring proper request format');
    }
    
    // Forward the request to the backend
    const response = await axios({
      method,
      url: `${BACKEND_URL}${url.replace(/^\/api/, '')}`,
      headers: {
        ...headers,
        host: new URL(BACKEND_URL).host,
        'Content-Type': 'application/json',
      },
      data: body,
      validateStatus: () => true,
    });
    
    // Return the response from the backend
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    // Provide more helpful error message for 405 errors
    if (error.response && error.response.status === 405) {
      return res.status(400).json({ 
        error: 'Login method not supported. Please try again later.',
        details: 'The server does not support this request method for the login endpoint.'
      });
    }
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