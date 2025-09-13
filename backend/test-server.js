import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test server working!', timestamp: new Date().toISOString() });
});

app.get('/api/auth/test', (req, res) => {
  res.json({ message: 'Auth test working!', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

export default app;


