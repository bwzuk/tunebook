import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as db from '../db/database';
import { auth } from '../firebase';
import { pushTuneToCloud, deleteTuneFromCloud } from '../services/syncService';

const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const [tunes, setTunes] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userRef = useRef(null);

  // Track current user for sync operations
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      userRef.current = user;
    });
    return () => unsubscribe();
  }, []);

  const loadTunes = useCallback(async () => {
    try {
      setLoading(true);
      const allTunes = await db.getAllTunes();
      setTunes(allTunes.sort((a, b) => b.addedAt - a.addedAt));
      const tags = await db.getAllTags();
      setAllTags(tags);
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

      // Sync to cloud if logged in
      if (userRef.current) {
        try {
          const savedTune = await db.getTuneById(tune.id);
          await pushTuneToCloud(userRef.current.uid, savedTune);
        } catch (syncErr) {
          console.error('Cloud sync failed:', syncErr);
          // Don't fail the operation if sync fails
        }
      }

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

      // Sync deletion to cloud if logged in
      if (userRef.current) {
        try {
          await deleteTuneFromCloud(userRef.current.uid, id);
        } catch (syncErr) {
          console.error('Cloud sync failed:', syncErr);
        }
      }

      await loadTunes();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadTunes]);

  const updateTune = useCallback(async (id, updates) => {
    try {
      await db.updateTune(id, updates);

      // Sync to cloud if logged in
      if (userRef.current) {
        try {
          const updatedTune = await db.getTuneById(id);
          await pushTuneToCloud(userRef.current.uid, updatedTune);
        } catch (syncErr) {
          console.error('Cloud sync failed:', syncErr);
        }
      }

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

  const recordPractice = useCallback(async (id) => {
    try {
      const tune = await db.getTuneById(id);
      if (tune) {
        await db.updateTune(id, {
          lastPracticed: Date.now(),
          practiceCount: (tune.practiceCount || 0) + 1,
        });

        // Sync to cloud if logged in
        if (userRef.current) {
          try {
            const updatedTune = await db.getTuneById(id);
            await pushTuneToCloud(userRef.current.uid, updatedTune);
          } catch (syncErr) {
            console.error('Cloud sync failed:', syncErr);
          }
        }

        await loadTunes();
        return true;
      }
      return false;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadTunes]);

  const addTag = useCallback(async (id, tag) => {
    try {
      const tune = await db.getTuneById(id);
      if (tune) {
        const tags = tune.tags || [];
        if (!tags.includes(tag)) {
          await db.updateTune(id, { tags: [...tags, tag] });

          // Sync to cloud if logged in
          if (userRef.current) {
            try {
              const updatedTune = await db.getTuneById(id);
              await pushTuneToCloud(userRef.current.uid, updatedTune);
            } catch (syncErr) {
              console.error('Cloud sync failed:', syncErr);
            }
          }

          await loadTunes();
        }
        return true;
      }
      return false;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadTunes]);

  const removeTag = useCallback(async (id, tag) => {
    try {
      const tune = await db.getTuneById(id);
      if (tune) {
        const tags = (tune.tags || []).filter((t) => t !== tag);
        await db.updateTune(id, { tags });

        // Sync to cloud if logged in
        if (userRef.current) {
          try {
            const updatedTune = await db.getTuneById(id);
            await pushTuneToCloud(userRef.current.uid, updatedTune);
          } catch (syncErr) {
            console.error('Cloud sync failed:', syncErr);
          }
        }

        await loadTunes();
        return true;
      }
      return false;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadTunes]);

  const value = {
    tunes,
    allTags,
    loading,
    error,
    addTune,
    removeTune,
    updateTune,
    getTune,
    hasTune,
    recordPractice,
    addTag,
    removeTag,
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
