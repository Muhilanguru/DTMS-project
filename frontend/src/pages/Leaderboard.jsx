import { useState, useEffect } from 'react';
import API from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

const rankIcon = (rank) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return rank;
};

const Leaderboard = () => {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await API.get('/leaderboard');
        setBoard(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1>🏆 Leaderboard</h1>
        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Top performers based on completed tasks
        </span>
      </div>

      {error ? (
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <h3>Unable to load leaderboard</h3>
          <p>{error}</p>
        </div>
      ) : (
        <div className="leaderboard-grid">
          {board.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No leaderboard data yet</h3>
              <p>Complete tasks to populate the leaderboard.</p>
            </div>
          ) : (
            board.map((entry) => (
              <div
                key={entry.userId}
                className={`leaderboard-card ${entry.rank === 1 ? 'gold' : entry.rank === 2 ? 'silver' : entry.rank === 3 ? 'bronze' : ''}`}
              >
                <div className="leaderboard-rank">{rankIcon(entry.rank)}</div>
                <div className="leaderboard-body">
                  <div className="leaderboard-name">{entry.name}</div>
                  <div className="leaderboard-subtitle">Completed tasks</div>
                </div>
                <div className="leaderboard-value">{entry.completedTasks}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
