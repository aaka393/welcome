import { CachedSegment } from '../types/video';

const STORAGE_KEY = 'puja_segments_cache';
const URL_INDEX_KEY = 'puja_segments_url_index';
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// IndexedDB configuration for video blobs
const IDB_DB_NAME = 'pujaCacheDB';
const IDB_STORE_NAME = 'segments';

export const storageService = {
  // IndexedDB helpers
  async getDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(IDB_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async idbSet(key: string, value: unknown): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      tx.objectStore(IDB_STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async idbGet<T = unknown>(key: string): Promise<T | undefined> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const req = tx.objectStore(IDB_STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  },

  async idbDelete(key: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      tx.objectStore(IDB_STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  async getCachedSegment(segmentId: string): Promise<CachedSegment | null> {
    try {
      const cached = localStorage.getItem(`${STORAGE_KEY}_${segmentId}`);
      if (!cached) return null;

      const data = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - data.cachedAt > MAX_CACHE_AGE) {
        this.removeCachedSegment(segmentId);
        return null;
      }

      let blob: Blob | null = null;
      if (data.isIdb) {
        // Retrieve from IndexedDB
        const idbRecord = await this.idbGet<{ blob: Blob; mimeType: string; cachedAt: number }>(segmentId);
        if (!idbRecord) return null;
        blob = idbRecord.blob instanceof Blob ? idbRecord.blob : new Blob([idbRecord.blob], { type: idbRecord.mimeType });
      } else if (data.blobData) {
        // Convert base64 back to blob
        const binaryString = atob(data.blobData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: data.mimeType });
      } else {
        return null;
      }

      return {
        id: data.id,
        blob: blob,
        url: URL.createObjectURL(blob),
        cachedAt: data.cachedAt,
        sourceUrl: data.sourceUrl,
        sourceUrlIdentity: data.sourceUrlIdentity,
      };
    } catch (error) {
      console.error('Error retrieving cached segment:', error);
      return null;
    }
  },

  async setCachedSegment(segmentId: string, blob: Blob, sourceUrl?: string, sourceUrlIdentity?: string): Promise<void> {
    try {
      // Check if segment is already cached to avoid overwriting
      const existingCache = await this.getCachedSegment(segmentId);
      if (existingCache) {
        console.log(`Segment ${segmentId} already cached, skipping download`);
        return;
      }

      const cacheData: {
        id: string;
        mimeType: string;
        cachedAt: number;
        sourceUrl?: string;
        sourceUrlIdentity?: string;
        isIdb?: boolean;
        blobData?: string;
      } = {
        id: segmentId,
        mimeType: blob.type,
        cachedAt: Date.now(),
        sourceUrl,
        sourceUrlIdentity,
      };

      // Always store video data in IndexedDB
      await this.idbSet(segmentId, { blob, mimeType: blob.type, cachedAt: cacheData.cachedAt });
      cacheData.isIdb = true;

      try {
        localStorage.setItem(`${STORAGE_KEY}_${segmentId}`, JSON.stringify(cacheData));
      } catch (err: unknown) {
        // Handle QuotaExceededError without crashing the app
        const name = (err as { name?: string } | null | undefined)?.name || '';
        if (name.includes('Quota') || name.includes('DOMException')) {
          console.warn('Storage quota exceeded. Continuing without caching this segment.');
          return;
        }
        throw err;
      }
      console.log(`Segment ${segmentId} cached successfully (IndexedDB)`);
    } catch (error) {
      console.error('Error caching segment:', error);
      // Don't throw to avoid breaking playback; caching is a best-effort feature
    }
  },

  // Keep an optional index of last seen URL identity for each segmentId
  getUrlIdentity(segmentId: string): string | null {
    try {
      const indexRaw = localStorage.getItem(URL_INDEX_KEY);
      if (!indexRaw) return null;
      const index = JSON.parse(indexRaw) as Record<string, string>;
      return index[segmentId] ?? null;
    } catch {
      return null;
    }
  },

  setUrlIdentity(segmentId: string, identity: string): void {
    try {
      const indexRaw = localStorage.getItem(URL_INDEX_KEY);
      const index = (indexRaw ? JSON.parse(indexRaw) : {}) as Record<string, string>;
      index[segmentId] = identity;
      localStorage.setItem(URL_INDEX_KEY, JSON.stringify(index));
    } catch (err) {
      console.warn('Failed to persist URL identity index:', err);
    }
  },

  removeCachedSegment(segmentId: string): void {
    try {
      const metaRaw = localStorage.getItem(`${STORAGE_KEY}_${segmentId}`);
      const meta = metaRaw ? JSON.parse(metaRaw) : null;
      if (meta?.isIdb) {
        // Best-effort deletion from IDB
        this.idbDelete(segmentId).catch(() => {});
      }
    } catch {
      // ignore parse errors and proceed with removing localStorage item
    }
    localStorage.removeItem(`${STORAGE_KEY}_${segmentId}`);
  },

  clearAllCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEY)) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem(URL_INDEX_KEY);
    // Clear IndexedDB entries as well
    this.getDb().then(db => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      tx.objectStore(IDB_STORE_NAME).clear();
    }).catch(() => {});
  },

  getCacheSize(): number {
    const keys = Object.keys(localStorage);
    let totalSize = 0;
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEY)) {
        totalSize += localStorage.getItem(key)?.length || 0;
      }
    });
    return totalSize;
  }
};