import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../contexts/LibraryContext';
import TuneCard from '../components/TuneCard';
import './LibraryPage.css';

const TUNE_TYPES = ['all', 'jig', 'reel', 'hornpipe', 'polka', 'slip jig', 'waltz', 'slide'];

export default function LibraryPage() {
  const { tunes, loading, error, removeTune } = useLibrary();
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const filteredTunes = useMemo(() => {
    if (filter === 'all') return tunes;
    return tunes.filter((tune) => tune.type?.toLowerCase() === filter);
  }, [tunes, filter]);

  const handleDelete = async (e, tuneId) => {
    e.stopPropagation();
    if (confirm('Remove this tune from your library?')) {
      await removeTune(tuneId);
    }
  };

  if (loading) {
    return (
      <div className="library-page">
        <h1 className="page-title">My Library</h1>
        <div className="loading">Loading your tunes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="library-page">
        <h1 className="page-title">My Library</h1>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="library-page">
      <h1 className="page-title">My Library</h1>

      <div className="filter-bar">
        {TUNE_TYPES.map((type) => (
          <button
            key={type}
            className={`filter-btn ${filter === type ? 'active' : ''}`}
            onClick={() => setFilter(type)}
          >
            {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {filteredTunes.length === 0 ? (
        <div className="empty-library">
          {filter === 'all' ? (
            <>
              <p>Your library is empty.</p>
              <p>Search for tunes to add them to your collection.</p>
            </>
          ) : (
            <p>No {filter}s in your library.</p>
          )}
        </div>
      ) : (
        <div className="tunes-list">
          {filteredTunes.map((tune) => (
            <TuneCard
              key={tune.id}
              tune={tune}
              onClick={() => navigate(`/library/${encodeURIComponent(tune.id)}`)}
              actions={
                <button onClick={(e) => handleDelete(e, tune.id)} title="Remove">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              }
            />
          ))}
        </div>
      )}

      <div className="library-stats">
        {tunes.length} tune{tunes.length !== 1 ? 's' : ''} in library
      </div>
    </div>
  );
}
