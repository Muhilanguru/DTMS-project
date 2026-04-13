const express = require('express');
const router = express.Router();
const { createSubmission, getSubmissions, reviewSubmission } = require('../controllers/submissionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(protect, getSubmissions)
  .post(protect, authorize('user'), upload.array('files', 5), createSubmission);

router.patch('/:id/review', protect, authorize('admin'), reviewSubmission);

module.exports = router;
