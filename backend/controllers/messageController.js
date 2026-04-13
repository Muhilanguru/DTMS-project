const Message = require('../models/Message');
const Task = require('../models/Task');

const shouldTriggerAI = (text) => {
  if (!text) return false;
  const normalized = text.trim().toLowerCase();
  return normalized.includes('summarize this task') || normalized.includes('what is this task about?');
};

const normalizeMessage = (message) => ({
  _id: message._id,
  task: message.task,
  senderId: message.senderId?._id || null,
  senderName: message.senderName || message.senderId?.name || 'Unknown',
  text: message.text,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt
});

const getTaskMessages = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.role === 'user' && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this task chat' });
    }

    const messages = await Message.find({ task: req.params.id })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name');

    res.json(messages.map(normalizeMessage));
  } catch (error) {
    console.error('Get task messages error:', error);
    res.status(500).json({ message: error.message || 'Failed to load task messages' });
  }
};

const sendTaskMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const trimmedText = text.trim();
    if (trimmedText.length > 1000) {
      return res.status(400).json({ message: 'Message is too long (max 1000 characters)' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.role === 'user' && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to send messages for this task' });
    }

    const message = await Message.create({
      task: task._id,
      senderId: req.user._id,
      senderName: req.user.name,
      text: trimmedText
    });

    const normalizedMessage = normalizeMessage(await Message.findById(message._id).populate('senderId', 'name'));
    const io = req.app.get('io');
    io?.to(task._id.toString()).emit('newMessage', normalizedMessage);

    res.status(201).json({ message: normalizedMessage });
  } catch (error) {
    console.error('Send task message error:', error);
    res.status(500).json({ message: error.message || 'Failed to send task message' });
  }
};

module.exports = { getTaskMessages, sendTaskMessage };
