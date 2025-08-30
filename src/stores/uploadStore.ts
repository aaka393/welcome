/* eslint-disable @typescript-eslint/no-explicit-any */
// stores/uploadStore.ts
import { create } from 'zustand';
import { uploadService } from '../services/uploadService';

export interface UploadItem {
  file: File;
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress?: number; // 0-100 upload progress
  uniqueId?: string; // returned by API
  error?: string | null;
}

interface UploadStoreState {
  isUploading: boolean;
  error: string | null;
  uploads: UploadItem[];
  lastUploadedIds: string[];

  // Actions
  clear: () => void;
  uploadAudio: (file: File) => Promise<string>;
  uploadAudios: (files: File[]) => Promise<string[]>;
}

export const useUploadStore = create<UploadStoreState>((set, get) => ({
  isUploading: false,
  error: null,
  uploads: [],
  lastUploadedIds: [],

  clear: () => set({ isUploading: false, error: null, uploads: [], lastUploadedIds: [] }),

  uploadAudio: async (file: File) => {
    set({ isUploading: true, error: null });
    try {
      // Track item locally
      const current = get().uploads;
      const item = { file, status: 'uploading' as const };
      set({ uploads: [...current, item] });

      const id = await uploadService.uploadAudio(file, {
        onProgress: (p) => {
          const updatedProgress = get().uploads.map((u) =>
            u.file === file ? { ...u, progress: p } : u
          );
          set({ uploads: updatedProgress });
        },
      });

      // Mark success
      const updated = get().uploads.map((u) =>
        u.file === file ? { ...u, status: 'success' as const, uniqueId: id } : u
      );
      set({ uploads: updated, lastUploadedIds: [id], isUploading: false });
      return id;
    } catch (err: any) {
      const message = err?.message || 'Failed to upload file';
      const updated = get().uploads.map((u) =>
        u.file === file ? { ...u, status: 'error' as const, error: message } : u
      );
      set({ error: message, uploads: updated, isUploading: false });
      throw new Error(message);
    }
  },

  uploadAudios: async (files: File[]) => {
    if (!files || files.length === 0) return [];
    set({ isUploading: true, error: null });
    try {
      // seed upload list
      const items: UploadItem[] = files.map((f) => ({ file: f, status: 'uploading' }));
      set({ uploads: [...get().uploads, ...items] });

      const ids = await uploadService.uploadAudios(files, {
        onProgress: (p) => {
          const updatedProgress = get().uploads.map((u) =>
            files.includes(u.file) ? { ...u, progress: p } : u
          );
          set({ uploads: updatedProgress });
        },
      });

      // Map ids to files in order
      const updated = get().uploads.map((u) => {
        const idMatchIdx = files.indexOf(u.file);
        if (idMatchIdx !== -1) {
          return { ...u, status: 'success' as const, uniqueId: ids[idMatchIdx] };
        }
        return u;
      });
      set({ uploads: updated, lastUploadedIds: ids, isUploading: false });
      return ids;
    } catch (err: any) {
      const message = err?.message || 'Failed to upload files';
      // mark all new ones as error
      const updated = get().uploads.map((u) =>
        files.includes(u.file) ? { ...u, status: 'error' as const, error: message } : u
      );
      set({ error: message, uploads: updated, isUploading: false });
      throw new Error(message);
    }
  },
}));

export default useUploadStore;
