import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSets } from '../contexts/SetsContext';
import { useLibrary } from '../contexts/LibraryContext';
import AbcCheatbook from '../components/AbcCheatbook';
import './CheatbookPage.css';

export default function CheatbookPage() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const { sets, getSet } = useSets();
  const { tunes: allTunes, getTune } = useLibrary();
  const [selectedSetId, setSelectedSetId] = useState(setId || '');
  const [displayTunes, setDisplayTunes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTunes = useCallback(async () => {
    setLoading(true);

    if (selectedSetId) {
      // Load tunes for specific set
      const set = await getSet(selectedSetId);
      if (set) {
        const tunePromises = set.tuneIds.map((id) => getTune(id));
        const loadedTunes = await Promise.all(tunePromises);
        setDisplayTunes(loadedTunes.filter(Boolean));
      } else {
        setDisplayTunes([]);
      }
    } else {
      // Show all tunes from library
      setDisplayTunes(allTunes);
    }

    setLoading(false);
  }, [selectedSetId, getSet, getTune, allTunes]);

  useEffect(() => {
    loadTunes();
  }, [loadTunes]);

  useEffect(() => {
    if (setId && setId !== selectedSetId) {
      setSelectedSetId(setId);
    }
  }, [setId, selectedSetId]);

  const handleSetChange = (newSetId) => {
    setSelectedSetId(newSetId);
    if (newSetId) {
      navigate(`/cheatbook/${newSetId}`, { replace: true });
    } else {
      navigate('/cheatbook', { replace: true });
    }
  };

  return (
    <div className="cheatbook-page">
      <div className="page-header">
        <h1 className="page-title">Cheatbook</h1>
        <select
          className="set-selector"
          value={selectedSetId}
          onChange={(e) => handleSetChange(e.target.value)}
        >
          <option value="">All Tunes</option>
          {sets.map((set) => (
            <option key={set.id} value={set.id}>
              {set.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading cheatbook...</div>
      ) : displayTunes.length === 0 ? (
        <div className="empty-cheatbook">
          {selectedSetId ? (
            <p>No tunes in this set.</p>
          ) : (
            <>
              <p>Your library is empty.</p>
              <p>Search for tunes to add them to your collection.</p>
            </>
          )}
        </div>
      ) : (
        <div className="cheatbook-grid">
          {displayTunes.map((tune) => (
            <AbcCheatbook
              key={tune.id}
              tune={tune}
              barCount={8}
            />
          ))}
        </div>
      )}
    </div>
  );
}
