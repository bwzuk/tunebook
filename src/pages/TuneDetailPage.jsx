import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLibrary } from '../contexts/LibraryContext';
import { useSets } from '../contexts/SetsContext';
import AbcRenderer from '../components/AbcRenderer';
import Modal from '../components/Modal';
import './TuneDetailPage.css';

export default function TuneDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTune, removeTune } = useLibrary();
  const { sets, addTuneToSet } = useSets();
  const [tune, setTune] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddToSet, setShowAddToSet] = useState(false);

  useEffect(() => {
    const loadTune = async () => {
      setLoading(true);
      const tuneData = await getTune(decodeURIComponent(id));
      setTune(tuneData);
      setLoading(false);
    };
    loadTune();
  }, [id, getTune]);

  const handleDelete = async () => {
    if (confirm('Remove this tune from your library?')) {
      await removeTune(tune.id);
      navigate('/library');
    }
  };

  const handleAddToSet = async (setId) => {
    await addTuneToSet(setId, tune.id);
    setShowAddToSet(false);
  };

  if (loading) {
    return (
      <div className="tune-detail-page">
        <div className="loading">Loading tune...</div>
      </div>
    );
  }

  if (!tune) {
    return (
      <div className="tune-detail-page">
        <div className="not-found">
          <p>Tune not found.</p>
          <button onClick={() => navigate('/library')}>Back to Library</button>
        </div>
      </div>
    );
  }

  return (
    <div className="tune-detail-page">
      <button className="back-btn" onClick={() => navigate('/library')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="tune-header">
        <h1 className="tune-name">{tune.name}</h1>
        <div className="tune-meta">
          <span className="tune-type">{tune.type}</span>
          <span className="tune-key">{tune.key}</span>
          {tune.meter && <span className="tune-meter">{tune.meter}</span>}
        </div>
      </div>

      <div className="tune-actions">
        <button className="action-btn" onClick={() => setShowAddToSet(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <path d="M12 11v6M9 14h6" />
          </svg>
          Add to Set
        </button>
        {tune.sourceUrl && (
          <a
            href={tune.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View on TheSession
          </a>
        )}
        <button className="action-btn danger" onClick={handleDelete}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Remove
        </button>
      </div>

      <div className="tune-notation">
        <AbcRenderer tune={tune} />
      </div>

      <Modal
        isOpen={showAddToSet}
        onClose={() => setShowAddToSet(false)}
        title="Add to Set"
      >
        {sets.length === 0 ? (
          <div className="no-sets">
            <p>No sets yet.</p>
            <button onClick={() => navigate('/sets')}>Create a Set</button>
          </div>
        ) : (
          <div className="set-list">
            {sets.map((set) => (
              <button
                key={set.id}
                className="set-option"
                onClick={() => handleAddToSet(set.id)}
              >
                <span className="set-name">{set.name}</span>
                <span className="set-count">{set.tuneIds.length} tunes</span>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
