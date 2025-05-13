const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: String,
  sender: String,
  timestamp: { type: Date, default: Date.now }
});

const sessionSchema = new mongoose.Schema({
  startTime: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  messages: [messageSchema]
});

module.exports = sessionSchema;
