const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

/**
 * Socket.IO connection handler
 * Each socket represents a unique client connection (device/tab)
 * Multiple users can connect simultaneously with independent sockets
 */
io.on('connection', (socket) => {
  console.log(`📡 Socket connected: ${socket.id}`);

  // Task-specific room handlers
  socket.on('joinTask', (taskId) => {
    if (taskId) {
      socket.join(taskId);
      console.log(`✅ User joined task room: ${taskId}`);
    }
  });

  socket.on('leaveTask', (taskId) => {
    if (taskId) {
      socket.leave(taskId);
      console.log(`❌ User left task room: ${taskId}`);
    }
  });

  socket.on('typing', ({ taskId, userName }) => {
    if (taskId) {
      socket.to(taskId).emit('typing', { userName });
    }
  });

  socket.on('stopTyping', ({ taskId }) => {
    if (taskId) {
      socket.to(taskId).emit('stopTyping');
    }
  });

  // Global chat room handlers
  socket.on('joinGlobalChat', () => {
    socket.join('global-chat');
    console.log(`✅ User joined global chat room`);
  });

  socket.on('leaveGlobalChat', () => {
    socket.leave('global-chat');
    console.log(`❌ User left global chat room`);
  });

  socket.on('typingGlobal', ({ userName }) => {
    socket.to('global-chat').emit('typingGlobal', { userName });
  });

  socket.on('stopTypingGlobal', () => {
    socket.to('global-chat').emit('stopTypingGlobal');
  });

  // Connection close handler
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`⚠️ Socket error on ${socket.id}:`, error);
  });
});

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://dtms-project.vercel.app"
  ],
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded files)
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/global-chat', require('./routes/globalChatRoutes'));
app.use('/api/queries', require('./routes/queryRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send("DTMS Backend is Live 🚀");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 DTMS Backend running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
