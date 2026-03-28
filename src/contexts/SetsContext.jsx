import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../db/database';
import { auth } from '../firebase';
import { pushSetToCloud, deleteSetFromCloud } from '../services/syncService';

const SetsContext = createContext(null);

export function SetsProvider({ children }) {
  const [sets, setSets] = useState([]);
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

  const loadSets = useCallback(async () => {
    try {
      setLoading(true);
      const allSets = await db.getAllSets();
      setSets(allSets.sort((a, b) => b.createdAt - a.createdAt));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSets();
  }, [loadSets]);

  const syncSetToCloud = useCallback(async (setId) => {
    if (userRef.current) {
      try {
        const set = await db.getSetById(setId);
        if (set) {
          await pushSetToCloud(userRef.current.uid, set);
        }
      } catch (syncErr) {
        console.error('Cloud sync failed:', syncErr);
      }
    }
  }, []);

  const createSet = useCallback(async (name) => {
    try {
      const newSet = {
        id: uuidv4(),
        name,
        tuneIds: [],
        createdAt: Date.now(),
      };
      await db.saveSet(newSet);

      // Sync to cloud
      if (userRef.current) {
        try {
          await pushSetToCloud(userRef.current.uid, newSet);
        } catch (syncErr) {
          console.error('Cloud sync failed:', syncErr);
        }
      }

      await loadSets();
      return newSet;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [loadSets]);

  const updateSet = useCallback(async (set) => {
    try {
      await db.saveSet(set);
      await syncSetToCloud(set.id);
      await loadSets();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadSets, syncSetToCloud]);

  const removeSet = useCallback(async (id) => {
    try {
      await db.deleteSet(id);

      // Sync deletion to cloud
      if (userRef.current) {
        try {
          await deleteSetFromCloud(userRef.current.uid, id);
        } catch (syncErr) {
          console.error('Cloud sync failed:', syncErr);
        }
      }

      await loadSets();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadSets]);

  const getSet = useCallback(async (id) => {
    try {
      return await db.getSetById(id);
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const addTuneToSet = useCallback(async (setId, tuneId) => {
    try {
      await db.addTuneToSet(setId, tuneId);
      await syncSetToCloud(setId);
      await loadSets();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadSets, syncSetToCloud]);

  const removeTuneFromSet = useCallback(async (setId, tuneId) => {
    try {
      await db.removeTuneFromSet(setId, tuneId);
      await syncSetToCloud(setId);
      await loadSets();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadSets, syncSetToCloud]);

  const reorderTunes = useCallback(async (setId, tuneIds) => {
    try {
      await db.reorderTunesInSet(setId, tuneIds);
      await syncSetToCloud(setId);
      await loadSets();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadSets, syncSetToCloud]);

  const value = {
    sets,
    loading,
    error,
    createSet,
    updateSet,
    removeSet,
    getSet,
    addTuneToSet,
    removeTuneFromSet,
    reorderTunes,
    refresh: loadSets,
  };

  return (
    <SetsContext.Provider value={value}>
      {children}
    </SetsContext.Provider>
  );
}

export function useSets() {
  const context = useContext(SetsContext);
  if (!context) {
    throw new Error('useSets must be used within a SetsProvider');
  }
  return context;
}
