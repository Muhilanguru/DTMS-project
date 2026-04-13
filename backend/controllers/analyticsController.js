const Task = require('../models/Task');
const User = require('../models/User');
const Submission = require('../models/Submission');

// @desc    Get overview analytics
// @route   GET /api/analytics/overview
// @access  Private/Admin
const getOverview = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });

    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalSubmissions = await Submission.countDocuments();
    const approvedSubmissions = await Submission.countDocuments({ status: 'approved' });

    // Tasks by priority
    const highPriority = await Task.countDocuments({ priority: 'high' });
    const mediumPriority = await Task.countDocuments({ priority: 'medium' });
    const lowPriority = await Task.countDocuments({ priority: 'low' });

    // Overdue tasks
    const overdueTasks = await Task.countDocuments({
      deadline: { $lt: new Date() },
      status: { $ne: 'completed' }
    });

    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    res.json({
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        overdue: overdueTasks,
        completionRate
      },
      users: {
        total: totalUsers
      },
      submissions: {
        total: totalSubmissions,
        approved: approvedSubmissions
      },
      priority: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get per-user performance
// @route   GET /api/analytics/user-performance
// @access  Private/Admin
const getUserPerformance = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('name email');

    const performance = await Promise.all(
      users.map(async (user) => {
        const totalTasks = await Task.countDocuments({ assignedTo: user._id });
        const completedTasks = await Task.countDocuments({ assignedTo: user._id, status: 'completed' });
        const pendingTasks = await Task.countDocuments({ assignedTo: user._id, status: 'pending' });
        const inProgressTasks = await Task.countDocuments({ assignedTo: user._id, status: 'in-progress' });
        const submissions = await Submission.countDocuments({ user: user._id });

        return {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email
          },
          totalTasks,
          completedTasks,
          pendingTasks,
          inProgressTasks,
          submissions,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        };
      })
    );

    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get leaderboard ranking
// @route   GET /api/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('name');

    const completedCounts = await Task.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$assignedTo', completedTasks: { $sum: 1 } } }
    ]);

    const completedMap = new Map(completedCounts.map((item) => [item._id.toString(), item.completedTasks]));

    const leaderboard = users
      .map((user) => ({
        userId: user._id,
        name: user.name,
        completedTasks: completedMap.get(user._id.toString()) || 0
      }))
      .sort((a, b) => b.completedTasks - a.completedTasks || a.name.localeCompare(b.name))
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getOverview, getUserPerformance, getLeaderboard };
