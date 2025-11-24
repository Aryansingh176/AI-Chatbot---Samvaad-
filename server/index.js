import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/authESM.js';
import authMiddleware from './middleware/authESM.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Validate required env vars
if (!process.env.MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not set in .env file');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not set in .env file');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5174',
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// MongoDB connection
try {
  await mongoose.connect(process.env.MONGODB_URI, {
    tls: true,
    serverSelectionTimeoutMS: 5000,
  });
  console.log('✅ MongoDB connected successfully');
} catch (err) {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('Please check:');
  console.error('1. MONGODB_URI in .env is correct');
  console.error('2. Your IP is whitelisted in MongoDB Atlas');
  console.error('3. Network connection is stable');
  process.exit(1);
}

// Routes
app.use('/api/auth', authRoutes);

// Protected route example
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const user = await mongoose.model('User').findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      email: user.email,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
});
