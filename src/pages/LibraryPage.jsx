import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../contexts/LibraryContext';
import TuneCard from '../components/TuneCard';
import TagFilter from '../components/TagFilter';
import EmptyLibrary from '../components/EmptyLibrary';
import abcjs from 'abcjs';
import { buildFullAbc } from '../utils/abcUtils';
import './LibraryPage.css';

const TUNE_TYPES = ['all', 'jig', 'reel', 'hornpipe', 'polka', 'slip jig', 'waltz', 'slide'];

const SORT_OPTIONS = [
  { value: 'addedAt', label: 'Date Added' },
  { value: 'name', label: 'Name' },
  { value: 'lastPracticed', label: 'Last Practiced' },
];

const PRACTICE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'recent', label: 'Recently Practiced' },
  { value: 'needsPractice', label: 'Needs Practice (7+ days)' },
  { value: 'never', label: 'Never Practiced' },
];

export default function LibraryPage() {
  const { tunes, allTags, loading, error, removeTune, recordPractice } = useLibrary();
  const [typeFilter, setTypeFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState(null);
  const [practiceFilter, setPracticeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('addedAt');
  const [playingTuneId, setPlayingTuneId] = useState(null);
  const navigate = useNavigate();

  const filteredAndSortedTunes = useMemo(() => {
    let result = tunes;

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((tune) => tune.type?.toLowerCase() === typeFilter);
    }

    // Tag filter
    if (tagFilter) {
      result = result.filter((tune) => tune.tags?.includes(tagFilter));
    }

    // Practice filter
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    if (practiceFilter === 'recent') {
      result = result.filter((tune) => tune.lastPracticed && tune.lastPracticed > sevenDaysAgo);
    } else if (practiceFilter === 'needsPractice') {
      result = result.filter((tune) => !tune.lastPracticed || tune.lastPracticed < sevenDaysAgo);
    } else if (practiceFilter === 'never') {
      result = result.filter((tune) => !tune.lastPracticed);
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'lastPracticed') {
        if (!a.lastPracticed && !b.lastPracticed) return 0;
        if (!a.lastPracticed) return 1;
        if (!b.lastPracticed) return -1;
        return b.lastPracticed - a.lastPracticed;
      }
      return b.addedAt - a.addedAt;
    });

    return result;
  }, [tunes, typeFilter, tagFilter, practiceFilter, sortBy]);

  const handleDelete = async (e, tuneId) => {
    e.stopPropagation();
    if (confirm('Remove this tune from your library?')) {
      await removeTune(tuneId);
    }
  };

  const handlePractice = async (e, tuneId) => {
    e.stopPropagation();
    await recordPractice(tuneId);
  };

  const handlePlayStateChange = (tuneId, isPlaying) => {
    setPlayingTuneId(isPlaying ? tuneId : null);
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
            className={`filter-btn ${typeFilter === type ? 'active' : ''}`}
            onClick={() => setTypeFilter(type)}
          >
            {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <TagFilter tags={allTags} selectedTag={tagFilter} onSelectTag={setTagFilter} />

      <div className="library-controls">
        <div className="library-control">
          <label htmlFor="practice-filter">Practice:</label>
          <select
            id="practice-filter"
            value={practiceFilter}
            onChange={(e) => setPracticeFilter(e.target.value)}
          >
            {PRACTICE_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="library-control">
          <label htmlFor="sort-by">Sort:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredAndSortedTunes.length === 0 ? (
        tunes.length === 0 ? (
          <EmptyLibrary
            message="Your library is empty"
            submessage="Search for tunes to add them to your collection"
          />
        ) : (
          <EmptyLibrary
            message="No tunes match your filters"
            submessage="Try adjusting your filter settings"
          />
        )
      ) : (
        <div className="tunes-list">
          {filteredAndSortedTunes.map((tune) => (
            <TuneCardWithActions
              key={tune.id}
              tune={tune}
              isCurrentlyPlaying={playingTuneId === tune.id}
              onPlayStateChange={handlePlayStateChange}
              onNavigate={() => navigate(`/library/${encodeURIComponent(tune.id)}`)}
              onDelete={(e) => handleDelete(e, tune.id)}
              onPractice={(e) => handlePractice(e, tune.id)}
            />
          ))}
        </div>
      )}

      <div className="library-stats">
        {filteredAndSortedTunes.length} of {tunes.length} tune{tunes.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

function TuneCardWithActions({ tune, isCurrentlyPlaying, onPlayStateChange, onNavigate, onDelete, onPractice }) {
  const synthRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Stop if another tune starts
  useEffect(() => {
    if (!isCurrentlyPlaying && isPlaying) {
      if (synthRef.current) {
        synthRef.current.stop();
      }
      setIsPlaying(false);
    }
  }, [isCurrentlyPlaying, isPlaying]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
      }
    };
  }, []);

  const handlePlay = async (e) => {
    e.stopPropagation();

    if (isPlaying) {
      if (synthRef.current) {
        synthRef.current.stop();
      }
      setIsPlaying(false);
      onPlayStateChange(tune.id, false);
      return;
    }

    setIsLoading(true);

    try {
      const fullAbc = buildFullAbc(tune);
      const visualObj = abcjs.renderAbc('*', fullAbc)[0];

      if (!synthRef.current) {
        synthRef.current = new abcjs.synth.CreateSynth();
      }

      await synthRef.current.init({
        visualObj: visualObj,
        options: {
          soundFontUrl: 'https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/',
        },
      });

      await synthRef.current.prime();
      synthRef.current.start();
      setIsPlaying(true);
      onPlayStateChange(tune.id, true);

      const checkEnded = setInterval(() => {
        if (synthRef.current && !synthRef.current.isRunning) {
          setIsPlaying(false);
          onPlayStateChange(tune.id, false);
          clearInterval(checkEnded);
        }
      }, 200);
    } catch (err) {
      console.error('Playback error:', err);
    }

    setIsLoading(false);
  };

  const needsPractice = !tune.lastPracticed ||
    (Date.now() - tune.lastPracticed) > 7 * 24 * 60 * 60 * 1000;

  const formatPractice = () => {
    if (!tune.lastPracticed) return null;
    const days = Math.floor((Date.now() - tune.lastPracticed) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  return (
    <TuneCard
      tune={tune}
      onClick={onNavigate}
      practiceIndicator={needsPractice ? 'needs-practice' : 'practiced'}
      practiceText={formatPractice()}
      tags={tune.tags}
      actions={
        <>
          <button
            onClick={handlePlay}
            disabled={isLoading}
            className={`tune-action-btn play ${isPlaying ? 'playing' : ''}`}
            title={isPlaying ? 'Stop' : 'Play'}
          >
            {isLoading ? (
              <span className="action-spinner"></span>
            ) : isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>
          <button
            onClick={onPractice}
            className="tune-action-btn practice"
            title="Mark as Practiced"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </button>
          <button onClick={onDelete} className="tune-action-btn delete" title="Remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </>
      }
    />
  );
}
