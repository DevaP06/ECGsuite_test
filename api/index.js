import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB connected successfully');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Initialize DB connection
connectDB();

// Import auth controller functions
import { registerUser, loginUser, logoutUser, googleAuth } from './controllers/authController.js';

// Test routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasMongoUri: !!process.env.MONGO_URI
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is healthy' });
});

// Authentication routes
app.post('/auth/register', registerUser);
app.post('/auth/login', loginUser);
app.post('/auth/logout', logoutUser);
app.post('/auth/google', googleAuth);

// Export for Vercel
export default app;