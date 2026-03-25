import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../db/database';

const SetsContext = createContext(null);

export function SetsProvider({ children }) {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const createSet = useCallback(async (name) => {
    try {
      const newSet = {
        id: uuidv4(),
        name,
        tuneIds: [],
        createdAt: Date.now(),
      };
      await db.saveSet(newSet);
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
      await loadSets();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadSets]);

  const removeSet = useCallback(async (id) => {
    try {
      await db.deleteSet(id);
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
      await loadSets();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadSets]);

  const removeTuneFromSet = useCallback(async (setId, tuneId) => {
    try {
      await db.removeTuneFromSet(setId, tuneId);
      await loadSets();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadSets]);

  const reorderTunes = useCallback(async (setId, tuneIds) => {
    try {
      await db.reorderTunesInSet(setId, tuneIds);
      await loadSets();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadSets]);

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
