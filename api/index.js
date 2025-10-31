// Vercel serverless function for API routes
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();

// Enable CORS with proper configuration
app.use(cors({
  origin: ['https://frontend-bookmytruf.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'Cookie'],
  exposedHeaders: ['Authorization', 'Set-Cookie'],
  credentials: true,
  maxAge: 86400
}));

// Parse JSON bodies
app.use(express.json());

// Use the deployed backend URL
const BACKEND_URL = process.env.BACKEND_URL || 'https://book-by-truf-backend.onrender.com';

// Proxy middleware function
const proxyRequest = async (req, res) => {
  try {
    const { method, url, headers, body } = req;
    
    // Forward the request to the backend with credentials
    const response = await axios({
      method,
      url: `${BACKEND_URL}${url.replace(/^\/api/, '/api')}`,
      headers: {
        ...headers,
        host: new URL(BACKEND_URL).host,
        'Content-Type': 'application/json',
      },
      data: body,
      withCredentials: true,
      validateStatus: () => true,
    });
    
    // Copy all headers from the backend response
    Object.entries(response.headers).forEach(([key, value]) => {
      // Handle cookies specially to ensure they work cross-domain
      if (key.toLowerCase() === 'set-cookie') {
        const cookies = Array.isArray(value) ? value : [value];
        const secureTransformedCookies = cookies.map(cookie => 
          cookie.replace(/SameSite=Lax/gi, 'SameSite=None; Secure')
        );
        res.setHeader('Set-Cookie', secureTransformedCookies);
      } else {
        res.setHeader(key, value);
      }
    });
    
    // Return the response from the backend
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
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