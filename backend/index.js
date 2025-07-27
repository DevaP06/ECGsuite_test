// index.js (ESM version)
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './src/routes/authRoutes.js';
import cors from 'cors';
app.use(cors());


dotenv.config(); // Load .env variables

const app = express();

// Middleware
app.use(express.json());
app.use('/api/auth', authRoutes);

// Environment variables
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp';

// Connect to MongoDB
console.log('📡 Attempting to connect to MongoDB...');

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });
