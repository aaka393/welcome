export interface MediaSegment {
  mediaType: string; // "audio" or "video"
  url?: string; // URL to the media file from static folder on server
  durationSeconds?: number;
  sequenceOrder?: number;
  // Optional personalization flag (supports both spellings)
  isPersonalised?: boolean;
}

export interface PujaPlaybackResponse {
  id: string; // puja playback id from db
  bookingId: string;
  pujaType: string;
  segments: MediaSegment[];
}

export interface PujaSegment {
  id: string;
  url: string;
  order: number;
  duration: number;
  title?: string;
}

export interface VideoPlayerState {
  segments: PujaSegment[];
  currentSegmentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  isLoading: boolean;
  downloadProgress: number;
  error: string | null;
  volume: number;
  isMuted: boolean;
}

export interface CachedSegment {
  id: string;
  blob: Blob;
  url: string;
  cachedAt: number;
  // Original source URL used to download/cache this segment (may include query params)
  sourceUrl?: string;
  // Normalized identity of the URL (e.g., without query params) to detect same content despite new signatures
  sourceUrlIdentity?: string;
}