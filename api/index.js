import cors from "cors";
import express from 'express';
import mongoose from 'mongoose';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ec-gsuite-test.vercel.app'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Import auth controller directly to avoid path issues
import { registerUser, loginUser, logoutUser, googleAuth } from '../backend/src/controllers/authController.js';

// Routes - Note: /api prefix is handled by Vercel routing
app.post('/auth/register', registerUser);
app.post('/auth/login', loginUser);
app.post('/auth/logout', logoutUser);
app.post('/auth/google', googleAuth);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'ECGenius API is running',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasMongoUri: !!process.env.MONGO_URI
    }
  });
});

// MongoDB connection with connection pooling for serverless
let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set');
  }

  try {
    const connection = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    cachedConnection = connection;
    console.log('MongoDB connected ✅');
    return connection;
  } catch (error) {
    console.error('MongoDB connection error ❌:', error);
    throw error;
  }
}

// Middleware to ensure database connection (only for routes that need it)
const ensureDbConnection = async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
};

// Apply database middleware only to routes that need it
app.use('/auth', ensureDbConnection);

// Export for Vercel
export default app;