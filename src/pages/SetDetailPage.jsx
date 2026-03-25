import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSets } from '../contexts/SetsContext';
import { useLibrary } from '../contexts/LibraryContext';
import TuneCard from '../components/TuneCard';
import './SetDetailPage.css';

export default function SetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSet, updateSet, removeTuneFromSet, reorderTunes } = useSets();
  const { getTune } = useLibrary();
  const [set, setSet] = useState(null);
  const [tunes, setTunes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const loadSet = useCallback(async () => {
    setLoading(true);
    const setData = await getSet(id);
    if (setData) {
      setSet(setData);
      setNewName(setData.name);
      // Load all tunes in the set
      const tunePromises = setData.tuneIds.map((tuneId) => getTune(tuneId));
      const loadedTunes = await Promise.all(tunePromises);
      setTunes(loadedTunes.filter(Boolean));
    }
    setLoading(false);
  }, [id, getSet, getTune]);

  useEffect(() => {
    loadSet();
  }, [loadSet]);

  const handleRename = async () => {
    if (!newName.trim() || newName === set.name) {
      setEditingName(false);
      return;
    }
    await updateSet({ ...set, name: newName.trim() });
    setSet({ ...set, name: newName.trim() });
    setEditingName(false);
  };

  const handleRemoveTune = async (tuneId) => {
    await removeTuneFromSet(id, tuneId);
    setTunes(tunes.filter((t) => t.id !== tuneId));
    setSet({ ...set, tuneIds: set.tuneIds.filter((tid) => tid !== tuneId) });
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    const newTuneIds = [...set.tuneIds];
    [newTuneIds[index - 1], newTuneIds[index]] = [newTuneIds[index], newTuneIds[index - 1]];
    await reorderTunes(id, newTuneIds);
    setSet({ ...set, tuneIds: newTuneIds });
    const newTunes = [...tunes];
    [newTunes[index - 1], newTunes[index]] = [newTunes[index], newTunes[index - 1]];
    setTunes(newTunes);
  };

  const handleMoveDown = async (index) => {
    if (index === tunes.length - 1) return;
    const newTuneIds = [...set.tuneIds];
    [newTuneIds[index], newTuneIds[index + 1]] = [newTuneIds[index + 1], newTuneIds[index]];
    await reorderTunes(id, newTuneIds);
    setSet({ ...set, tuneIds: newTuneIds });
    const newTunes = [...tunes];
    [newTunes[index], newTunes[index + 1]] = [newTunes[index + 1], newTunes[index]];
    setTunes(newTunes);
  };

  if (loading) {
    return (
      <div className="set-detail-page">
        <div className="loading">Loading set...</div>
      </div>
    );
  }

  if (!set) {
    return (
      <div className="set-detail-page">
        <div className="not-found">
          <p>Set not found.</p>
          <button onClick={() => navigate('/sets')}>Back to Sets</button>
        </div>
      </div>
    );
  }

  return (
    <div className="set-detail-page">
      <button className="back-btn" onClick={() => navigate('/sets')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="set-header">
        {editingName ? (
          <form onSubmit={(e) => { e.preventDefault(); handleRename(); }} className="rename-form">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rename-input"
              autoFocus
              onBlur={handleRename}
            />
          </form>
        ) : (
          <h1 className="set-name" onClick={() => setEditingName(true)}>
            {set.name}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </h1>
        )}
        <span className="set-count">{tunes.length} tune{tunes.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="set-actions">
        <button
          className="action-btn"
          onClick={() => navigate(`/cheatbook/${id}`)}
          disabled={tunes.length === 0}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          View Cheatbook
        </button>
      </div>

      {tunes.length === 0 ? (
        <div className="empty-set">
          <p>No tunes in this set.</p>
          <p>Go to your Library and add tunes to this set.</p>
        </div>
      ) : (
        <div className="tunes-list">
          {tunes.map((tune, index) => (
            <div key={tune.id} className="tune-row">
              <span className="tune-number">{index + 1}</span>
              <TuneCard
                tune={tune}
                onClick={() => navigate(`/library/${encodeURIComponent(tune.id)}`)}
              />
              <div className="tune-controls">
                <button
                  className="control-btn"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  title="Move up"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
                <button
                  className="control-btn"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === tunes.length - 1}
                  title="Move down"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <button
                  className="control-btn danger"
                  onClick={() => handleRemoveTune(tune.id)}
                  title="Remove from set"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
