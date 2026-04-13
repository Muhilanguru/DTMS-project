import { useState, useEffect } from 'react';
import API from '../api/axios';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [overviewRes, perfRes] = await Promise.all([
        API.get('/analytics/overview'),
        API.get('/analytics/user-performance')
      ]);
      setOverview(overviewRes.data);
      setPerformance(perfRes.data);
    } catch (err) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!overview) return <div className="empty-state"><h3>Failed to load analytics</h3></div>;

  return (
    <div>
      <div className="page-header">
        <h1>📈 Analytics Dashboard</h1>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <StatsCard icon="📋" label="Total Tasks" value={overview.tasks.total} variant="primary" />
        <StatsCard
          icon="✅"
          label="Completed"
          value={overview.tasks.completed}
          subtext={`${overview.tasks.completionRate}% completion rate`}
          variant="success"
        />
        <StatsCard icon="⏳" label="In Progress" value={overview.tasks.inProgress} variant="info" />
        <StatsCard icon="⏱" label="Pending" value={overview.tasks.pending} variant="warning" />
        <StatsCard icon="🚨" label="Overdue" value={overview.tasks.overdue} variant="danger" />
        <StatsCard icon="👥" label="Total Users" value={overview.users.total} variant="primary" />
        <StatsCard icon="📤" label="Submissions" value={overview.submissions.total} variant="info" />
        <StatsCard icon="✓" label="Approved" value={overview.submissions.approved} variant="success" />
      </div>

      {/* Task Status Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div className="chart-card">
          <div className="chart-card-header">
            <span className="chart-card-title">Task Status Distribution</span>
          </div>
          <div className="chart-bar-container">
            {overview.tasks.total > 0 ? (
              <>
                <div className="chart-bar-item">
                  <span className="chart-bar-label">Completed</span>
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill success"
                      style={{ width: `${(overview.tasks.completed / overview.tasks.total) * 100}%` }}
                    >
                      {overview.tasks.completed}
                    </div>
                  </div>
                </div>
                <div className="chart-bar-item">
                  <span className="chart-bar-label">In Progress</span>
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill info"
                      style={{ width: `${(overview.tasks.inProgress / overview.tasks.total) * 100}%` }}
                    >
                      {overview.tasks.inProgress}
                    </div>
                  </div>
                </div>
                <div className="chart-bar-item">
                  <span className="chart-bar-label">Pending</span>
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill warning"
                      style={{ width: `${(overview.tasks.pending / overview.tasks.total) * 100}%` }}
                    >
                      {overview.tasks.pending}
                    </div>
                  </div>
                </div>
                <div className="chart-bar-item">
                  <span className="chart-bar-label">Overdue</span>
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill danger"
                      style={{ width: `${(overview.tasks.overdue / overview.tasks.total) * 100}%` }}
                    >
                      {overview.tasks.overdue}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No tasks data yet</p>
            )}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="chart-card">
          <div className="chart-card-header">
            <span className="chart-card-title">Priority Breakdown</span>
          </div>
          <div className="chart-bar-container">
            {overview.tasks.total > 0 ? (
              <>
                <div className="chart-bar-item">
                  <span className="chart-bar-label">🔴 High</span>
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill danger"
                      style={{ width: `${(overview.priority.high / overview.tasks.total) * 100}%` }}
                    >
                      {overview.priority.high}
                    </div>
                  </div>
                </div>
                <div className="chart-bar-item">
                  <span className="chart-bar-label">🟡 Medium</span>
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill warning"
                      style={{ width: `${(overview.priority.medium / overview.tasks.total) * 100}%` }}
                    >
                      {overview.priority.medium}
                    </div>
                  </div>
                </div>
                <div className="chart-bar-item">
                  <span className="chart-bar-label">🟢 Low</span>
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill success"
                      style={{ width: `${(overview.priority.low / overview.tasks.total) * 100}%` }}
                    >
                      {overview.priority.low}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No priority data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* User Performance */}
      <div className="chart-card">
        <div className="chart-card-header">
          <span className="chart-card-title">👥 User Performance</span>
        </div>

        {performance.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No user data available</p>
        ) : (
          performance.map((perf) => (
            <div className="performance-card" key={perf.user._id}>
              <div className="perf-avatar">
                {perf.user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="perf-info">
                <div className="perf-name">{perf.user.name}</div>
                <div className="perf-email">{perf.user.email}</div>
              </div>
              <div className="perf-stats">
                <div className="perf-stat">
                  <div className="perf-stat-value" style={{ color: 'var(--primary-400)' }}>{perf.totalTasks}</div>
                  <div className="perf-stat-label">Total</div>
                </div>
                <div className="perf-stat">
                  <div className="perf-stat-value" style={{ color: 'var(--success-400)' }}>{perf.completedTasks}</div>
                  <div className="perf-stat-label">Done</div>
                </div>
                <div className="perf-stat">
                  <div className="perf-stat-value" style={{ color: 'var(--warning-400)' }}>{perf.pendingTasks}</div>
                  <div className="perf-stat-label">Pending</div>
                </div>
                <div className="perf-stat">
                  <div className="perf-stat-value" style={{ color: 'var(--text-accent)' }}>{perf.completionRate}%</div>
                  <div className="perf-stat-label">Rate</div>
                </div>
              </div>
              <div style={{ width: '120px' }}>
                <div className="progress-bar">
                  <div className="progress-fill success" style={{ width: `${perf.completionRate}%` }}></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Analytics;
