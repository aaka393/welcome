// import React, { useEffect, useRef } from "react";
// import { VideoPlayer } from "../components/Player/VideoPlayer";
// import { playbackData } from "../static/playbackData";
// import { useVideoStore } from "../stores/videoStore";

// // A minimal page that only contains the player and uses static playback data
// const StandalonePlayer: React.FC = () => {
//   const hasInitRef = useRef(false);
//   const loadFromPlaybackData = useVideoStore((s) => s.loadFromPlaybackData);

//   useEffect(() => {
//     if (hasInitRef.current) return;
//     hasInitRef.current = true;

//     // If ?member=<url> is provided, replace the URL of the personalized segment
//     const search = new URLSearchParams(window.location.search);
//     const memberUrl = (search.get("member") || "").trim();

//     let dataToLoad = playbackData;

//     if (memberUrl) {
//       // Clone and replace only the first personalized segment
//       let replaced = false;
//       const cloned = {
//         ...playbackData,
//         segments: playbackData.segments.map((s) => {
//           const isPersonal = Boolean(s.isPersonalised);
//           if (!replaced && isPersonal) {
//             replaced = true;
//             return { ...s, url: memberUrl };
//           }
//           return s;
//         }),
//       };
//       dataToLoad = cloned;
//     }

//     // Load segments from the (possibly updated) playback data; VideoPlayer handles downloads
//     loadFromPlaybackData(dataToLoad);
//   }, [loadFromPlaybackData]);

//   return (
//     <div className="w-full min-h-screen bg-black relative">
//       <VideoPlayer autoLoadFromApi={false} />

//       {/* Powered By Strip (similar to Footer) */}
//       <div className="absolute bottom-0 inset-x-0 z-50 border-t border-orange-800/50 bg-black/20">
//         <div className="max-w-7xl mx-auto px-4 py-3">
//           <div className="flex items-center justify-center space-x-2">
//             <span className="text-orange-100 text-sm">Powered by</span>
//             <img
//               src="/images/yensi-logo.png"
//               alt="Yensi Solutions"
//               className="h-6 object-contain"
//             />
//             <span className="text-white font-medium text-sm">Yensi Solutions</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default StandalonePlayer;
