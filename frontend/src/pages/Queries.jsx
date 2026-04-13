import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const Queries = () => {
  const { user } = useAuth();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingResponse, setEditingResponse] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [generatingAI, setGeneratingAI] = useState(null);

  // Fetch queries based on user role
  useEffect(() => {
    const fetchQueries = async () => {
      try {
        setLoading(true);
        const endpoint = user?.role === 'admin' ? '/queries' : '/queries/my-queries';
        const res = await API.get(endpoint);
        setQueries(res.data || []);
      } catch (err) {
        console.error('Failed to fetch queries', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQueries();
  }, [user?.role]);

  // Submit new query
  const handleSubmitQuery = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setFormError('Description is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.post('/queries', {
        title: formData.title,
        description: formData.description
      });
      setQueries([res.data, ...queries]);
      setFormData({ title: '', description: '' });
      setShowForm(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit query');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate AI suggestion
  const handleGenerateAI = async (queryId) => {
    setGeneratingAI(queryId);
    try {
      const query = queries.find(q => q._id === queryId);
      if (!query) return;

      const prompt = `A user has submitted a support query to a task management system. Provide a helpful and professional response.

Query Title: ${query.title}
Query Description: ${query.description}

Please provide a concise and helpful response that addresses the user's concern or question.`;

      const res = await API.post('/ai/suggest', { prompt });
      
      if (res.data.success) {
        setQueries(queries.map(q => 
          q._id === queryId 
            ? { ...q, aiSuggestion: { text: res.data.response, generatedAt: new Date() } }
            : q
        ));
      }
    } catch (err) {
      console.error('Failed to generate AI suggestion:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to generate AI suggestion';
      alert(errorMessage);
    } finally {
      setGeneratingAI(null);
    }
  };

  // Submit admin response
  const handleSubmitResponse = async (queryId) => {
    if (!responseText.trim()) {
      alert('Response cannot be empty');
      return;
    }

    try {
      const res = await API.put(`/queries/${queryId}/respond`, {
        response: responseText
      });
      setQueries(queries.map(q => 
        q._id === queryId ? res.data : q
      ));
      setEditingResponse(null);
      setResponseText('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit response');
    }
  };

  // Update status
  const handleUpdateStatus = async (queryId, newStatus) => {
    try {
      const res = await API.patch(`/queries/${queryId}/status`, {
        status: newStatus
      });
      setQueries(queries.map(q => 
        q._id === queryId ? res.data : q
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Filter and search queries
  const filteredQueries = queries.filter(q => {
    const matchesFilter = filter === 'all' || q.status === filter;
    const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase()) ||
                         q.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'open':
        return 'badge badge-danger';
      case 'in-progress':
        return 'badge badge-warning';
      case 'resolved':
        return 'badge badge-success';
      default:
        return 'badge';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open':
        return '🔴 Open';
      case 'in-progress':
        return '🟡 In Progress';
      case 'resolved':
        return '✅ Resolved';
      default:
        return status;
    }
  };

  return (
    <div className="queries-page">
      <div className="queries-header">
        <div>
          <h1>Support & Queries</h1>
          <p>Get help and submit your questions to our team</p>
        </div>
        {user?.role !== 'admin' && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancel' : '+ New Query'}
          </button>
        )}
      </div>

      {/* Query submission form */}
      {showForm && user?.role !== 'admin' && (
        <div className="card queries-form">
          <h3>Submit a New Query</h3>
          <form onSubmit={handleSubmitQuery}>
            <div className="form-group">
              <label>Query Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="Brief title of your question or issue"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={200}
              />
              <small style={{ color: 'var(--text-muted)' }}>
                {formData.title.length}/200
              </small>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-input"
                placeholder="Describe your issue or question in detail"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                maxLength={2000}
              />
              <small style={{ color: 'var(--text-muted)' }}>
                {formData.description.length}/2000
              </small>
            </div>

            {formError && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Query'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="queries-filters">
        <div>
          <input
            type="text"
            className="form-input"
            placeholder="Search queries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`btn btn-sm ${filter === 'open' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('open')}
          >
            Open
          </button>
          <button
            className={`btn btn-sm ${filter === 'in-progress' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('in-progress')}
          >
            In Progress
          </button>
          <button
            className={`btn btn-sm ${filter === 'resolved' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('resolved')}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Queries list */}
      <div className="queries-list">
        {loading ? (
          <div className="comment-loading">Loading queries...</div>
        ) : filteredQueries.length === 0 ? (
          <div className="comment-empty">
            {queries.length === 0 
              ? 'No queries yet. Submit your first query!' 
              : 'No queries match your filter.'}
          </div>
        ) : (
          filteredQueries.map((query) => (
            <div key={query._id} className="query-card">
              <div className="query-header">
                <div>
                  <h3 className="query-title">{query.title}</h3>
                  <p className="query-meta">
                    <span style={{ color: 'var(--text-muted)' }}>By {query.userName}</span>
                    <span style={{ marginLeft: '16px', color: 'var(--text-muted)' }}>
                      {new Date(query.createdAt).toLocaleDateString()}
                    </span>
                  </p>
                </div>
                <span className={getStatusBadgeClass(query.status)}>
                  {getStatusLabel(query.status)}
                </span>
              </div>

              <p className="query-description">{query.description}</p>

              {/* AI Suggestion */}
              {query.aiSuggestion?.text && (
                <div className="ai-suggestion-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px' }}>🤖</span>
                    <strong style={{ color: 'var(--accent-400)' }}>AI Suggestion</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(query.aiSuggestion.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {query.aiSuggestion.text}
                  </p>
                </div>
              )}

              {/* Admin Response */}
              {query.response?.text && (
                <div className="admin-response-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px' }}>👨‍💼</span>
                    <strong style={{ color: 'var(--success-400)' }}>Admin Response</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      By {query.response.respondedBy?.name || 'Admin'} on {new Date(query.response.respondedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {query.response.text}
                  </p>
                </div>
              )}

              {/* Admin action buttons */}
              {user?.role === 'admin' && (
                <div className="query-admin-actions">
                  {!query.aiSuggestion?.text && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleGenerateAI(query._id)}
                      disabled={generatingAI === query._id}
                    >
                      {generatingAI === query._id ? '⏳ Generating...' : '🤖 AI Suggestion'}
                    </button>
                  )}

                  {!query.response?.text && (
                    <>
                      {editingResponse === query._id ? (
                        <div style={{ marginTop: '12px' }}>
                          <textarea
                            className="form-input"
                            placeholder="Type your response..."
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            rows={4}
                            maxLength={2000}
                          />
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleSubmitResponse(query._id)}
                            >
                              Send Response
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setEditingResponse(null);
                                setResponseText('');
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setEditingResponse(query._id);
                            setResponseText('');
                          }}
                        >
                          ✏️ Respond
                        </button>
                      )}
                    </>
                  )}

                  <select
                    className="form-select"
                    value={query.status}
                    onChange={(e) => handleUpdateStatus(query._id, e.target.value)}
                    style={{ maxWidth: '180px' }}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Queries;
