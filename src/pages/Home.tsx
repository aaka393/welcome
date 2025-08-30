import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Play,
  Users,
  Calendar,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Layout from "../components/Layout/Layout";
import PujariCard from "../components/Pujari/PujariCard";
import Button from "../components/UI/Button";
import VideoDialog from "../components/UI/VideoDialog";
import { useBookingStore } from "../stores/bookingStore";
import { pujaService } from "../services/pujaService";
import { Pujari } from "../types";
import { useAuthStore } from "../stores/useAuthStore";
import { useShallow } from "zustand/react/shallow";

const Home: React.FC = () => {
  const [pujaris, setPujaris] = useState<Pujari[]>([]);
  const [selectedPujari, setSelectedPujari] = useState<Pujari | null>(null);
  const [centerIndex, setCenterIndex] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const { setSelectedPujari: setBookingPujari } = useBookingStore();
  const { verifyTokenAfterLogin } = useAuthStore();
  const {isAuthenticated } = useAuthStore()
    const { userEmail } = useAuthStore(
    useShallow((state) => ({
      userEmail: state.user?.email,
    }))
  );
  const { bookingId, clearBookingError } = useBookingStore();
  const getVisiblePujaris = () => {
    if (pujaris.length === 0) return [];
    if (pujaris.length === 1) return [pujaris[0], pujaris[0], pujaris[0]];
    if (pujaris.length === 2) return [pujaris[1], pujaris[0], pujaris[1]];

    const prevIndex = centerIndex === 0 ? pujaris.length - 1 : centerIndex - 1;
    const nextIndex = centerIndex === pujaris.length - 1 ? 0 : centerIndex + 1;

    return [pujaris[prevIndex], pujaris[centerIndex], pujaris[nextIndex]];
  };
    useEffect(() => {
    console.log('Home page mounted, checking auth...');
    verifyTokenAfterLogin();
  }, [verifyTokenAfterLogin]);

  useEffect(() => {
    const loadPujaris = async () => {
      const data = await pujaService.getPujaris();
      setPujaris(data);
    };
    loadPujaris();
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    clearBookingError();
 
  }, [clearBookingError, userEmail]);

  const handlePrevious = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Step 1: Shrink current center card FIRST
    setTimeout(() => {
      // Step 2: Move to new index after shrink completes
      const newIndex = centerIndex === 0 ? pujaris.length - 1 : centerIndex - 1;
      setCenterIndex(newIndex);
      if (pujaris[newIndex]) {
        setSelectedPujari(pujaris[newIndex]);
        setBookingPujari(pujaris[newIndex]);
      }

      // Step 3: Allow grow animation to complete after scroll
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 400); // Wait longer for shrink to complete
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Step 1: Shrink current center card FIRST
    setTimeout(() => {
      // Step 2: Move to new index after shrink completes
      const newIndex = centerIndex === pujaris.length - 1 ? 0 : centerIndex + 1;
      setCenterIndex(newIndex);
      if (pujaris[newIndex]) {
        setSelectedPujari(pujaris[newIndex]);
        setBookingPujari(pujaris[newIndex]);
      }

      // Step 3: Allow grow animation to complete after scroll
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 400); // Wait longer for shrink to complete
  };

  const handlePujariSelect = (pujari: Pujari) => {
    if (isAnimating) return;
    const index = pujaris.findIndex((p) => p.id === pujari.id);
    if (index === centerIndex) {
      // If the user clicked the already centered card, select it immediately
      setSelectedPujari(pujari);
      setBookingPujari(pujari);
      return;
    }

    // If not center, perform the animated transition to bring clicked card to center
    setIsAnimating(true);

    // Step 1: Shrink current center card FIRST
    setTimeout(() => {
      // Step 2: Move to new index after shrink completes
      setCenterIndex(index);
      setSelectedPujari(pujari);
      setBookingPujari(pujari);

      // Step 3: Allow grow animation to complete after scroll
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 400); // Wait longer for shrink to complete
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/50 to-red-100/50" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url(/images/ai-pujari-logo.png)",
            backgroundSize: "600px 600px",
            backgroundPosition: "left center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div
          className="absolute inset-0 opacity-30 hidden md:block"
          style={{
            backgroundImage: "url(/images/ganesh-bg.png)",
            backgroundSize: "500px 500px",
            backgroundPosition: "right center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28">
          <div className="text-center space-y-8">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-yellow-600 bg-clip-text text-transparent leading-tight">
              Invite a divine AI Pujari
              <br />
              to your home or mandap
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Book a spiritual experience with personalised chanting and a
              realistic avatar that brings the sacred atmosphere directly to
              your space
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setShowVideoDialog(true)}
                variant="outline"
                size="lg"
                className="px-8 py-4 text-xl"
              >
                <Play className="w-6 h-6 mr-2" />
                Watch Demo
              </Button>
              <a href="#choose-pujari">
                <Button size="lg" className="px-8 py-4 text-xl">
                  Choose Your Pujari
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Start Puja Section - visible when user is logged in and has a booking ID */}
      {isAuthenticated && bookingId && (
        <section className="py-10 bg-gradient-to-r from-orange-50 to-red-50 border-y border-orange-200">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Start Puja</h2>
                <p className="text-gray-600">
                  You're all set. Begin your puja experience now.
                </p>
              </div>
              <Link to="/puja-player">
                <Button size="lg" className="px-6 py-3">
                  Start Puja
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Annadanam Seva Section */}
      <section className="py-16 bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border-y border-orange-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-200 p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🙏</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-yellow-600 bg-clip-text text-transparent mb-4">
              100% of Net Profits Go Towards Annadanam Seva
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Every booking you make helps feed someone in need. All net profits
              from AI Pujari services are dedicated to{" "}
              <span className="font-semibold text-orange-600">
                Annadanam Seva
              </span>{" "}
              — the sacred tradition of offering food to the hungry and
              underprivileged.
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Sacred Service</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>100% Transparency</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Direct Impact</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pujari Selection */}
      <section
        id="choose-pujari"
        className="py-20 bg-gradient-to-r from-white/20 via-orange-50/30 to-white/20 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Choose Your Sacred Guide
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select from our blessed AI Pujaris, each trained in traditional
              vedic chanting and rituals from different regional traditions
            </p>
          </div>

          <div className="relative">
            {/* Navigation Arrows */}
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border-2 border-orange-200 flex items-center justify-center transition-all duration-300 hover:bg-orange-50 hover:border-orange-400 hover:shadow-lg hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6 text-orange-600" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border-2 border-orange-200 flex items-center justify-center transition-all duration-300 hover:bg-orange-50 hover:border-orange-400 hover:shadow-lg hover:scale-110"
            >
              <ChevronRight className="w-6 h-6 text-orange-600" />
            </button>

            {/* Carousel Container */}
            {/* Keep a constant height so the page doesn't jump when cards animate/change size */}
            <div className="overflow-hidden pb-8 min-h-[340px] md:min-h-[420px] flex items-center justify-center">
              {pujaris.length > 0 ? (
                <div className="flex items-center justify-center space-x-6 py-8 h-full">
                  {getVisiblePujaris().map((pujari, index) => {
                    const isCenter = index === 1; // Middle card in the 3-card display
                    return (
                      <div
                        key={pujari.id}
                        className="transition-all duration-500 ease-in-out transform"
                      >
                        <PujariCard
                          pujari={pujari}
                          selected={selectedPujari?.id === pujari.id}
                          isCenter={isCenter}
                          onClick={() => handlePujariSelect(pujari)}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading sacred guides...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center space-x-2 mt-6">
              {pujaris.map((pujari, index) => (
                <button
                  key={pujari.id}
                  onClick={() => handlePujariSelect(pujari)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === centerIndex
                      ? "bg-orange-500 scale-125"
                      : "bg-orange-200 hover:bg-orange-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Selected Pujari CTA: shows only when a pujari is selected */}
      {selectedPujari && (
        <section className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-col items-center justify-between gap-2 rounded-2xl border border-orange-100 bg-white/90 p-2 shadow-lg backdrop-blur-sm sm:py-2 md:flex-row lg:p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-xl font-semibold text-orange-600">
                  {selectedPujari.name?.charAt(0) || "P"}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {selectedPujari.name}
                  </h3>
                  <p className="text-sm text-gray-600">Selected sacred guide</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {isAuthenticated ? (
                  <Link
                    to="/booking"
                    onClick={() => {
                      // ensure booking store knows the selected pujari before navigating
                      setBookingPujari(selectedPujari);
                    }}
                  >
                    <Button size="lg" className="px-6 py-3">
                      Book the Puja Session
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login">
                    <Button variant="secondary" size="lg" className="px-6 py-3">
                      Login to Book
                    </Button>
                  </Link>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPujari(null);
                    setBookingPujari(null);
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the divine in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                1. Book a Puja
              </h3>
              <p className="text-gray-600">
                Choose your Pujari, select the puja type, pick your preferred
                date and time, and add your family members with proper
                pronunciation
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                2. Receive Personalised Session
              </h3>
              <p className="text-gray-600">
                Our AI Pujari will create a customized chanting session with
                your family names and gotras, delivered in authentic Sanskrit
                pronunciation
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                3. Perform Puja Together
              </h3>
              <p className="text-gray-600">
                Follow step-by-step guidance from your AI Pujari, perform the
                rituals with your family, and receive divine blessings
              </p>
            </div>
          </div>
        </div>
      </section>

      {!isAuthenticated && (
        <section
          id="get-started"
          className="py-20 bg-gradient-to-r from-orange-500 to-red-600"
        >
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Begin Your Spiritual Journey?
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              {selectedPujari
                ? `You've selected ${selectedPujari.name}. Login to continue with your booking.`
                : "Login to start booking your personalized puja experience"}
            </p>
            <Link to="/login">
              <Button
                variant="secondary"
                size="lg"
                className="px-8 py-4 text-xl"
              >
                Continue with Login
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Video Dialog */}
      <VideoDialog
        isOpen={showVideoDialog}
        onClose={() => setShowVideoDialog(false)}
        videoSrc="/video/SampleSharma1.mp4"
      />
    </Layout>
  );
};

export default Home;
