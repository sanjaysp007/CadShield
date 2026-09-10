/**
 * CADShield Client-Side Persistent File Storage (IndexedDB)
 * Stores 3D model files (STL, OBJ, PLY) and watermarked Blobs across page refreshes.
 */

const DB_NAME = 'cadshield_files_db'
const DB_VERSION = 1
const STORE_NAME = 'cad_models'

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported'))
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
  })
}

/**
 * Save a File or Blob into IndexedDB with a given key (e.g. modelId or projectId)
 */
export async function saveModelFile(key, fileOrBlob, filename = '') {
  if (!key || !fileOrBlob) return
  try {
    const db = await openDB()
    const name = filename || fileOrBlob.name || `${key}.stl`
    const record = {
      blob: fileOrBlob,
      name: name,
      timestamp: Date.now(),
      size: fileOrBlob.size,
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.put(record, String(key))
      tx.oncomplete = () => resolve(true)
      tx.onerror = (e) => reject(e.target.error)
    })
  } catch (err) {
    console.warn('Failed to save model file to IndexedDB:', err)
  }
}

/**
 * Save under multiple keys simultaneously (e.g. modelId, projectId, name)
 */
export async function saveModelFileMulti(keys, fileOrBlob, filename = '') {
  for (const k of keys) {
    if (k) await saveModelFile(k, fileOrBlob, filename)
  }
}

/**
 * Retrieve a stored model File/Blob by key from IndexedDB
 */
export async function getModelFile(key) {
  if (!key) return null
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(String(key))
      req.onsuccess = () => {
        const res = req.result
        if (res && res.blob) {
          resolve({ blob: res.blob, name: res.name, size: res.size })
        } else {
          resolve(null)
        }
      }
      req.onerror = (e) => reject(e.target.error)
    })
  } catch (err) {
    console.warn('Failed to retrieve model file from IndexedDB:', err)
    return null
  }
}
