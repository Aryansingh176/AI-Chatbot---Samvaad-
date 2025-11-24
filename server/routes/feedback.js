const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
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

// Generate unique feedback ID
const generateFeedbackId = () => {
  return `FEEDBACK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// POST /api/feedback - Create new feedback
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      sessionId,
      rating,
      thumbs,
      comment,
      chatContext
    } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const feedback = new Feedback({
      feedbackId: generateFeedbackId(),
      sessionId,
      rating,
      thumbs,
      comment,
      userEmail: req.user.email,
      userName: req.user.name,
      chatContext
    });

    await feedback.save();
    
    console.log(`[Feedback] Created feedback ${feedback.feedbackId} by ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      feedback: {
        id: feedback.feedbackId,
        rating: feedback.rating,
        createdAt: feedback.createdAt
      }
    });
  } catch (error) {
    console.error('[Feedback] Error creating feedback:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// GET /api/feedback - Get all feedback for logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const feedback = await Feedback.find({ userEmail: req.user.email })
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({ feedback });
  } catch (error) {
    console.error('[Feedback] Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// GET /api/feedback/stats - Get feedback statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const daysBack = parseInt(req.query.days) || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Get all feedback within date range
    const feedback = await Feedback.find({
      createdAt: { $gte: cutoffDate }
    });

    // Calculate statistics
    const totalFeedback = feedback.length;
    const averageRating = totalFeedback > 0
      ? feedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
      : 0;
    
    const thumbsUpCount = feedback.filter(f => f.thumbs === 'up').length;
    const thumbsDownCount = feedback.filter(f => f.thumbs === 'down').length;

    // Rating distribution
    const ratingDistribution = {
      1: feedback.filter(f => f.rating === 1).length,
      2: feedback.filter(f => f.rating === 2).length,
      3: feedback.filter(f => f.rating === 3).length,
      4: feedback.filter(f => f.rating === 4).length,
      5: feedback.filter(f => f.rating === 5).length,
    };

    // Trend data - last 7 days
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayFeedback = feedback.filter(f => 
        f.createdAt >= dayStart && f.createdAt <= dayEnd
      );
      
      const dayAverage = dayFeedback.length > 0
        ? dayFeedback.reduce((sum, f) => sum + f.rating, 0) / dayFeedback.length
        : 0;
      
      trendData.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        averageRating: Math.round(dayAverage * 10) / 10,
        count: dayFeedback.length,
      });
    }

    // Recent feedback
    const recentFeedback = feedback
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
      .map(f => ({
        id: f.feedbackId,
        rating: f.rating,
        thumbs: f.thumbs,
        comment: f.comment,
        timestamp: f.createdAt
      }));

    res.json({
      totalFeedback,
      averageRating: Math.round(averageRating * 10) / 10,
      thumbsUpCount,
      thumbsDownCount,
      ratingDistribution,
      trendData,
      recentFeedback
    });
  } catch (error) {
    console.error('[Feedback] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/feedback/all - Admin endpoint to get all feedback
router.get('/all', verifyToken, async (req, res) => {
  try {
    // Optional: Add admin check here
    const feedback = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(1000);
    
    res.json({ feedback });
  } catch (error) {
    console.error('[Feedback] Error fetching all feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// DELETE /api/feedback/:id - Delete feedback (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await Feedback.findOneAndDelete({ feedbackId: id });
    
    console.log(`[Feedback] Deleted feedback ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('[Feedback] Error deleting feedback:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

module.exports = router;
