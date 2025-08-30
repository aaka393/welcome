import React from 'react';
import { Download } from 'lucide-react';
import { useVideoStore } from '../../stores/videoStore';

export const LoadingScreen: React.FC = () => {
  const { downloadProgress, segments, pujaPlaybackData, error } = useVideoStore();

  return (
    <div className="h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-red-100 flex items-center justify-center">
      <div className="text-center max-w-sm mx-auto px-6">
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full shadow-2xl sacred-glow float-animation overflow-hidden bg-white/10 backdrop-blur-sm">
            <img 
              src="/images/ai-pujari-logo.png" 
              alt="AI Pujari Logo" 
              className="w-full h-full object-contain p-2"
            />
          </div>
        </div>

        {/* Loading Title */}
        <h1 className="text-2xl font-bold gradient-text mb-2">
          Puja Player
        </h1>
        <p className="text-orange-700 mb-8 font-medium">
          Preparing your spiritual experience
        </p>

        {/* Loading States */}
        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
              <div className="font-semibold">Error:</div>
              <div className="text-sm">{error}</div>
            </div>
          )}

          {segments.length === 0 ? (
            <>
              {/* Fetching Segments */}
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                <span className="text-orange-800 font-medium">Loading puja segments...</span>
              </div>
            </>
          ) : (
            <>
              {/* Downloading Progress */}
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <Download size={20} className="text-orange-600" />
                  <span className="text-orange-800 font-medium">Downloading puja segments...</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-orange-200 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${downloadProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-orange-200/30 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                {/* Progress Text */}
                <div className="text-center">
                  <span className="text-2xl font-bold gradient-text">
                    {Math.round(downloadProgress)}%
                  </span>
                  <div className="text-sm text-orange-600 mt-1 font-medium">
                    {segments.length} video segments from {pujaPlaybackData?.pujaType || 'puja'} • Optimizing for smooth playback
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Loading Animation */}
          <div className="flex justify-center space-x-2 mt-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Features Info */}
        <div className="mt-12 text-xs text-orange-600 space-y-2 font-medium">
          <div>📱 Optimized for mobile portrait viewing</div>
          <div>💾 Smart caching for buffer-free playback</div>
          <div>🎛️ Seamless controls across all segments</div>
        </div>
      </div>
    </div>
  );
};