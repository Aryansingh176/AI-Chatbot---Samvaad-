const mongoose = require('mongoose');

const agentSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: String,
  status: {
    type: String,
    enum: ['waiting', 'active', 'resolved'],
    default: 'waiting'
  },
  messages: [{
    id: String,
    text: String,
    sender: {
      type: String,
      enum: ['user', 'agent']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  failedAttempts: {
    type: Number,
    default: 0
  },
  assignedAgent: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
agentSessionSchema.index({ userEmail: 1, status: 1 });
agentSessionSchema.index({ status: 1, createdAt: -1 });

// Update the updatedAt on save
agentSessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AgentSession', agentSessionSchema);
