const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  feedbackId: {
    type: String,
    required: true,
    unique: true
  },
  sessionId: String,
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  thumbs: {
    type: String,
    enum: ['up', 'down', null],
    default: null
  },
  comment: String,
  userEmail: String,
  userName: String,
  chatContext: {
    messageCount: Number,
    topics: [String],
    duration: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
feedbackSchema.index({ userEmail: 1, createdAt: -1 });
feedbackSchema.index({ rating: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
