import React, { useState } from 'react';
import { Mail, FileText, Shield, XCircle, Cookie } from 'lucide-react';
import LegalDialog from '../UI/LegalDialog';

const Footer: React.FC = () => {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [showCookieSettings, setShowCookieSettings] = useState(false);

  return (
    <>
      <footer className="bg-gradient-to-r from-orange-800 via-red-800 to-yellow-800 text-white relative z-40">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/images/ai-pujari-logo.png" 
                alt="AI Pujari" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold">AI Pujari</span>
            </div>
            <p className="text-orange-200 text-sm leading-relaxed">
              Bringing divine spiritual experiences to your home through AI-powered 
              puja ceremonies and personalized chanting.
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-orange-100 hover:text-white transition-colors text-sm">
                  Home
                </a>
              </li>
              <li>
                <a href="/booking" className="text-orange-100 hover:text-white transition-colors text-sm">
                  Book a Puja
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-orange-100 hover:text-white transition-colors text-sm">
                  How it Works
                </a>
              </li>
              <li>
                <a href="/login" className="text-orange-100 hover:text-white transition-colors text-sm">
                  Login
                </a>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Support</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="mailto:support@aiyensi.com" 
                  className="text-orange-100 hover:text-white transition-colors text-sm flex items-center"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Us
                </a>
              </li>
              <li>
                <button 
                  onClick={() => setShowShipping(true)}
                  className="text-orange-100 hover:text-white transition-colors text-sm flex items-center text-left"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Shipping Policy
                </button>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Legal</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => setShowTerms(true)}
                  className="text-orange-100 hover:text-white transition-colors text-sm flex items-center text-left"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setShowPrivacy(true)}
                  className="text-orange-100 hover:text-white transition-colors text-sm flex items-center text-left"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setShowCancellation(true)}
                  className="text-orange-100 hover:text-white transition-colors text-sm flex items-center text-left"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancellation Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setShowCookieSettings(true)}
                  className="text-orange-100 hover:text-white transition-colors text-sm flex items-center text-left"
                >
                  <Cookie className="w-4 h-4 mr-2" />
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Powered By Strip */}
      <div className="border-t border-orange-800/50 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <div className="text-orange-100 text-sm">
              © 2025 AI Pujari. All rights reserved.
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-orange-100 text-sm">Powered by</span>
              <img 
                src="/images/yensi-logo.png" 
                alt="Yensi Solutions" 
                className="h-6 object-contain"
              />
              <span className="text-white font-medium text-sm">Yensi Solutions</span>
            </div>
          </div>
        </div>
      </div>
      </footer>
      
      {/* Legal Dialogs */}
      <LegalDialog
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        type="terms"
      />
      <LegalDialog
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        type="privacy"
      />
      <LegalDialog
        isOpen={showCancellation}
        onClose={() => setShowCancellation(false)}
        type="cancellation"
      />
      <LegalDialog
        isOpen={showShipping}
        onClose={() => setShowShipping(false)}
        type="shipping"
      />
      <LegalDialog
        isOpen={showCookieSettings}
        onClose={() => setShowCookieSettings(false)}
        type="cookies"
      />
    </>
  );
};

export default Footer;