import { create } from 'zustand';
import { VideoPlayerState, CachedSegment, PujaPlaybackResponse } from '../types/video';
import { videoService } from '../services/videoService';
import { useBookingStore } from './bookingStore';
import { storageService } from '../services/storageService';

interface VideoStore extends VideoPlayerState {
  cachedSegments: CachedSegment[];
  pujaPlaybackData: PujaPlaybackResponse | null;
  hasAttemptedDownload: boolean;
  
  // Actions
  loadPujaSegments: (pujaId?: string) => Promise<void>;
  loadFromPlaybackData: (data: PujaPlaybackResponse) => Promise<void>;
  downloadAndCacheSegments: () => Promise<void>;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentSegmentIndex: (index: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  seekToTime: (time: number) => void;
  resetPlayer: () => void;
}

export const useVideoStore = create<VideoStore>((set, get) => ({
  // Initial state
  segments: [],
  cachedSegments: [],
  pujaPlaybackData: null,
  hasAttemptedDownload: false,
  currentSegmentIndex: 0,
  isPlaying: false,
  currentTime: 0,
  totalDuration: 0,
  isLoading: false,
  downloadProgress: 0,
  error: null,
  volume: 1,
  isMuted: false,

  // Actions
  loadPujaSegments: async (pujaId?: string) => {
    set({ isLoading: true, error: null });
    try {
      // Prefer bookingId from booking store when not explicitly provided
      const bookingId = pujaId || useBookingStore.getState().bookingId || '';
      if (!bookingId) throw new Error('No booking found. Please create or select a booking first.');

      // Get full playback data first
      const playbackData = await videoService.getPujaPlayback(bookingId);
      const segments = await videoService.getPujaSegments(bookingId);
      const sortedSegments = segments.sort((a, b) => a.order - b.order);
      const totalDuration = sortedSegments.reduce((sum, segment) => sum + segment.duration, 0);
      
      set({ 
        pujaPlaybackData: playbackData,
        segments: sortedSegments, 
        totalDuration,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load puja segments',
        isLoading: false 
      });
    }
  },

  // Load segments directly from a provided playback data object (no API calls)
  loadFromPlaybackData: async (playbackData: PujaPlaybackResponse) => {
    set({ isLoading: true, error: null });
    try {
      const segments = playbackData.segments
        .filter((s) => s.mediaType === 'video' && s.url)
        .sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0))
        .map((s, idx) => ({
          id: `${playbackData.id}-segment-${s.sequenceOrder || idx + 1}`,
          url: s.url!,
          order: s.sequenceOrder || idx + 1,
          duration: s.durationSeconds || 0,
          title: `${playbackData.pujaType} - Part ${s.sequenceOrder || idx + 1}`,
        }));

      const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);

      set({
        pujaPlaybackData: playbackData,
        segments,
        cachedSegments: [],
        totalDuration,
        isLoading: false,
        error: null,
        currentSegmentIndex: 0,
        currentTime: 0,
        isPlaying: false,
        downloadProgress: 0,
        hasAttemptedDownload: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load playback data',
        isLoading: false,
      });
    }
  },

  downloadAndCacheSegments: async () => {
    const { segments } = get();
    if (segments.length === 0) return;

    console.log('Starting download process for segments:', segments.length);

    // Check if all segments are already cached
    const allCachedSegments: CachedSegment[] = [];
    let allAlreadyCached = true;
    
    const normalizeIdentity = (url: string) => {
      try {
        const u = new URL(url);
        // Strip query to avoid re-downloads when only signatures change
        return `${u.origin}${u.pathname}`;
      } catch {
        // Fallback: strip query manually
        return url.split('?')[0];
      }
    };

    for (const segment of segments) {
      console.log(`Checking cache for segment: ${segment.id}`);
      const cachedSegment = await storageService.getCachedSegment(segment.id);
      const identity = normalizeIdentity(segment.url);
      const storedIdentity = storageService.getUrlIdentity(segment.id);
      if (cachedSegment) {
        // If we have a cached segment, ensure its identity matches current URL
        if (
          cachedSegment.sourceUrlIdentity &&
          cachedSegment.sourceUrlIdentity === identity
        ) {
          console.log(`Found cached segment with matching URL: ${segment.id}`);
          allCachedSegments.push(cachedSegment);
          // Keep index updated
          if (storedIdentity !== identity) storageService.setUrlIdentity(segment.id, identity);
        } else if (!cachedSegment.sourceUrlIdentity && storedIdentity && storedIdentity === identity) {
          // Backfill: legacy cache without identity but index matches
          console.log(`Using legacy cached segment with matching stored identity: ${segment.id}`);
          allCachedSegments.push(cachedSegment);
        } else {
          console.log(`Cached segment exists but URL changed, will re-download: ${segment.id}`);
          allAlreadyCached = false;
          break;
        }
      } else {
        console.log(`Segment not cached: ${segment.id}`);
        allAlreadyCached = false;
        break;
      }
    }
    
    // If all segments are already cached, order them as per metadata and use them (do not auto-start)
    if (allAlreadyCached && allCachedSegments.length === segments.length) {
      console.log('All segments already cached, preparing playback');
      // Order cached segments to strictly match the segments (metadata) order
      const orderedCached = segments
        .map(s => allCachedSegments.find(cs => cs.id === s.id))
        .filter((x): x is CachedSegment => Boolean(x));
      set({ 
        cachedSegments: orderedCached,
        isLoading: false,
        downloadProgress: 100
      });
      return;
    }
  set({ isLoading: true, downloadProgress: 0, hasAttemptedDownload: true });
    console.log('Starting download and cache process');
    const cachedSegments: CachedSegment[] = [];

    try {
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        console.log(`Processing segment ${i + 1}/${segments.length}: ${segment.url}`);
        
        // Check if already cached
        let cachedSegment = await storageService.getCachedSegment(segment.id);
        const identity = normalizeIdentity(segment.url);
        const storedIdentity = storageService.getUrlIdentity(segment.id);
        
        const hasMatchingCache =
          cachedSegment &&
          ((cachedSegment.sourceUrlIdentity && cachedSegment.sourceUrlIdentity === identity) ||
            (!cachedSegment.sourceUrlIdentity && storedIdentity === identity));

        if (!cachedSegment || !hasMatchingCache) {
          console.log(`Downloading segment: ${segment.url}`);
          // Download and cache
          const blob = await videoService.downloadSegment(segment.url);
          console.log(`Downloaded segment ${segment.id}, size: ${blob.size} bytes`);
          await storageService.setCachedSegment(segment.id, blob, segment.url, identity);
          storageService.setUrlIdentity(segment.id, identity);
          console.log(`Cached segment: ${segment.id}`);
          cachedSegment = {
            id: segment.id,
            blob,
            url: URL.createObjectURL(blob),
            cachedAt: Date.now(),
            sourceUrl: segment.url,
            sourceUrlIdentity: identity,
          };
        } else {
          console.log(`Using cached segment: ${segment.id}`);
          // keep index synced for legacy entries
          if (!storedIdentity) storageService.setUrlIdentity(segment.id, identity);
        }

        cachedSegments.push(cachedSegment);
        
        // Update progress
        const progress = ((i + 1) / segments.length) * 100;
        console.log(`Progress: ${progress}%`);
        set({ downloadProgress: progress });
      }

      console.log('All segments processed, ready to play');
      // Ensure cached segments are aligned to the metadata order just in case
      const orderedCached = segments
        .map(s => cachedSegments.find(cs => cs.id === s.id) || cachedSegments.find(cs => cs.id === s.id))
        .filter((x): x is CachedSegment => Boolean(x));
      set({ 
        cachedSegments: orderedCached.length === segments.length ? orderedCached : cachedSegments,
        isLoading: false,
        downloadProgress: 100
      });
    } catch (error) {
      console.error('Error during download/cache process:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to download segments',
        isLoading: false 
      });
    }
  },

  setCurrentTime: (time: number) => set({ currentTime: time }),
  
  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),
  
  setCurrentSegmentIndex: (index: number) => set({ currentSegmentIndex: index }),
  
  setVolume: (volume: number) => set({ volume }),
  
  setMuted: (muted: boolean) => set({ isMuted: muted }),

  seekToTime: (targetTime: number) => {
    const { segments } = get();
    let accumulatedTime = 0;
    
    for (let i = 0; i < segments.length; i++) {
      if (targetTime <= accumulatedTime + segments[i].duration) {
        const segmentTime = targetTime - accumulatedTime;
        set({ 
          currentSegmentIndex: i,
          currentTime: targetTime
        });
        return { segmentIndex: i, segmentTime };
      }
      accumulatedTime += segments[i].duration;
    }
    
    // If time is beyond total duration, go to last segment
    set({ 
      currentSegmentIndex: segments.length - 1,
      currentTime: targetTime
    });
    return { segmentIndex: segments.length - 1, segmentTime: segments[segments.length - 1]?.duration || 0 };
  },

  resetPlayer: () => set({
    currentSegmentIndex: 0,
    isPlaying: false,
    currentTime: 0,
    error: null
  })
}));