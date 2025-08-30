import React, { useState } from 'react';
import type { PujaSegment } from '../../types/video';
import { Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw } from 'lucide-react';

interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  volume: number;
  isMuted: boolean;
  currentSegment: PujaSegment | undefined;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  currentTime,
  totalDuration,
  volume,
  isMuted,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  currentSegment
}) => {
  const [showControls, setShowControls] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPreview, setScrubPreview] = useState<number | null>(null);
  // Timeline scrubber hidden per requirement

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSkip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(totalDuration, currentTime + seconds));
    console.log('[Controls] Skip', seconds > 0 ? '+10s' : '-10s', {
      fromTime: currentTime,
      toTime: newTime,
      segment: currentSegment ? { id: currentSegment.id, order: currentSegment.order, title: currentSegment.title, url: currentSegment.url, duration: currentSegment.duration } : null
    });
    onSeek(newTime);
  };

  return (
    <div 
      className={`absolute inset-0 bg-gradient-to-t from-orange-900/90 via-transparent to-red-900/50 flex flex-col justify-between transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={() => setShowControls(!showControls)}
    >
      {/* Top Controls */}
      <div className="p-4 flex justify-between items-center">
        <div className="text-orange-100 text-sm font-medium">
          {formatTime(isScrubbing && scrubPreview !== null ? scrubPreview : currentTime)} / {formatTime(totalDuration)}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log('[Controls] Toggle Mute', {
              mutedBefore: isMuted,
              segment: currentSegment ? { id: currentSegment.id, order: currentSegment.order, title: currentSegment.title } : null
            });
            onMuteToggle();
          }}
          className="text-orange-100 p-2 hover:bg-orange-500/30 rounded-full transition-colors"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* Center Play/Pause Button */}
      <div className="flex justify-center items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log('[Controls] Play/Pause clicked', {
              wasPlaying: isPlaying,
              currentTime,
              segment: currentSegment ? { id: currentSegment.id, order: currentSegment.order, title: currentSegment.title } : null
            });
            onPlayPause();
          }}
          className="bg-orange-500/30 backdrop-blur-sm text-orange-100 p-4 rounded-full hover:bg-orange-500/50 transition-colors sacred-glow"
        >
          {isPlaying ? <Pause size={32} /> : <Play size={32} />}
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="p-4 space-y-4">
        {/* Cumulative Timeline Scrubber */}
        <div className="w-full">
          <input
            type="range"
            min={0}
            max={Math.max(0, Math.floor(totalDuration))}
            step={0.1}
            value={isScrubbing && scrubPreview !== null ? scrubPreview : currentTime}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsScrubbing(true);
              setScrubPreview(currentTime);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              setIsScrubbing(true);
              setScrubPreview(currentTime);
            }}
            onInput={(e) => {
              e.stopPropagation();
              const val = parseFloat((e.target as HTMLInputElement).value);
              setScrubPreview(val);
              console.log('[Controls] Scrub preview', {
                toTime: val,
                totalDuration,
                segment: currentSegment ? { id: currentSegment.id, order: currentSegment.order, title: currentSegment.title } : null
              });
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              const commitVal = scrubPreview ?? currentTime;
              setIsScrubbing(false);
              setScrubPreview(null);
              console.log('[Controls] Scrub commit', {
                toTime: commitVal,
                totalDuration,
                segment: currentSegment ? { id: currentSegment.id, order: currentSegment.order, title: currentSegment.title } : null
              });
              onSeek(commitVal);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              const commitVal = scrubPreview ?? currentTime;
              setIsScrubbing(false);
              setScrubPreview(null);
              console.log('[Controls] Scrub commit', {
                toTime: commitVal,
                totalDuration,
                segment: currentSegment ? { id: currentSegment.id, order: currentSegment.order, title: currentSegment.title } : null
              });
              onSeek(commitVal);
            }}
            className="w-full h-2 bg-orange-200/30 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #fb923c 0%, #dc2626 ${((isScrubbing && scrubPreview !== null ? scrubPreview : currentTime) / Math.max(1, totalDuration)) * 100}%, rgba(251,146,60,0.3) ${((isScrubbing && scrubPreview !== null ? scrubPreview : currentTime) / Math.max(1, totalDuration)) * 100}%, rgba(251,146,60,0.3) 100%)`
            }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSkip(-10);
            }}
            className="text-orange-100 p-3 hover:bg-orange-500/30 rounded-full transition-colors flex items-center space-x-1"
          >
            <RotateCcw size={20} />
            <span className="text-xs">10s</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSkip(10);
            }}
            className="text-orange-100 p-3 hover:bg-orange-500/30 rounded-full transition-colors flex items-center space-x-1"
          >
            <RotateCw size={20} />
            <span className="text-xs">10s</span>
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-3">
          <Volume2 size={16} className="text-orange-100" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => {
              const newVol = parseFloat(e.target.value);
              console.log('[Controls] Volume change', {
                from: volume,
                to: newVol,
                muted: isMuted,
                segment: currentSegment ? { id: currentSegment.id, order: currentSegment.order, title: currentSegment.title } : null
              });
              onVolumeChange(newVol);
            }}
            className="flex-1 h-2 bg-orange-200/30 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #fb923c 0%, #dc2626 ${volume * 100}%, rgba(251,146,60,0.3) ${volume * 100}%, rgba(251,146,60,0.3) 100%)`
            }}
          />
        </div>
      </div>
    </div>
  );
};