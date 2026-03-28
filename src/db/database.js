import { openDB } from 'idb';

const DB_NAME = 'tunebook';
const DB_VERSION = 2;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Tunes store
        if (!db.objectStoreNames.contains('tunes')) {
          const tuneStore = db.createObjectStore('tunes', { keyPath: 'id' });
          tuneStore.createIndex('tuneId', 'tuneId');
          tuneStore.createIndex('type', 'type');
          tuneStore.createIndex('addedAt', 'addedAt');
          tuneStore.createIndex('tags', 'tags', { multiEntry: true });
          tuneStore.createIndex('lastPracticed', 'lastPracticed');
        } else if (oldVersion < 2) {
          // Upgrade from v1: add new indexes
          const tuneStore = transaction.objectStore('tunes');
          if (!tuneStore.indexNames.contains('tags')) {
            tuneStore.createIndex('tags', 'tags', { multiEntry: true });
          }
          if (!tuneStore.indexNames.contains('lastPracticed')) {
            tuneStore.createIndex('lastPracticed', 'lastPracticed');
          }
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

export async function getTunesByTag(tag) {
  const db = await getDB();
  const index = db.transaction('tunes').store.index('tags');
  return index.getAll(tag);
}

export async function saveTune(tune) {
  const db = await getDB();
  return db.put('tunes', {
    ...tune,
    addedAt: tune.addedAt || Date.now(),
    tags: tune.tags || [],
    lastPracticed: tune.lastPracticed || null,
    practiceCount: tune.practiceCount || 0,
  });
}

export async function updateTune(id, updates) {
  const db = await getDB();
  const tune = await db.get('tunes', id);
  if (tune) {
    return db.put('tunes', { ...tune, ...updates });
  }
  return null;
}

export async function deleteTune(id) {
  const db = await getDB();
  return db.delete('tunes', id);
}

export async function getAllTags() {
  const db = await getDB();
  const tunes = await db.getAll('tunes');
  const tagSet = new Set();
  tunes.forEach((tune) => {
    if (tune.tags) {
      tune.tags.forEach((tag) => tagSet.add(tag));
    }
  });
  return Array.from(tagSet).sort();
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
