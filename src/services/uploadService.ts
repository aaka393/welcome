/* eslint-disable @typescript-eslint/no-explicit-any */
// services/uploadService.ts
import axios, { AxiosProgressEvent, AxiosResponse } from 'axios';
import { serviceBaseUrl } from '../constants/appConstants';

interface UploadApiResponse {
  code: number; // 3022 success, 3021 none uploaded, 3023 failed
  message: string;
  result: string[]; // array of unique file identifiers (filenames/IDs)
}

const buildFormData = (files: File[]): FormData => {
  const fd = new FormData();
  files.forEach((file) => {
    // FastAPI expects `files` field as List[UploadFile]
    fd.append('files', file, file.name);
  });
  return fd;
};

export const uploadService = {
  // Upload a single audio file; returns uniqueId string
  uploadAudio: async (
    file: File,
    opts?: { onProgress?: (percent: number) => void }
  ): Promise<string> => {
    const ids = await uploadService.uploadAudios([file], opts);
    return ids[0];
  },

  // Upload multiple audio files; returns list of uniqueIds in same order
  uploadAudios: async (
    files: File[],
    opts?: { onProgress?: (percent: number) => void }
  ): Promise<string[]> => {
    if (!files || files.length === 0) {
      throw new Error('No files provided for upload');
    }

    const formData = buildFormData(files);

    try {
      const res: AxiosResponse<UploadApiResponse> = await axios.post(
        `${serviceBaseUrl}/upload-files`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            accept: 'application/json',
          },
          timeout: 60_000, // allow longer uploads
          onUploadProgress: (evt: AxiosProgressEvent) => {
            if (!opts?.onProgress || !evt.total) return;
            const pct = Math.round(((evt.loaded || 0) / evt.total) * 100);
            opts.onProgress(pct);
          },
        }
      );

      const { code, result, message } = res.data as UploadApiResponse;

      if (code === 3022 && Array.isArray(result) && result.length > 0) {
        return result.map((r: any) => r.outputFileName);
      }

      if (code === 3021) {
        throw new Error('No files were uploaded successfully.');
      }

      throw new Error(message || 'Upload failed');
    } catch (err: any) {
      // Normalize error message
      const detail = err?.response?.data?.message || err?.message || 'Upload failed';
      throw new Error(detail);
    }
  },
};

export type { UploadApiResponse };
