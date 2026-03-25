import { useState, useCallback } from 'react';
import { searchTunes } from '../api/theSession';
import TuneCard from '../components/TuneCard';
import VersionPicker from '../components/VersionPicker';
import './SearchPage.css';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTune, setSelectedTune] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useState(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await searchTunes(query, 1);
      setResults(data.tunes);
      setPage(1);
      setTotalPages(data.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadMore = useCallback(async () => {
    if (page >= totalPages || loading) return;

    setLoading(true);
    try {
      const data = await searchTunes(query, page + 1);
      setResults((prev) => [...prev, ...data.tunes]);
      setPage(data.page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, page, totalPages, loading]);

  return (
    <div className="search-page">
      <h1 className="page-title">Search Tunes</h1>

      {!isOnline && (
        <div className="offline-notice">
          You're offline. Search requires an internet connection.
        </div>
      )}

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search thesession.org..."
          className="search-input"
          disabled={!isOnline}
        />
        <button type="submit" className="search-button" disabled={loading || !isOnline}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      <div className="results-list">
        {results.map((tune) => (
          <TuneCard
            key={tune.id}
            tune={{
              name: tune.name,
              type: tune.type,
              key: '', // Key is in settings, not in search results
            }}
            onClick={() => setSelectedTune(tune)}
          />
        ))}
      </div>

      {results.length > 0 && page < totalPages && (
        <button className="load-more" onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}

      {results.length === 0 && !loading && query && (
        <div className="no-results">No tunes found for "{query}"</div>
      )}

      <VersionPicker
        tune={selectedTune}
        isOpen={!!selectedTune}
        onClose={() => setSelectedTune(null)}
      />
    </div>
  );
}
