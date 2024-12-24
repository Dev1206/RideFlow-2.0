require('dotenv').config({ path: './.env' });
console.log('Environment Variables Check:');
console.log('PORT:', process.env.PORT);
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set (hidden for security)' : 'Not set');

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const rideRoutes = require('./routes/rideRoutes');
const jwt = require('jsonwebtoken');

const app = express();

// Add this near the top of your server.js file
const requiredEnvVars = ['EMAIL_USER', 'EMAIL_APP_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  console.error('Email notifications will not work without these variables');
}

// Replace the corsOptions object with this simpler version
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://ride-flow-sooty.vercel.app',
    'https://ride-flow-ebon.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Add this immediately after cors middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Move this BEFORE routes but AFTER express and cors initialization
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  next();
});

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add this before your other routes
app.use('/api/*', (req, res, next) => {
  console.log('API Request:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body,
    query: req.query
  });
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/rides', rideRoutes);

// Add a test route at the root level
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Add this after your routes but before error handling
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API test endpoint',
    environment: process.env.NODE_ENV,
    clientUrl: process.env.CLIENT_URL
  });
});

// Add this after your test route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    cors: {
      origin: corsOptions.origin.toString(),
      methods: corsOptions.methods,
    }
  });
});

// Add this before your other routes
app.get('/api/test-auth', (req, res) => {
  const authHeader = req.headers.authorization;
  res.json({
    message: 'Auth test endpoint',
    authHeader: authHeader ? 'Present' : 'Missing',
    timestamp: new Date().toISOString()
  });
});

// Add this with your other test routes
app.get('/api/verify-token', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.json({
      status: 'error',
      message: 'No token provided',
      headers: req.headers
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      status: 'success',
      message: 'Token is valid',
      decoded
    });
  } catch (error) {
    res.json({
      status: 'error',
      message: 'Invalid token',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    headers: req.headers
  });

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    path: req.path
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    status: 'error',
    message: 'Route not found',
    path: req.path 
  });
});

// Update the MongoDB connection handling
connectDB().then(() => {
  console.log('MongoDB connection established');
  
  // Only start the server after successful DB connection
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Client URL: ${process.env.CLIENT_URL}`);
    console.log(`MongoDB URI: ${process.env.MONGODB_URI.split('@')[1]}`); // Log URI without credentials
  });
}).catch(err => {
  console.error('MongoDB connection error:',{
    message: err.message,
    code: err.code,
    name: err.name,
    stack: err.stack
  });
  process.exit(1);
});
