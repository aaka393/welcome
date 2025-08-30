import React, { useState, useEffect } from 'react';
import { Cookie, X, Settings, Shield, Eye } from 'lucide-react';
import Button from './Button';

interface CookiesConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

const CookiesConsent: React.FC<CookiesConsentProps> = ({ onAccept, onDecline }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, cannot be disabled
    analytics: true,
    marketing: true,
    functional: true
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookies-consent');
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const consentData = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    localStorage.setItem('cookies-consent', JSON.stringify(consentData));
    setIsVisible(false);
    onAccept();
  };

  const handleDeclineAll = () => {
    const consentData = {
      necessary: true, // Necessary cookies cannot be declined
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    localStorage.setItem('cookies-consent', JSON.stringify(consentData));
    setIsVisible(false);
    onDecline();
  };

  const handleSavePreferences = () => {
    const consentData = {
      ...preferences,
      necessary: true, // Always true
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    localStorage.setItem('cookies-consent', JSON.stringify(consentData));
    setIsVisible(false);
    
    // Call appropriate callback based on preferences
    if (preferences.analytics || preferences.marketing || preferences.functional) {
      onAccept();
    } else {
      onDecline();
    }
  };

  const handlePreferenceChange = (type: keyof typeof preferences) => {
    if (type === 'necessary') return; // Cannot change necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pointer-events-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-orange-200 max-w-4xl w-full pointer-events-auto">
        {!showDetails ? (
          // Simple Banner
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                  <Cookie className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  We value your privacy
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  We use cookies to enhance your browsing experience, provide personalized content, 
                  and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. 
                  You can manage your preferences or learn more about our cookie policy.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleAcceptAll}
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    Accept All Cookies
                  </Button>
                  
                  <Button
                    onClick={handleDeclineAll}
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    Decline All
                  </Button>
                  
                  <Button
                    onClick={() => setShowDetails(true)}
                    variant="ghost"
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Customize
                  </Button>
                </div>
                
                <div className="mt-3 text-xs text-gray-500">
                  <button
                    onClick={() => setShowDetails(true)}
                    className="text-orange-600 hover:text-orange-700 underline mr-4"
                  >
                    Cookie Policy
                  </button>
                  <button
                    onClick={() => setShowDetails(true)}
                    className="text-orange-600 hover:text-orange-700 underline"
                  >
                    Privacy Policy
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Detailed Preferences
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Cookie className="w-6 h-6 text-orange-600" />
                  <h2 className="text-xl font-bold text-gray-800">Cookie Preferences</h2>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-orange-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-sm text-gray-600 leading-relaxed">
                <p className="mb-4">
                  We use different types of cookies to optimize your experience on our website. 
                  You can choose which categories you'd like to allow. Please note that blocking 
                  some types of cookies may impact your experience.
                </p>
              </div>
              
              {/* Necessary Cookies */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-800">Strictly Necessary</h3>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-3">Always Active</span>
                    <div className="w-12 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  These cookies are essential for the website to function properly. They enable 
                  basic functions like page navigation, access to secure areas, and authentication.
                </p>
              </div>
              
              {/* Analytics Cookies */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">Analytics</h3>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('analytics')}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      preferences.analytics 
                        ? 'bg-orange-500 justify-end' 
                        : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  These cookies help us understand how visitors interact with our website by 
                  collecting and reporting information anonymously.
                </p>
              </div>
              
              {/* Functional Cookies */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-800">Functional</h3>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('functional')}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      preferences.functional 
                        ? 'bg-orange-500 justify-end' 
                        : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  These cookies enable enhanced functionality and personalization, such as 
                  remembering your preferences and settings.
                </p>
              </div>
              
              {/* Marketing Cookies */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Cookie className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-gray-800">Marketing</h3>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('marketing')}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      preferences.marketing 
                        ? 'bg-orange-500 justify-end' 
                        : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  These cookies are used to deliver personalized advertisements and measure 
                  the effectiveness of advertising campaigns.
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-orange-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSavePreferences}
                  size="sm"
                  className="flex-1"
                >
                  Save Preferences
                </Button>
                
                <Button
                  onClick={handleAcceptAll}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Accept All
                </Button>
                
                <Button
                  onClick={handleDeclineAll}
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                >
                  Decline All
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-3 text-center">
                You can change your preferences at any time by clicking the cookie settings 
                link in our footer.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookiesConsent;