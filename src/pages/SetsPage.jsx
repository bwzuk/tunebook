import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSets } from '../contexts/SetsContext';
import Modal from '../components/Modal';
import './SetsPage.css';

export default function SetsPage() {
  const { sets, loading, error, createSet, removeSet } = useSets();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newSetName, setNewSetName] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newSetName.trim()) return;

    const newSet = await createSet(newSetName.trim());
    if (newSet) {
      setNewSetName('');
      setShowCreate(false);
      navigate(`/sets/${newSet.id}`);
    }
  };

  const handleDelete = async (e, setId) => {
    e.stopPropagation();
    if (confirm('Delete this set? This cannot be undone.')) {
      await removeSet(setId);
    }
  };

  if (loading) {
    return (
      <div className="sets-page">
        <h1 className="page-title">Sets</h1>
        <div className="loading">Loading sets...</div>
      </div>
    );
  }

  return (
    <div className="sets-page">
      <div className="page-header">
        <h1 className="page-title">Sets</h1>
        <button className="create-btn" onClick={() => setShowCreate(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Set
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {sets.length === 0 ? (
        <div className="empty-sets">
          <p>No sets yet.</p>
          <p>Create a set to organize your tunes for a session.</p>
        </div>
      ) : (
        <div className="sets-list">
          {sets.map((set) => (
            <div
              key={set.id}
              className="set-card"
              onClick={() => navigate(`/sets/${set.id}`)}
            >
              <div className="set-info">
                <h3 className="set-name">{set.name}</h3>
                <span className="set-count">
                  {set.tuneIds.length} tune{set.tuneIds.length !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => handleDelete(e, set.id)}
                title="Delete set"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create New Set"
      >
        <form onSubmit={handleCreate} className="create-form">
          <input
            type="text"
            value={newSetName}
            onChange={(e) => setNewSetName(e.target.value)}
            placeholder="Set name..."
            className="create-input"
            autoFocus
          />
          <button type="submit" className="submit-btn" disabled={!newSetName.trim()}>
            Create Set
          </button>
        </form>
      </Modal>
    </div>
  );
}
