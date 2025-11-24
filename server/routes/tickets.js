const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
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

// Generate unique ticket number
const generateTicketNumber = async () => {
  const count = await SupportTicket.countDocuments();
  return `TKT-${(count + 1).toString().padStart(4, '0')}`;
};

// POST /api/tickets - Create new support ticket
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      issueType,
      description,
      priority,
      imageUrl
    } = req.body;

    // Validation
    if (!issueType || !description) {
      return res.status(400).json({ error: 'Issue type and description are required' });
    }

    const ticketNumber = await generateTicketNumber();

    const ticket = new SupportTicket({
      ticketNumber,
      issueType,
      description,
      email: req.user.email,
      priority: priority || 'medium',
      imageUrl,
      userId: req.user.email,
      userName: req.user.name,
      status: 'open'
    });

    await ticket.save();
    
    console.log(`[Tickets] Created ticket ${ticket.ticketNumber} by ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        createdAt: ticket.createdAt
      }
    });
  } catch (error) {
    console.error('[Tickets] Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// GET /api/tickets - Get all tickets for logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = { email: req.user.email };
    if (status) {
      query.status = status;
    }

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 });
    
    res.json({ tickets });
  } catch (error) {
    console.error('[Tickets] Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET /api/tickets/:ticketNumber - Get specific ticket
router.get('/:ticketNumber', verifyToken, async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ 
      ticketNumber: req.params.ticketNumber 
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if user owns this ticket
    if (ticket.email !== req.user.email) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ ticket });
  } catch (error) {
    console.error('[Tickets] Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// PUT /api/tickets/:ticketNumber/status - Update ticket status
router.put('/:ticketNumber/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const ticket = await SupportTicket.findOneAndUpdate(
      { ticketNumber: req.params.ticketNumber },
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    console.log(`[Tickets] Updated ${req.params.ticketNumber} status to ${status}`);
    res.json({ success: true, ticket });
  } catch (error) {
    console.error('[Tickets] Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/tickets/:ticketNumber/responses - Add response to ticket
router.post('/:ticketNumber/responses', verifyToken, async (req, res) => {
  try {
    const { message, isStaff } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ticket = await SupportTicket.findOne({ 
      ticketNumber: req.params.ticketNumber 
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const newResponse = {
      id: `RESP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      isStaff: isStaff || false,
      author: isStaff ? 'Support Team' : req.user.name,
      createdAt: new Date()
    };

    ticket.responses.push(newResponse);
    ticket.updatedAt = Date.now();
    await ticket.save();

    console.log(`[Tickets] Added response to ${req.params.ticketNumber}`);
    res.json({ success: true, response: newResponse });
  } catch (error) {
    console.error('[Tickets] Error adding response:', error);
    res.status(500).json({ error: 'Failed to add response' });
  }
});

// GET /api/tickets/admin/all - Get all tickets (admin)
router.get('/admin/all', verifyToken, async (req, res) => {
  try {
    const { status, priority } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .limit(1000);
    
    res.json({ tickets });
  } catch (error) {
    console.error('[Tickets] Error fetching all tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET /api/tickets/admin/stats - Get ticket statistics (admin)
router.get('/admin/stats', verifyToken, async (req, res) => {
  try {
    const { email } = req.query;

    const query = email ? { email } : {};

    const [open, inProgress, resolved, closed, total] = await Promise.all([
      SupportTicket.countDocuments({ ...query, status: 'open' }),
      SupportTicket.countDocuments({ ...query, status: 'in-progress' }),
      SupportTicket.countDocuments({ ...query, status: 'resolved' }),
      SupportTicket.countDocuments({ ...query, status: 'closed' }),
      SupportTicket.countDocuments(query)
    ]);

    res.json({
      open,
      inProgress,
      resolved,
      closed,
      total
    });
  } catch (error) {
    console.error('[Tickets] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// DELETE /api/tickets/:ticketNumber - Delete ticket (admin only)
router.delete('/:ticketNumber', verifyToken, async (req, res) => {
  try {
    await SupportTicket.findOneAndDelete({ 
      ticketNumber: req.params.ticketNumber 
    });
    
    console.log(`[Tickets] Deleted ticket ${req.params.ticketNumber}`);
    res.json({ success: true });
  } catch (error) {
    console.error('[Tickets] Error deleting ticket:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

module.exports = router;
