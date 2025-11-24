const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); // Load environment variables FIRST

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const openaiRoutes = require('./routes/openai');
const feedbackRoutes = require('./routes/feedback');
const agentSessionRoutes = require('./routes/agentSessions');
const ticketRoutes = require('./routes/tickets');

const app = express();

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('[CORS] Rejected origin:', origin);
      callback(null, false);
    }
  },
  credentials: true
}));
app.use(express.json());

// Session middleware
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set to true if using https
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Log all requests with detailed info
app.use((req, res, next) => {
  console.log(`[SERVER] ${req.method} ${req.path} (Origin: ${req.headers.origin || 'none'})`);
  next();
});

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('📊 Connected to database:', mongoose.connection.db.databaseName);
  console.log('🔗 Connection URI:', process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
})
.catch((err) => {
  console.error('MongoDB connection error:', err.message);
  console.error('Please whitelist your IP address in MongoDB Atlas:');
  console.error('1. Go to https://cloud.mongodb.com/');
  console.error('2. Select your cluster');
  console.error('3. Click "Network Access" in the left menu');
  console.error('4. Click "Add IP Address"');
  console.error('5. Click "Allow Access from Anywhere" (0.0.0.0/0) for development');
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/openai', openaiRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/agent-sessions', agentSessionRoutes);
app.use('/api/tickets', ticketRoutes);

console.log('✅ All API routes registered successfully');

// Serve static frontend in production (build-and-serve)
if (process.env.NODE_ENV === 'production' || process.env.SERVE_STATIC === 'true') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  app.get('/*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// temporary error handler - for debugging only
app.use((err, req, res, next) => {
  console.error('EXPRESS ERROR:', err && err.stack ? err.stack : err);
  res.status(500).json({ error: err && err.message ? err.message : 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
