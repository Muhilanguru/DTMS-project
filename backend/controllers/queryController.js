const Query = require('../models/Query');

const normalizeQuery = (query) => ({
  _id: query._id,
  userId: query.userId?._id || query.userId,
  userName: query.userId?.name || 'Unknown',
  userEmail: query.userId?.email || 'Unknown',
  title: query.title,
  description: query.description,
  status: query.status,
  response: query.response,
  aiSuggestion: query.aiSuggestion,
  createdAt: query.createdAt,
  updatedAt: query.updatedAt
});

// Create a new query
const createQuery = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Query title is required' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Query description is required' });
    }

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (trimmedTitle.length > 200) {
      return res.status(400).json({ message: 'Title cannot exceed 200 characters' });
    }

    if (trimmedDesc.length > 2000) {
      return res.status(400).json({ message: 'Description cannot exceed 2000 characters' });
    }

    const query = await Query.create({
      userId: req.user._id,
      title: trimmedTitle,
      description: trimmedDesc
    });

    const populatedQuery = await Query.findById(query._id).populate('userId', 'name email');
    
    res.status(201).json(normalizeQuery(populatedQuery));
  } catch (error) {
    console.error('Create query error:', error);
    res.status(500).json({ message: error.message || 'Failed to create query' });
  }
};

// Get user's own queries
const getMyQueries = async (req, res) => {
  try {
    const queries = await Query.find({ userId: req.user._id })
      .populate('userId', 'name email')
      .populate('response.respondedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(queries.map(normalizeQuery));
  } catch (error) {
    console.error('Get my queries error:', error);
    res.status(500).json({ message: error.message || 'Failed to load queries' });
  }
};

// Get all queries (admin only)
const getAllQueries = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && ['open', 'in-progress', 'resolved'].includes(status)) {
      filter.status = status;
    }

    const queries = await Query.find(filter)
      .populate('userId', 'name email')
      .populate('response.respondedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(queries.map(normalizeQuery));
  } catch (error) {
    console.error('Get all queries error:', error);
    res.status(500).json({ message: error.message || 'Failed to load queries' });
  }
};

// Get single query
const getQuery = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('response.respondedBy', 'name');

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    // Check authorization: user can see own query, admin can see all
    if (req.user.role === 'user' && query.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this query' });
    }

    res.json(normalizeQuery(query));
  } catch (error) {
    console.error('Get query error:', error);
    res.status(500).json({ message: error.message || 'Failed to load query' });
  }
};

// Admin responds to query
const respondToQuery = async (req, res) => {
  try {
    const { response } = req.body;

    if (!response || !response.trim()) {
      return res.status(400).json({ message: 'Response cannot be empty' });
    }

    if (response.trim().length > 2000) {
      return res.status(400).json({ message: 'Response cannot exceed 2000 characters' });
    }

    const query = await Query.findById(req.params.id);

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    query.response = {
      text: response.trim(),
      isAI: false,
      respondedBy: req.user._id,
      respondedAt: new Date()
    };

    await query.save();

    const updatedQuery = await Query.findById(query._id)
      .populate('userId', 'name email')
      .populate('response.respondedBy', 'name');

    res.json(normalizeQuery(updatedQuery));
  } catch (error) {
    console.error('Respond to query error:', error);
    res.status(500).json({ message: error.message || 'Failed to respond to query' });
  }
};

// Update query status
const updateQueryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['open', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const query = await Query.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'name email')
      .populate('response.respondedBy', 'name');

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    res.json(normalizeQuery(query));
  } catch (error) {
    console.error('Update query status error:', error);
    res.status(500).json({ message: error.message || 'Failed to update query status' });
  }
};

module.exports = {
  createQuery,
  getMyQueries,
  getAllQueries,
  getQuery,
  respondToQuery,
  updateQueryStatus
};
