import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as db from '../db/database';

const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const [tunes, setTunes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTunes = useCallback(async () => {
    try {
      setLoading(true);
      const allTunes = await db.getAllTunes();
      setTunes(allTunes.sort((a, b) => b.addedAt - a.addedAt));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTunes();
  }, [loadTunes]);

  const addTune = useCallback(async (tune) => {
    try {
      await db.saveTune(tune);
      await loadTunes();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadTunes]);

  const removeTune = useCallback(async (id) => {
    try {
      await db.deleteTune(id);
      await loadTunes();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadTunes]);

  const getTune = useCallback(async (id) => {
    try {
      return await db.getTuneById(id);
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const hasTune = useCallback((id) => {
    return tunes.some((tune) => tune.id === id);
  }, [tunes]);

  const value = {
    tunes,
    loading,
    error,
    addTune,
    removeTune,
    getTune,
    hasTune,
    refresh: loadTunes,
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
