import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { syncToCloud, syncFromCloud, setupRealtimeSync } from '../services/syncService';
import { useLibrary } from './LibraryContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const { refresh } = useLibrary();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // Sync from cloud when user signs in
      if (firebaseUser) {
        setSyncing(true);
        try {
          await syncFromCloud(firebaseUser.uid);
          await refresh();
        } catch (err) {
          console.error('Sync from cloud failed:', err);
          setError('Failed to sync from cloud');
        } finally {
          setSyncing(false);
        }
      }
    });

    return () => unsubscribe();
  }, [refresh]);

  // Set up realtime sync when user is logged in
  useEffect(() => {
    if (!user) return;

    const unsubscribe = setupRealtimeSync(user.uid, () => {
      refresh();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, refresh]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message);
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err.message);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!user) return;

    setSyncing(true);
    setError(null);
    try {
      await syncToCloud(user.uid);
      await syncFromCloud(user.uid);
      await refresh();
    } catch (err) {
      console.error('Sync error:', err);
      setError('Sync failed');
    } finally {
      setSyncing(false);
    }
  }, [user, refresh]);

  const value = {
    user,
    loading,
    syncing,
    error,
    signInWithGoogle,
    signOut,
    syncNow,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
