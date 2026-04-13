const express = require('express');
const router = express.Router();
const {
  createQuery,
  getMyQueries,
  getAllQueries,
  getQuery,
  respondToQuery,
  updateQueryStatus
} = require('../controllers/queryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// User queries
router.post('/', protect, createQuery);
router.get('/my-queries', protect, getMyQueries);
router.get('/:id', protect, getQuery);

// Admin queries
router.get('/', protect, authorize('admin'), getAllQueries);
router.put('/:id/respond', protect, authorize('admin'), respondToQuery);
router.patch('/:id/status', protect, authorize('admin'), updateQueryStatus);

module.exports = router;
