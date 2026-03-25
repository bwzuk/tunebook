import { openDB } from 'idb';

const DB_NAME = 'tunebook';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Tunes store
        if (!db.objectStoreNames.contains('tunes')) {
          const tuneStore = db.createObjectStore('tunes', { keyPath: 'id' });
          tuneStore.createIndex('tuneId', 'tuneId');
          tuneStore.createIndex('type', 'type');
          tuneStore.createIndex('addedAt', 'addedAt');
        }

        // Sets store
        if (!db.objectStoreNames.contains('sets')) {
          const setStore = db.createObjectStore('sets', { keyPath: 'id' });
          setStore.createIndex('createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

// Tunes operations
export async function getAllTunes() {
  const db = await getDB();
  return db.getAll('tunes');
}

export async function getTuneById(id) {
  const db = await getDB();
  return db.get('tunes', id);
}

export async function getTunesByType(type) {
  const db = await getDB();
  const index = db.transaction('tunes').store.index('type');
  return index.getAll(type);
}

export async function saveTune(tune) {
  const db = await getDB();
  return db.put('tunes', {
    ...tune,
    addedAt: tune.addedAt || Date.now(),
  });
}

export async function deleteTune(id) {
  const db = await getDB();
  return db.delete('tunes', id);
}

// Sets operations
export async function getAllSets() {
  const db = await getDB();
  return db.getAll('sets');
}

export async function getSetById(id) {
  const db = await getDB();
  return db.get('sets', id);
}

export async function saveSet(set) {
  const db = await getDB();
  return db.put('sets', {
    ...set,
    createdAt: set.createdAt || Date.now(),
  });
}

export async function deleteSet(id) {
  const db = await getDB();
  return db.delete('sets', id);
}

export async function addTuneToSet(setId, tuneId) {
  const db = await getDB();
  const set = await db.get('sets', setId);
  if (set && !set.tuneIds.includes(tuneId)) {
    set.tuneIds.push(tuneId);
    return db.put('sets', set);
  }
  return set;
}

export async function removeTuneFromSet(setId, tuneId) {
  const db = await getDB();
  const set = await db.get('sets', setId);
  if (set) {
    set.tuneIds = set.tuneIds.filter((id) => id !== tuneId);
    return db.put('sets', set);
  }
  return set;
}

export async function reorderTunesInSet(setId, tuneIds) {
  const db = await getDB();
  const set = await db.get('sets', setId);
  if (set) {
    set.tuneIds = tuneIds;
    return db.put('sets', set);
  }
  return set;
}
