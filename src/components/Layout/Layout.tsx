import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  showGanesha?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showGanesha = true }) => {
  return (
    <div className="min-h-screen relative">
      {/* Gradient Overlay - Middle Layer */}
      <div className="fixed inset-0 z-10 bg-gradient-to-br from-orange-50/30 via-red-50/30 to-yellow-50/30" />

      {/* Content Overlay for readability - Top Background Layer */}
      <div className="fixed inset-0 z-20 bg-white/10 backdrop-blur-[0.2px]" />

      <Navbar />

      {/* Ganesha Background Image */}
      {showGanesha && (
        <div
          className="fixed top-20 right-8 w-40 h-40 opacity-15 pointer-events-none z-40 float-animation"
          style={{
            backgroundImage: "url(/images/ganesh-bg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: "50%",
            filter:
              "sepia(20%) saturate(150%) hue-rotate(15deg) brightness(1.1)",
          }}
        >
          {/* Additional decorative elements */}
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-60 pulse-glow"></div>
          <div
            className="absolute -bottom-1 -left-1 w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full opacity-50 pulse-glow"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>
      )}

      <main className="pt-16 relative z-30">{children}</main>

      <Footer />
    </div>
  );
};

export default Layout;
