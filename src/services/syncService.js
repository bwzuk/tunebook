import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import * as localDb from '../db/database';

// Sync local tunes to cloud
export async function syncToCloud(userId) {
  const localTunes = await localDb.getAllTunes();
  const localSets = await localDb.getAllSets();

  const batch = writeBatch(db);

  // Sync tunes
  for (const tune of localTunes) {
    const tuneRef = doc(db, 'users', userId, 'tunes', tune.id);
    batch.set(tuneRef, {
      ...tune,
      syncedAt: serverTimestamp(),
    });
  }

  // Sync sets
  for (const set of localSets) {
    const setRef = doc(db, 'users', userId, 'sets', set.id);
    batch.set(setRef, {
      ...set,
      syncedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

// Sync from cloud to local (merge strategy: latest timestamp wins)
export async function syncFromCloud(userId) {
  // Get cloud tunes
  const tunesSnapshot = await getDocs(collection(db, 'users', userId, 'tunes'));
  const cloudTunes = [];
  tunesSnapshot.forEach((doc) => {
    cloudTunes.push({ id: doc.id, ...doc.data() });
  });

  // Get cloud sets
  const setsSnapshot = await getDocs(collection(db, 'users', userId, 'sets'));
  const cloudSets = [];
  setsSnapshot.forEach((doc) => {
    cloudSets.push({ id: doc.id, ...doc.data() });
  });

  // Get local data
  const localTunes = await localDb.getAllTunes();
  const localSets = await localDb.getAllSets();

  // Merge tunes (cloud wins for new items, latest timestamp wins for conflicts)
  const localTuneMap = new Map(localTunes.map((t) => [t.id, t]));

  for (const cloudTune of cloudTunes) {
    const localTune = localTuneMap.get(cloudTune.id);

    if (!localTune) {
      // New tune from cloud
      await localDb.saveTune(cloudTune);
    } else {
      // Conflict resolution: latest timestamp wins
      const cloudTime = cloudTune.syncedAt?.toMillis?.() || cloudTune.addedAt || 0;
      const localTime = localTune.syncedAt || localTune.addedAt || 0;

      if (cloudTime > localTime) {
        await localDb.saveTune(cloudTune);
      }
    }
  }

  // Merge sets
  const localSetMap = new Map(localSets.map((s) => [s.id, s]));

  for (const cloudSet of cloudSets) {
    const localSet = localSetMap.get(cloudSet.id);

    if (!localSet) {
      // New set from cloud
      await localDb.saveSet(cloudSet);
    } else {
      // Conflict resolution: latest timestamp wins
      const cloudTime = cloudSet.syncedAt?.toMillis?.() || cloudSet.createdAt || 0;
      const localTime = localSet.syncedAt || localSet.createdAt || 0;

      if (cloudTime > localTime) {
        await localDb.saveSet(cloudSet);
      }
    }
  }
}

// Set up realtime sync listener
export function setupRealtimeSync(userId, onUpdate) {
  // Listen to tunes collection
  const tunesUnsubscribe = onSnapshot(
    collection(db, 'users', userId, 'tunes'),
    async (snapshot) => {
      // Process changes
      for (const change of snapshot.docChanges()) {
        const tuneData = { id: change.doc.id, ...change.doc.data() };

        if (change.type === 'added' || change.type === 'modified') {
          const localTune = await localDb.getTuneById(tuneData.id);
          const cloudTime = tuneData.syncedAt?.toMillis?.() || tuneData.addedAt || 0;
          const localTime = localTune?.syncedAt || localTune?.addedAt || 0;

          if (!localTune || cloudTime > localTime) {
            await localDb.saveTune(tuneData);
          }
        } else if (change.type === 'removed') {
          await localDb.deleteTune(tuneData.id);
        }
      }
      onUpdate();
    },
    (error) => {
      console.error('Realtime sync error (tunes):', error);
    }
  );

  // Listen to sets collection
  const setsUnsubscribe = onSnapshot(
    collection(db, 'users', userId, 'sets'),
    async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const setData = { id: change.doc.id, ...change.doc.data() };

        if (change.type === 'added' || change.type === 'modified') {
          const localSet = await localDb.getSetById(setData.id);
          const cloudTime = setData.syncedAt?.toMillis?.() || setData.createdAt || 0;
          const localTime = localSet?.syncedAt || localSet?.createdAt || 0;

          if (!localSet || cloudTime > localTime) {
            await localDb.saveSet(setData);
          }
        } else if (change.type === 'removed') {
          await localDb.deleteSet(setData.id);
        }
      }
      onUpdate();
    },
    (error) => {
      console.error('Realtime sync error (sets):', error);
    }
  );

  // Return cleanup function
  return () => {
    tunesUnsubscribe();
    setsUnsubscribe();
  };
}

// Push a single tune to cloud (called after local save)
export async function pushTuneToCloud(userId, tune) {
  const tuneRef = doc(db, 'users', userId, 'tunes', tune.id);
  await setDoc(tuneRef, {
    ...tune,
    syncedAt: serverTimestamp(),
  });
}

// Delete a tune from cloud
export async function deleteTuneFromCloud(userId, tuneId) {
  const tuneRef = doc(db, 'users', userId, 'tunes', tuneId);
  await deleteDoc(tuneRef);
}

// Push a single set to cloud
export async function pushSetToCloud(userId, set) {
  const setRef = doc(db, 'users', userId, 'sets', set.id);
  await setDoc(setRef, {
    ...set,
    syncedAt: serverTimestamp(),
  });
}

// Delete a set from cloud
export async function deleteSetFromCloud(userId, setId) {
  const setRef = doc(db, 'users', userId, 'sets', setId);
  await deleteDoc(setRef);
}
