import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const socketBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const TaskCard = ({ task, onStatusChange, onDelete, onSubmit, onTaskUpdate }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No deadline';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDeadlineStatus = () => {
    if (!task.deadline || task.status === 'completed') return null;

    const deadline = new Date(task.deadline);
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'overdue', text: `${Math.abs(diffDays)} days overdue`, color: 'var(--danger-400)' };
    } else if (diffDays === 0) {
      return { status: 'due-today', text: 'Due today', color: 'var(--danger-500)' };
    } else if (diffDays <= 2) {
      return { status: 'due-soon', text: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: 'var(--warning-400)' };
    } else {
      return { status: 'upcoming', text: `Due in ${diffDays} days`, color: 'var(--text-muted)' };
    }
  };

  const deadlineStatus = getDeadlineStatus();

  const fetchMessages = async () => {
    try {
      setMessagesLoading(true);
      const { data } = await API.get(`/tasks/${task._id}/messages`);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const scrollMessagesToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();

    const socket = io(socketBaseUrl, {
      autoConnect: false,
      transports: ['websocket'],
      withCredentials: true
    });

    socketRef.current = socket;
    socket.connect();
    socket.emit('joinTask', task._id);

    socket.on('newMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('typing', ({ userName }) => {
      if (userName && userName !== user?.name) {
        setTypingUser(userName);
      }
    });

    socket.on('stopTyping', () => {
      setTypingUser('');
    });

    return () => {
      socket.emit('leaveTask', task._id);
      socket.disconnect();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [task._id, user?.name, onTaskUpdate]);

  useEffect(() => {
    if (!messagesLoading) {
      scrollMessagesToBottom();
    }
  }, [messagesLoading, messages.length]);

  const sendTypingEvent = () => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('typing', { taskId: task._id, userName: user?.name });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stopTyping', { taskId: task._id });
    }, 1000);
  };

  const handleMessageChange = (e) => {
    setMessageText(e.target.value);
    sendTypingEvent();
  };

  const handleSendMessage = async () => {
    const trimmed = messageText.trim();
    if (!trimmed) {
      setMessageError('Message cannot be empty');
      return;
    }

    if (trimmed.length > 1000) {
      setMessageError('Message is too long (max 1000 characters)');
      return;
    }

    setMessageSending(true);
    setMessageError('');

    try {
      await API.post(`/tasks/${task._id}/messages`, { text: trimmed });
      setMessageText('');
      socketRef.current?.emit('stopTyping', { taskId: task._id });
    } catch (err) {
      setMessageError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setMessageSending(false);
    }
  };

  return (
    <div className={`task-card animate-in ${deadlineStatus?.status === 'overdue' ? 'task-overdue' : deadlineStatus?.status === 'due-soon' ? 'task-due-soon' : ''}`}>
      <div className="task-card-header">
        <h3 className="task-card-title">{task.title}</h3>
        <span className={`badge badge-${task.status}`}>
          {task.status === 'in-progress' ? '⏳ In Progress' : task.status === 'completed' ? '✅ Completed' : '⏱ Pending'}
        </span>
      </div>

      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}

      <div className="task-card-meta">
        <span className={`badge badge-${task.priority}`}>
          {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} {task.priority}
        </span>
        {task.deadline && (
          <span style={{ fontSize: '12px', color: deadlineStatus?.color || 'var(--text-muted)' }}>
            📅 {deadlineStatus ? deadlineStatus.text : formatDate(task.deadline)}
          </span>
        )}
        {task.assignedTo && (
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            👤 {task.assignedTo.name || task.assignedTo.email}
          </span>
        )}
      </div>

      <div className="task-chat-panel">
        <div className="task-chat-header">
          <span>💬 Task Chat</span>
          <span className="comment-count">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="task-chat-list">
          {messagesLoading ? (
            <div className="comment-loading">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="comment-empty">No messages yet. Start the chat.</div>
          ) : (
            messages.map((message) => {
              const isOwn = String(message.senderId) === String(user?._id);
              const isAI = message.senderName === 'AI Assistant';
              return (
                <div
                  key={message._id}
                  className={`chat-message ${isAI ? 'chat-message-ai' : isOwn ? 'chat-message-right' : 'chat-message-left'}`}
                >
                  <div className="chat-message-meta">
                    <span className="chat-message-sender">{message.senderName}</span>
                    <span className="chat-message-time">{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="chat-message-text">{message.text}</div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {typingUser && (
          <div className="chat-typing">{typingUser} is typing...</div>
        )}

        <div className="task-chat-input-row">
          <textarea
            value={messageText}
            onChange={handleMessageChange}
            placeholder={user ? 'Type a message...' : 'Login to send a message'}
            disabled={!user}
            className="task-chat-input"
          />
          <button
            className="btn btn-sm btn-primary"
            onClick={handleSendMessage}
            disabled={!user || messageSending}
          >
            {messageSending ? 'Sending...' : 'Send'}
          </button>
        </div>
        {messageError && <div className="alert alert-error" style={{ marginTop: '10px' }}>{messageError}</div>}
      </div>

      <div className="task-card-footer">
        <div className="task-card-actions">
          {/* Status change buttons for assigned users */}
          {user?.role === 'user' && task.status !== 'completed' && (
            <>
              {task.status === 'pending' && (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => onStatusChange(task._id, 'in-progress')}
                >
                  ▶ Start
                </button>
              )}
              {task.status === 'in-progress' && onSubmit && (
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => onSubmit(task)}
                >
                  📤 Submit
                </button>
              )}
            </>
          )}

          {/* Admin actions */}
          {user?.role === 'admin' && onDelete && (
            <button
              className="btn btn-sm btn-danger"
              onClick={() => onDelete(task._id)}
            >
              🗑 Delete
            </button>
          )}
        </div>

        {task.status === 'completed' && !task.description && (
          <span style={{ fontSize: '12px', color: 'var(--success-400)' }}>✓ Task completed</span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
