const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, deleteTask, updateTaskStatus } = require('../controllers/taskController');
const { getTaskComments, addTaskComment } = require('../controllers/commentController');
const { getTaskMessages, sendTaskMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, getTasks)
  .post(protect, authorize('admin'), createTask);

router.route('/:id')
  .get(protect, getTask)
  .put(protect, authorize('admin'), updateTask)
  .delete(protect, authorize('admin'), deleteTask);

router.patch('/:id/status', protect, updateTaskStatus);

router.route('/:id/messages')
  .get(protect, getTaskMessages)
  .post(protect, sendTaskMessage);

router.route('/:id/comments')
  .get(protect, getTaskComments)
  .post(protect, addTaskComment);

// Backward compatibility: allow singular /comment path too
router.route('/:id/comment')
  .get(protect, getTaskComments)
  .post(protect, addTaskComment);

module.exports = router;

