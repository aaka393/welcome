import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/UI/ToastContainer";
import CookiesConsent from "./components/UI/CookiesConsent";
import { useCookies } from "./hooks/useCookies";
import Home from "./pages/Home";
import PujaPlayer from "./pages/PujaPlayer";
import Login from "./pages/Login";
import { useEffect } from "react";
import { useAuthStore } from "./stores/useAuthStore";
import { useUserMetadataStore } from "./stores/userMetadataStore";
import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import Session from "./pages/Session";
import Admin from "./pages/Admin";
import RequireAuthRedirect from './components/RequireAuthRedirect';
import ScrollToTop from "./components/UI/ScrollToTop";
import React from "react";
// import StandalonePlayer from "./pages/StandalonePlayer";

function App() {
  const { showBanner, handleAccept, handleDecline } = useCookies();
  const loadUserMeta = useUserMetadataStore((s) => s.load);
  const { user, verifySessionPeriodically } = useAuthStore()


  React.useEffect(() => {
    if (!user) return;

    loadUserMeta();
    const interval = setInterval(() => {
      verifySessionPeriodically();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, verifySessionPeriodically, loadUserMeta]);

  return (
    <ToastProvider>
      <Router>
        <RequireAuthRedirect />
        <ScrollToTop />
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/puja-player" element={<PujaPlayer />} />
            {/* <Route path="/player" element={<StandalonePlayer />} /> */}
            <Route path="/login" element={<Login />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/session/:id" element={<Session />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>

          {showBanner && (
            <CookiesConsent onAccept={handleAccept} onDecline={handleDecline} />
          )}
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
