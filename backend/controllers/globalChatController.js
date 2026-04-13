const GlobalMessage = require('../models/GlobalMessage');

const shouldTriggerAI = (text) => {
  if (!text) return false;
  const normalized = text.trim().toLowerCase();
  return normalized.includes('summarize this task')
    || normalized === 'help'
    || normalized.includes('what is dtms');
};

const normalizeGlobalMessage = (message) => ({
  _id: message._id,
  senderId: message.senderId?._id || null,
  senderName: message.senderName || message.senderId?.name || 'Unknown',
  text: message.text,
  isAI: Boolean(message.isAI),
  createdAt: message.createdAt,
  updatedAt: message.updatedAt
});

const getGlobalChatMessages = async (req, res) => {
  try {
    const messages = await GlobalMessage.find()
      .sort({ createdAt: 1 })
      .populate('senderId', 'name');

    res.json(messages.map(normalizeGlobalMessage));
  } catch (error) {
    console.error('Get global chat messages error:', error);
    res.status(500).json({ message: error.message || 'Failed to load global chat messages' });
  }
};

const generateAIResponse = async (userText) => {
  const openai = await createOpenAIClient();
  const prompt = `You are an AI assistant for DTMS, a task management system. Answer the user clearly and concisely.

User request: ${userText}

If the user asks for help, explain how DTMS works and how to use it. If the user asks to summarize a task, provide a general task management tip.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant for a task management application.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 220,
    temperature: 0.7
  });

  return completion.choices?.[0]?.message?.content?.trim();
};

const sendGlobalChatMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const trimmedText = text.trim();
    if (trimmedText.length > 1000) {
      return res.status(400).json({ message: 'Message is too long (max 1000 characters)' });
    }

    const createdMessage = await GlobalMessage.create({
      senderId: req.user._id,
      senderName: req.user.name,
      text: trimmedText,
      isAI: false
    });

    const normalizedMessage = normalizeGlobalMessage(
      await GlobalMessage.findById(createdMessage._id).populate('senderId', 'name')
    );

    const io = req.app.get('io');
    io?.to('global-chat').emit('newGlobalMessage', normalizedMessage);

    res.status(201).json({ message: normalizedMessage });
  } catch (error) {
    console.error('Send global chat message error:', error);
    res.status(500).json({ message: error.message || 'Failed to send global chat message' });
  }
};

module.exports = { getGlobalChatMessages, sendGlobalChatMessage };
