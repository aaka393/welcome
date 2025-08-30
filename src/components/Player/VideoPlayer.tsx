import React, { useRef, useEffect, useState } from 'react';
import { useVideoStore } from '../../stores/videoStore';
import { VideoControls } from './VideoControls';
import { LoadingScreen } from './LoadingScreen';

export const VideoPlayer: React.FC<{ autoLoadFromApi?: boolean }> = ({ autoLoadFromApi = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  // const [hasUserStarted, setHasUserStarted] = useState(false);
  // Measured durations per segment from the video element (fallback to metadata when unknown)
  const [measuredDurations, setMeasuredDurations] = useState<Array<number | null>>([]);
  // Track a pending seek that spans segment switches
  const pendingSeekRef = useRef<{ segmentIndex: number; segmentTime: number; resume: boolean } | null>(null);
  
  const {
    segments,
    cachedSegments,
    currentSegmentIndex,
    isPlaying,
    currentTime,
    totalDuration,
    isLoading,
    error,
    volume,
    isMuted,
    setCurrentTime,
    setIsPlaying,
    setCurrentSegmentIndex,
    loadPujaSegments,
    downloadAndCacheSegments
  } = useVideoStore();
  const hasAttemptedRef = useRef(false);

  // Initialize puja segments on component mount (only when instructed)
  useEffect(() => {
    if (autoLoadFromApi) {
      loadPujaSegments();
    }
  }, [loadPujaSegments, autoLoadFromApi]);

  // Reset measured durations when segment list changes
  useEffect(() => {
    if (segments.length > 0) {
      setMeasuredDurations(Array(segments.length).fill(null));
    } else {
      setMeasuredDurations([]);
    }
  }, [segments.length]);

  // Download segments when they're loaded
  useEffect(() => {
    if (error) return; // Don't loop downloads on error
    if (segments.length > 0 && cachedSegments.length === 0 && !isLoading && !hasAttemptedRef.current) {
      hasAttemptedRef.current = true;
      downloadAndCacheSegments();
    }
  }, [segments, cachedSegments.length, isLoading, error, downloadAndCacheSegments]);

  // Set video source when cached segments are ready
  useEffect(() => {
    console.log('VideoPlayer: Cached segments updated', cachedSegments.length);
    if (videoRef.current && cachedSegments.length > 0) {
      const currentCachedSegment = cachedSegments[currentSegmentIndex];
      if (currentCachedSegment) {
        console.log('Setting video source:', currentCachedSegment.url);
        // Reset readiness before switching src
        setIsVideoReady(false);
        videoRef.current.src = currentCachedSegment.url;
        try {
          // Reload the element to ensure it picks up the new source
          videoRef.current.load();
        } catch (e) {
          console.warn('video.load() failed:', e);
        }
      }
    }
  }, [cachedSegments, currentSegmentIndex]);

  // Handle video playback
  useEffect(() => {
    console.log('VideoPlayer: Playback state changed', { isPlaying, isVideoReady });
    if (videoRef.current && isVideoReady) {
      const attemptPlay = async () => {
        if (!videoRef.current) return;
        try {
          await videoRef.current.play();
        } catch (err) {
          console.error('Playback start error:', err);
        }
      };

      if (isPlaying) {
        console.log('Starting video playback');
        attemptPlay();
      } else {
        console.log('Pausing video playback');
        videoRef.current.pause();
      }
    }
  }, [isPlaying, isVideoReady]);

  // Handle volume changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Helper to log current segment info
  const logSeg = (label: string) => {
    const seg = segments[currentSegmentIndex];
    console.log(label, seg ? { id: seg.id, order: seg.order, title: seg.title, url: seg.url, duration: seg.duration, index: currentSegmentIndex } : null);
  };

  // Direct play/pause handler to keep it within user gesture
  const handlePlayPauseClick = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      console.log('[Player] Pause requested');
      video.pause();
      setIsPlaying(false);
      logSeg('[Player] Paused segment');
      return;
    }
    console.log('[Player] Play requested');
    try {
      await video.play();
      setIsPlaying(true);
      logSeg('[Player] Playing segment');
    } catch (err) {
      console.error('[Player] play() error:', err);
    }
  };

  // Handle time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const videoCurrentTime = videoRef.current.currentTime;
      const segmentStartTime = segments.slice(0, currentSegmentIndex)
        .reduce((sum, segment, idx) => {
          const md = measuredDurations[idx];
          const dur = (md ?? 0) > 0 ? (md as number) : segment.duration;
          return sum + dur;
        }, 0);
      const globalTime = segmentStartTime + videoCurrentTime;
      setCurrentTime(globalTime);
    }
  };

  // Handle segment end - move to next segment
  const handleVideoEnd = () => {
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      // Continue playback across segment boundaries if already playing
      if (isPlaying) {
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch((e) => console.error(e));
          }
        }, 0);
      }
    } else {
      setIsPlaying(false);
      setCurrentTime(totalDuration);
    }
  };

  // Handle seeking within segments
  const handleSeek = (targetTime: number) => {
    // Remember the prior playback state to resume if needed
    const wasPlaying = isPlaying;
    let accumulatedTime = 0;
    
    for (let i = 0; i < segments.length; i++) {
      const md = measuredDurations[i];
      const segDuration = (md ?? 0) > 0 ? (md as number) : segments[i].duration;
      if (targetTime <= accumulatedTime + segDuration) {
        // Clamp to just before the absolute segment end to avoid firing 'ended' immediately
        const rawSegTime = targetTime - accumulatedTime;
        const segmentTime = Math.max(0, Math.min(segDuration - 0.05, rawSegTime));

        if (i === currentSegmentIndex) {
          // Same segment seek
          const v = videoRef.current;
          if (v) {
            const applySeek = () => {
              v.currentTime = segmentTime;
              setCurrentTime(targetTime);
              if (wasPlaying) {
                setIsPlaying(true);
                v.play().catch((e) => console.error(e));
              }
            };
            if (v.readyState >= 1 /* HAVE_METADATA */) {
              applySeek();
            } else {
              const onMeta = () => {
                v.removeEventListener('loadedmetadata', onMeta);
                applySeek();
              };
              v.addEventListener('loadedmetadata', onMeta, { once: true });
            }
          }
        } else {
          // Cross-segment seek: remember and switch
          pendingSeekRef.current = { segmentIndex: i, segmentTime, resume: wasPlaying };
          setCurrentSegmentIndex(i);
        }
        return;
      }
      accumulatedTime += segDuration;
    }

    // If time beyond total duration, go to last segment near end
    if (segments.length > 0) {
      const lastIndex = segments.length - 1;
      const md = measuredDurations[lastIndex];
      const segDuration = (md ?? 0) > 0 ? (md as number) : segments[lastIndex].duration;
      const segmentTime = Math.max(0, segDuration - 0.05);
      pendingSeekRef.current = { segmentIndex: lastIndex, segmentTime, resume: wasPlaying };
      setCurrentSegmentIndex(lastIndex);
      setCurrentTime(segments.reduce((s, _seg, idx) => s + ((measuredDurations[idx] ?? 0) > 0 ? (measuredDurations[idx] as number) : segments[idx].duration), 0));
    }
  };

  if (isLoading || cachedSegments.length === 0) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="text-center p-8">
          <div className="text-red-600 text-xl mb-4 font-semibold">Error Loading Video</div>
          <div className="text-orange-700">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 sacred-glow font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-gradient-to-br from-orange-900 via-red-900 to-yellow-900 flex flex-col">
      {/* Video Container - 9:16 aspect ratio */}
      <div className="relative flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-sm mx-auto" style={{ aspectRatio: '9/16' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover rounded-lg shadow-2xl sacred-glow"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnd}
            onLoadedData={() => { console.log('[Video] loadeddata'); setIsVideoReady(true); logSeg('[Video] loadeddata for segment'); }}
            onLoadedMetadata={() => { 
              console.log('[Video] loadedmetadata'); 
              const v = videoRef.current;
              if (v && Number.isFinite(v.duration) && v.duration > 0) {
                setMeasuredDurations(prev => {
                  const base = prev.length === segments.length ? prev : Array(segments.length).fill(null);
                  const next = [...base];
                  next[currentSegmentIndex] = v.duration;
                  return next;
                });
                console.log('[Video] measured duration (s):', v.duration, { index: currentSegmentIndex });
              }

              // If we have a pending cross-segment seek, apply it now
              const pending = pendingSeekRef.current;
              if (pending && pending.segmentIndex === currentSegmentIndex && v) {
                const segDur = (measuredDurations[currentSegmentIndex] ?? 0) > 0 ? (measuredDurations[currentSegmentIndex] as number) : (v.duration || 0);
                const clamped = Math.max(0, Math.min(segDur - 0.05, pending.segmentTime));
                v.currentTime = clamped;
                if (pending.resume || isPlaying) {
                  v.play().catch((e) => console.error(e));
                }
                pendingSeekRef.current = null;
              }
              logSeg('[Video] loadedmetadata for segment'); 
            }}
            onCanPlay={() => { console.log('[Video] canplay'); logSeg('[Video] canplay for segment'); }}
            onWaiting={() => { console.log('[Video] waiting'); logSeg('[Video] waiting for segment'); }}
            onPlay={() => { console.log('[Video] play event'); logSeg('[Video] play event for segment'); }}
            onPause={() => { console.log('[Video] pause event'); logSeg('[Video] pause event for segment'); }}
            onError={(e) => { console.error('[Video] error', e); logSeg('[Video] error for segment'); }}
            playsInline
            preload="metadata"
          />

          {/* Start Puja Overlay */}
          {/* {!hasUserStarted && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const seg = segments[currentSegmentIndex];
                  console.log('[Player] Start Puja clicked', seg ? { id: seg.id, order: seg.order, title: seg.title, url: seg.url, duration: seg.duration } : null);
                  setHasUserStarted(true);
                  setIsPlaying(true);
                }}
                className="bg-orange-600/90 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-orange-600 transition-colors sacred-glow backdrop-blur-sm mt-[100px]"
              >
                Start Puja
              </button>
            </div>
          )} */}
          
          {/* Video Controls Overlay */}
          <VideoControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            totalDuration={segments.reduce((sum, s, i) => {
              const md = measuredDurations[i];
              const dur = (md ?? 0) > 0 ? (md as number) : s.duration;
              return sum + dur;
            }, 0)}
            volume={volume}
            isMuted={isMuted}
            currentSegment={segments[currentSegmentIndex]}
            onPlayPause={handlePlayPauseClick}
            onSeek={handleSeek}
            onVolumeChange={(vol) => useVideoStore.getState().setVolume(vol)}
            onMuteToggle={() => useVideoStore.getState().setMuted(!isMuted)}
          />
        </div>
      </div>

      {/* Footer removed (segment count) */}
    </div>
  );
};