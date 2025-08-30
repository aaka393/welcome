import React from "react";
import { Link, useLocation } from "react-router-dom";
import { User, LogOut, Settings } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { useShallow } from "zustand/react/shallow";

const Navbar: React.FC = () => {
  const location = useLocation();
  const { logout,  user } = useAuthStore();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/images/logo-aipujari.png"
              alt="AI Pujari"
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-700 bg-clip-text text-transparent">
              AI Pujari
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/booking"
              className={`font-medium transition-colors ${
                isActive("/booking")
                  ? "text-orange-600"
                  : "text-gray-700 hover:text-orange-600"
              }`}
            >
              Book a Puja
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* ✅ FIX: Check both user and isAuthenticated */}
            {user ? (
              <div className="flex items-center space-x-3">
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    className="p-2 text-gray-600 hover:text-orange-600 transition-colors"
                    title="Admin Dashboard"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                )}
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {user.username || user.email.split("@")[0]}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
