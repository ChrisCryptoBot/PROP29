/**
 * useHandoverDraft Hook
 * 
 * Custom hook for draft persistence using IndexedDB.
 * Strategic feature: Draft resilience - protects data during connectivity drops.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../../../services/logger';
import { DB_CONFIG, DRAFT_AUTO_SAVE_INTERVAL } from '../utils/constants';
import type { CreateHandoverRequest } from '../types';

export interface DraftData extends Partial<CreateHandoverRequest> {
  lastSaved: string; // ISO datetime string
  handoverId?: string; // If editing existing handover
}

export interface UseHandoverDraftReturn {
  // Data
  draft: DraftData | null;
  hasDraft: boolean;
  
  // Operations
  saveDraft: (data: Partial<CreateHandoverRequest>, handoverId?: string) => Promise<void>;
  loadDraft: () => Promise<DraftData | null>;
  clearDraft: () => Promise<void>;
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
}

/**
 * IndexedDB helper functions
 */
class DraftDB {
  private dbName = DB_CONFIG.name;
  private dbVersion = DB_CONFIG.version;
  private storeName = DB_CONFIG.storeName;
  private db: IDBDatabase | null = null;

  /**
   * Open IndexedDB database
   */
  async open(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Save draft to IndexedDB
   */
  async save(key: string, data: DraftData): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ id: key, ...data });

      request.onerror = () => {
        reject(new Error('Failed to save draft'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Load draft from IndexedDB
   */
  async load(key: string): Promise<DraftData | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => {
        reject(new Error('Failed to load draft'));
      };

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { id, ...draftData } = result;
          resolve(draftData as DraftData);
        } else {
          resolve(null);
        }
      };
    });
  }

  /**
   * Delete draft from IndexedDB
   */
  async delete(key: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => {
        reject(new Error('Failed to delete draft'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

const draftDB = new DraftDB();
const DRAFT_KEY = 'handover-draft';

/**
 * Hook for managing handover drafts with IndexedDB persistence
 */
export function useHandoverDraft(): UseHandoverDraftReturn {
  // State
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedDataRef = useRef<Partial<CreateHandoverRequest> | null>(null);

  /**
   * Load draft from IndexedDB on mount
   */
  useEffect(() => {
    const loadDraftOnMount = async () => {
      try {
        const loadedDraft = await draftDB.load(DRAFT_KEY);
        if (loadedDraft) {
          setDraft(loadedDraft);
        }
      } catch (error) {
        logger.error('Failed to load draft on mount', error instanceof Error ? error : new Error(String(error)), {
          module: 'useHandoverDraft',
          action: 'loadDraftOnMount',
        });
      }
    };

    loadDraftOnMount();

    // Cleanup: close DB connection on unmount
    return () => {
      draftDB.close();
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  /**
   * Save draft to IndexedDB
   */
  const saveDraft = useCallback(async (data: Partial<CreateHandoverRequest>, handoverId?: string): Promise<void> => {
    try {
      const draftData: DraftData = {
        ...data,
        lastSaved: new Date().toISOString(),
        handoverId,
      };

      await draftDB.save(DRAFT_KEY, draftData);
      setDraft(draftData);
      lastSavedDataRef.current = data;

      logger.debug('Draft saved successfully', {
        module: 'useHandoverDraft',
        action: 'saveDraft',
        handoverId,
      });
    } catch (error) {
      logger.error('Failed to save draft', error instanceof Error ? error : new Error(String(error)), {
        module: 'useHandoverDraft',
        action: 'saveDraft',
      });
      // Don't throw - draft saving should be non-blocking
    }
  }, []);

  /**
   * Auto-save draft with debouncing
   */
  const autoSaveDraft = useCallback((data: Partial<CreateHandoverRequest>, handoverId?: string) => {
    if (!autoSaveEnabled) {
      return;
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft(data, handoverId);
    }, DRAFT_AUTO_SAVE_INTERVAL);
  }, [autoSaveEnabled, saveDraft]);

  /**
   * Load draft from IndexedDB
   */
  const loadDraft = useCallback(async (): Promise<DraftData | null> => {
    try {
      const loadedDraft = await draftDB.load(DRAFT_KEY);
      if (loadedDraft) {
        setDraft(loadedDraft);
      }
      return loadedDraft;
    } catch (error) {
      logger.error('Failed to load draft', error instanceof Error ? error : new Error(String(error)), {
        module: 'useHandoverDraft',
        action: 'loadDraft',
      });
      return null;
    }
  }, []);

  /**
   * Clear draft from IndexedDB
   */
  const clearDraft = useCallback(async (): Promise<void> => {
    try {
      await draftDB.delete(DRAFT_KEY);
      setDraft(null);
      lastSavedDataRef.current = null;

      // Clear auto-save timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }

      logger.debug('Draft cleared successfully', {
        module: 'useHandoverDraft',
        action: 'clearDraft',
      });
    } catch (error) {
      logger.error('Failed to clear draft', error instanceof Error ? error : new Error(String(error)), {
        module: 'useHandoverDraft',
        action: 'clearDraft',
      });
    }
  }, []);

  return {
    // Data
    draft,
    hasDraft: draft !== null,
    
    // Operations
    saveDraft,
    loadDraft,
    clearDraft,
    autoSaveEnabled,
    setAutoSaveEnabled,
  };
}
