const express = require('express');
const router = express.Router();
const AgentSession = require('../models/AgentSession');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Generate unique session ID
const generateSessionId = () => {
  return `SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// POST /api/agent-sessions - Create new agent session
router.post('/', verifyToken, async (req, res) => {
  try {
    const { messages, failedAttempts } = req.body;

    const session = new AgentSession({
      sessionId: generateSessionId(),
      userEmail: req.user.email,
      userName: req.user.name,
      status: 'waiting',
      messages: messages || [],
      failedAttempts: failedAttempts || 0
    });

    await session.save();
    
    console.log(`[Agent Session] Created session ${session.sessionId} for ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      session: {
        id: session.sessionId,
        status: session.status,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('[Agent Session] Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// GET /api/agent-sessions - Get all sessions for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const sessions = await AgentSession.find({ userEmail: req.user.email })
      .sort({ createdAt: -1 });
    
    res.json({ sessions });
  } catch (error) {
    console.error('[Agent Session] Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/agent-sessions/:id - Get specific session
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const session = await AgentSession.findOne({ sessionId: req.params.id });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ session });
  } catch (error) {
    console.error('[Agent Session] Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// PUT /api/agent-sessions/:id/status - Update session status
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['waiting', 'active', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const session = await AgentSession.findOneAndUpdate(
      { sessionId: req.params.id },
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log(`[Agent Session] Updated ${req.params.id} status to ${status}`);
    res.json({ success: true, session });
  } catch (error) {
    console.error('[Agent Session] Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/agent-sessions/:id/messages - Add message to session
router.post('/:id/messages', verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || !message.text) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const session = await AgentSession.findOne({ sessionId: req.params.id });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const newMessage = {
      id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: message.text,
      sender: message.sender || 'user',
      timestamp: new Date()
    };

    session.messages.push(newMessage);
    session.updatedAt = Date.now();
    await session.save();

    console.log(`[Agent Session] Added message to ${req.params.id}`);
    res.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('[Agent Session] Error adding message:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// GET /api/agent-sessions/admin/all - Get all sessions (admin)
router.get('/admin/all', verifyToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = status ? { status } : {};
    const sessions = await AgentSession.find(query)
      .sort({ createdAt: -1 })
      .limit(500);
    
    res.json({ sessions });
  } catch (error) {
    console.error('[Agent Session] Error fetching all sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/agent-sessions/admin/stats - Get session statistics (admin)
router.get('/admin/stats', verifyToken, async (req, res) => {
  try {
    const [waiting, active, resolved, total] = await Promise.all([
      AgentSession.countDocuments({ status: 'waiting' }),
      AgentSession.countDocuments({ status: 'active' }),
      AgentSession.countDocuments({ status: 'resolved' }),
      AgentSession.countDocuments()
    ]);

    res.json({
      waiting,
      active,
      resolved,
      total
    });
  } catch (error) {
    console.error('[Agent Session] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// PUT /api/agent-sessions/:id/assign - Assign agent to session
router.put('/:id/assign', verifyToken, async (req, res) => {
  try {
    const { agentName } = req.body;

    const session = await AgentSession.findOneAndUpdate(
      { sessionId: req.params.id },
      { 
        assignedAgent: agentName,
        status: 'active',
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log(`[Agent Session] Assigned ${agentName} to ${req.params.id}`);
    res.json({ success: true, session });
  } catch (error) {
    console.error('[Agent Session] Error assigning agent:', error);
    res.status(500).json({ error: 'Failed to assign agent' });
  }
});

module.exports = router;
