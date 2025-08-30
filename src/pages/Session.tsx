import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, SkipForward, Home, RotateCcw } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Button from '../components/UI/Button';
import { pujaService } from '../services/pujaService';

const Session: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<unknown | null>(null);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  
  const segments = [
    { title: 'Opening Prayers', duration: 180 },
    { title: 'Ganesh Invocation', duration: 240 },
    { title: 'Family Names Chanting', duration: 300 },
    { title: 'Ritual Instructions', duration: 120 },
    { title: 'Main Puja', duration: 480 },
    { title: 'Aarti and Blessings', duration: 200 },
    { title: 'Closing Prayers', duration: 150 }
  ];
  
  useEffect(() => {
    if (id) {
      const loadBooking = async () => {
        const bookingData = await pujaService.getBooking(id);
        setBooking(bookingData);
      };
      loadBooking();
    }
  }, [id]);
  
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const nextSegment = () => {
    if (currentSegment < segments.length - 1) {
      setCurrentSegment(currentSegment + 1);
      setIsPlaying(true);
      setShowContinueButton(false);
    } else {
      setSessionComplete(true);
      setIsPlaying(false);
    }
  };
  
  const handleContinue = () => {
    setShowContinueButton(false);
    nextSegment();
  };
  
  // Simulate segment completion and show continue button
  useEffect(() => {
    if (isPlaying && currentSegment === 3) { // After ritual instructions
      const timer = setTimeout(() => {
        setIsPlaying(false);
        setShowContinueButton(true);
      }, 5000); // Show continue button after 5 seconds for demo
      
      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentSegment]);
  
  if (!booking) {
    return (
      <Layout showGanesha={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your puja session...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout showGanesha={false}>
      <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-yellow-900">
        {sessionComplete ? (
          // Session Complete Screen
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="text-center text-white space-y-8">
              <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">🙏</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-4">
                  May you be blessed
                </h1>
                <p className="text-xl text-orange-200 mb-8 max-w-2xl mx-auto">
                  Your puja session is complete. May Lord Ganesha's blessings be with you 
                  and your family always. Om Gam Ganapataye Namaha.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate('/')}
                  variant="secondary"
                  size="lg"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Book Another Puja
                </Button>
                <Button
                  onClick={() => {
                    setSessionComplete(false);
                    setCurrentSegment(0);
                    setIsPlaying(false);
                    setShowContinueButton(false);
                  }}
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-gray-800"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Replay Session
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Video Player Interface
          <div className="relative">
            {/* Video Area */}
            <div className="aspect-video bg-black relative overflow-hidden">
              {/* Mock Video Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-orange-800/20 to-red-900/40">
                <img
                  src={booking.selectedPujari.image}
                  alt={booking.selectedPujari.name}
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
              
              {/* Avatar Speaking Animation */}
              <div className="absolute bottom-8 left-8 right-8">
                <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
                  <p className="text-lg font-medium">
                    {booking.selectedPujari.name} is chanting...
                  </p>
                  <p className="text-sm text-orange-200">
                    {segments[currentSegment].title}
                  </p>
                </div>
              </div>
              
              {/* Continue Button Overlay */}
              {showContinueButton && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="bg-white rounded-xl p-8 text-center space-y-4 max-w-md mx-4">
                    <h3 className="text-2xl font-bold text-gray-800">
                      Please light the diya
                    </h3>
                    <p className="text-gray-600">
                      Take a moment to light your diya and prepare for the main puja.
                    </p>
                    <Button onClick={handleContinue} size="lg">
                      Continue Puja
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="bg-black/90 px-8 py-4">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white">
                    <h2 className="text-xl font-semibold">{booking.pujaType}</h2>
                    <p className="text-orange-200 text-sm">
                      with {booking.selectedPujari.name}
                    </p>
                  </div>
                  <div className="text-white text-sm">
                    Segment {currentSegment + 1} of {segments.length}
                  </div>
                </div>
                
                {/* Progress Segments */}
                <div className="flex space-x-1 mb-4">
                  {segments.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 flex-1 rounded-full ${
                        index < currentSegment
                          ? 'bg-green-500'
                          : index === currentSegment
                          ? 'bg-orange-500'
                          : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Controls */}
                <div className="flex items-center justify-center space-x-6">
                  <Button
                    onClick={togglePlayPause}
                    variant="ghost"
                    size="lg"
                    className="text-white hover:bg-white/20 p-3"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8" />
                    )}
                  </Button>
                  
                  <Button
                    onClick={nextSegment}
                    variant="ghost"
                    size="lg"
                    className="text-white hover:bg-white/20 p-3"
                    disabled={currentSegment >= segments.length - 1}
                  >
                    <SkipForward className="w-8 h-8" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Session;