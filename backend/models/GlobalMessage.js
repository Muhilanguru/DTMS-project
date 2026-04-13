const mongoose = require('mongoose');

const globalMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  senderName: {
    type: String,
    required: [true, 'Sender name is required'],
    trim: true,
    maxlength: [100, 'Sender name cannot exceed 100 characters']
  },
  text: {
    type: String,
    required: [true, 'Message text is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  isAI: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

globalMessageSchema.index({ createdAt: 1 });

module.exports = mongoose.model('GlobalMessage', globalMessageSchema);
