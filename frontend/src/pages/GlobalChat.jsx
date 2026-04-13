import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const getSocketServerUrl = () => {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return raw.replace(/\/api\/?$/, '');
};

const GlobalChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [messageError, setMessageError] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingSentRef = useRef(false);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await API.get('/global-chat');
        setMessages(res.data || []);
      } catch (err) {
        console.error('Failed to load global chat', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  useEffect(() => {
    const socket = io(getSocketServerUrl(), { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinGlobalChat');
    });

    socket.on('newGlobalMessage', (message) => {
      setMessages((current) => [...current, message]);
    });

    socket.on('typingGlobal', ({ userName }) => {
      setTypingUser(userName);
    });

    socket.on('stopTypingGlobal', () => {
      setTypingUser('');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection failed:', err);
    });

    return () => {
      socket.emit('leaveGlobalChat');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  const handleMessageChange = (event) => {
    const value = event.target.value;
    setMessageText(value);
    setMessageError('');

    if (!socketRef.current) return;

    if (value.trim()) {
      if (!typingSentRef.current) {
        socketRef.current.emit('typingGlobal', { userName: user?.name || 'Someone' });
        typingSentRef.current = true;
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('stopTypingGlobal');
        typingSentRef.current = false;
      }, 800);
    } else if (typingSentRef.current) {
      socketRef.current.emit('stopTypingGlobal');
      typingSentRef.current = false;
    }
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

    setSending(true);
    setMessageError('');

    try {
      await API.post('/global-chat', { text: trimmed });
      setMessageText('');
      socketRef.current?.emit('stopTypingGlobal');
      typingSentRef.current = false;
    } catch (err) {
      setMessageError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="global-chat-page">
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="task-chat-header" style={{ padding: '20px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-primary)' }}>Global Chat</h2>
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Team-wide chat room with message persistence and AI assistant support.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Logged in as</span>
            <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong>
          </div>
        </div>

        <div className="task-chat-panel" style={{ border: 'none', borderRadius: '0', padding: '24px 20px 16px' }}>
          <div className="task-chat-list global-chat-list">
            {loading ? (
              <div className="comment-loading">Loading global chat...</div>
            ) : messages.length === 0 ? (
              <div className="comment-empty">No messages yet. Say hello to the team.</div>
            ) : (
              messages.map((message) => {
                const isOwn = String(message.senderId) === String(user?._id);
                const isAI = message.isAI;
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

          <div className="task-chat-input-row" style={{ marginTop: '8px' }}>
            <textarea
              value={messageText}
              onChange={handleMessageChange}
              placeholder="Type your message..."
              className="task-chat-input"
              rows={3}
            />
            <button
              className="btn btn-primary"
              onClick={handleSendMessage}
              disabled={sending}
              style={{ minWidth: '120px' }}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>

          {messageError && (
            <div className="alert alert-error" style={{ marginTop: '14px', color: 'var(--danger-400)' }}>
              {messageError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalChat;
