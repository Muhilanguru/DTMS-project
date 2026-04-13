import { useState, useEffect } from 'react';
import API from '../api/axios';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminPanel = () => {
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [taskRes, subRes] = await Promise.all([
        API.get('/tasks'),
        API.get('/submissions')
      ]);
      setTasks(taskRes.data);
      setSubmissions(subRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task permanently?')) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      fetchAll();
    } catch (err) {
      console.error('Failed to delete');
    }
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
  };

  const handleReviewSubmission = async (submissionId, status) => {
    try {
      await API.patch(`/submissions/${submissionId}/review`, { status });
      fetchAll();
    } catch (err) {
      console.error('Failed to review submission');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1>⚙️ Admin Panel</h1>
        <button
          className="btn btn-primary"
          onClick={() => { setEditTask(null); setModalOpen(true); }}
          id="create-task-btn"
        >
          ➕ Create Task
        </button>
      </div>

      {/* Tabs */}
      <div className="filters-bar">
        <button
          className={`filter-chip ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          📋 Tasks ({tasks.length})
        </button>
        <button
          className={`filter-chip ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          📤 Submissions ({submissions.length})
        </button>
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <>
          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No tasks created</h3>
              <p>Click "Create Task" to add your first task.</p>
            </div>
          ) : (
            <div className="tasks-grid">
              {tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onDelete={handleDelete}
                  onStatusChange={async (id, status) => {
                    await API.patch(`/tasks/${id}/status`, { status });
                    fetchAll();
                  }}
                  onTaskUpdate={handleTaskUpdate}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <>
          {submissions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📬</div>
              <h3>No submissions yet</h3>
              <p>Submissions from users will appear here for review.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Submitted By</th>
                    <th>Content</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub._id}>
                      <td style={{ fontWeight: 600 }}>{sub.task?.title || 'Deleted'}</td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{sub.user?.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sub.user?.email}</div>
                        </div>
                      </td>
                      <td>
                        <div style={{
                          maxWidth: '250px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '13px',
                          color: 'var(--text-secondary)'
                        }}>
                          {sub.content}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${sub.status}`}>{sub.status}</span>
                      </td>
                      <td>
                        {sub.status === 'submitted' && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleReviewSubmission(sub._id, 'approved')}
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleReviewSubmission(sub._id, 'rejected')}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null); }}
        onSave={fetchAll}
        task={editTask}
      />
    </div>
  );
};

export default AdminPanel;
