import React from 'react';
import { X } from 'lucide-react';

interface VideoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
}

const VideoDialog: React.FC<VideoDialogProps> = ({ isOpen, onClose, videoSrc }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-sm mx-2 mt-10 md:mt-1"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative bg-gray-900 rounded-[2.5rem] p-2 pt-10 pb-8 shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-2 right-4 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors z-20"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-5 bg-gray-800 rounded-full z-10"></div>
          <div className="relative w-full h-[370px] sm:w-72 sm:h-[640px] bg-black rounded-[1.5rem] overflow-hidden mx-auto">
            <video
              src={videoSrc}
              autoPlay
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gray-600 rounded-full"></div>
        </div>
        <div className="text-center mt-2 px-2">
          <p className="text-white text-base sm:text-lg font-medium">
            AI Pujari Demo
          </p>
          <p className="text-white/70 text-xs sm:text-sm">
            Experience the divine guidance
          </p>

          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white font-medium transition-colors flex items-center justify-center mx-auto md:hidden"
          >
            <X className="w-4 h-4 mr-1" />
            Close Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoDialog;