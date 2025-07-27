import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './src/routes/authRoutes.js';

dotenv.config(); // Load .env variables

const app = express();

// Middleware
app.use(express.json());
app.use('/api/auth', authRoutes);

// Env
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// DB connect
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected ✅');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.error('MongoDB connection error ❌:', err));
