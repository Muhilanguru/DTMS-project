import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import StatsCard from '../components/StatsCard';
import TaskCard from '../components/TaskCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitModal, setSubmitModal] = useState(null);
  const [submitContent, setSubmitContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await API.get('/tasks');
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await API.patch(`/tasks/${taskId}/status`, { status });
      fetchTasks();
    } catch (err) {
      console.error('Failed to update status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submitModal) return;
    setSubmitting(true);
    try {
      await API.post('/submissions', { taskId: submitModal._id, content: submitContent });
      setSubmitModal(null);
      setSubmitContent('');
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const totalTasks = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length;

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {user?.name} 👋</h1>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatsCard icon="📋" label="Total Tasks" value={totalTasks} variant="primary" />
        <StatsCard icon="✅" label="Completed" value={completed} subtext={totalTasks > 0 ? `${Math.round((completed/totalTasks)*100)}% done` : '0%'} variant="success" />
        <StatsCard icon="⏳" label="In Progress" value={inProgress} variant="info" />
        <StatsCard icon="⏱" label="Pending" value={pending} variant="warning" />
        {overdue > 0 && (
          <StatsCard icon="🚨" label="Overdue" value={overdue} subtext="Need attention!" variant="danger" />
        )}
      </div>

      {/* Completion Progress */}
      {totalTasks > 0 && (
        <div className="card" style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600 }}>Overall Progress</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {completed}/{totalTasks} completed
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill success" style={{ width: `${(completed/totalTasks)*100}%` }}></div>
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {user?.role === 'admin' ? 'All Tasks' : 'My Tasks'}
        </h2>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No tasks yet</h3>
          <p>{user?.role === 'admin' ? 'Create your first task from the Admin Panel.' : 'No tasks have been assigned to you yet.'}</p>
        </div>
      ) : (
        <div className="tasks-grid">
          {tasks.slice(0, 6).map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onStatusChange={handleStatusChange}
              onSubmit={(t) => setSubmitModal(t)}
              onTaskUpdate={handleTaskUpdate}
            />
          ))}
        </div>
      )}

      {/* Submit Modal */}
      {submitModal && (
        <div className="modal-overlay" onClick={() => setSubmitModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit Work</h2>
              <button className="modal-close" onClick={() => setSubmitModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Submitting work for: <strong style={{ color: 'var(--text-primary)' }}>{submitModal.title}</strong>
                </p>
                <div className="form-group">
                  <label htmlFor="submit-content">Your Submission</label>
                  <textarea
                    id="submit-content"
                    className="form-input"
                    placeholder="Describe your completed work, provide links, or notes..."
                    value={submitContent}
                    onChange={(e) => setSubmitContent(e.target.value)}
                    required
                    style={{ minHeight: '150px' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSubmitModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : '📤 Submit Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
