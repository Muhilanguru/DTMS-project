const Submission = require('../models/Submission');
const Task = require('../models/Task');

// @desc    Create submission for a task
// @route   POST /api/submissions
// @access  Private/User
const createSubmission = async (req, res) => {
  try {
    const { taskId, content } = req.body;

    // Verify task exists and is assigned to this user
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only submit work for tasks assigned to you' });
    }

    // Check for existing submission
    const existing = await Submission.findOne({ task: taskId, user: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted work for this task' });
    }

    // Handle uploaded files
    const files = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/api/uploads/${file.filename}`
    })) : [];

    const submission = await Submission.create({
      task: taskId,
      user: req.user._id,
      content,
      files
    });

    // Update task status to completed
    task.status = 'completed';
    await task.save();

    const populated = await Submission.findById(submission._id)
      .populate('task', 'title')
      .populate('user', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get submissions (admin gets all, user gets own)
// @route   GET /api/submissions
// @access  Private
const getSubmissions = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'user') {
      query.user = req.user._id;
    }

    const submissions = await Submission.find(query)
      .populate('task', 'title status')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Review submission (approve/reject)
// @route   PATCH /api/submissions/:id/review
// @access  Private/Admin
const reviewSubmission = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected', 'reviewed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid review status' });
    }

    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('task', 'title')
      .populate('user', 'name email');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSubmission, getSubmissions, reviewSubmission };
