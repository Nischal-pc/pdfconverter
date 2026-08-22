/**
 * IndexedDB local storage helper to persist processed PDF files directly inside the browser memory.
 * This allows the user to open, preview, and re-download documents at any time.
 */

const DB_NAME = 'pdfflow_local_db';
const STORE_NAME = 'saved_documents';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Save a document blob or arrayBuffer into browser IndexedDB memory.
 */
export async function saveDocumentToBrowser(id, filename, fileData, mimeType = 'application/pdf') {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const entry = {
        id,
        filename,
        data: fileData,
        mimeType,
        savedAt: new Date().toISOString(),
      };
      const req = store.put(entry);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save to browser IndexedDB:', err);
    return false;
  }
}

/**
 * Retrieve a saved document from browser memory by id.
 */
export async function getDocumentFromBrowser(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to load from browser IndexedDB:', err);
    return null;
  }
}

/**
 * Open a saved document from browser memory directly in a new browser tab.
 */
export async function openDocumentFromBrowser(id) {
  const doc = await getDocumentFromBrowser(id);
  if (!doc || !doc.data) return false;
  const blob = new Blob([doc.data], { type: doc.mimeType || 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  return true;
}
