const express = require('express');
const router = express.Router();
const { getOverview, getUserPerformance, getLeaderboard } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/overview', protect, authorize('admin'), getOverview);
router.get('/user-performance', protect, authorize('admin'), getUserPerformance);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;
