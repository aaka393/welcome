import { useEffect, useState } from 'react';

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: string;
  version: string;
}

export const useCookies = () => {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const savedConsent = localStorage.getItem('cookies-consent');
    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent);
        setConsent(parsed);
        initializeCookies(parsed);
      } catch (error) {
        console.error('Error parsing cookie consent:', error);
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  const initializeCookies = (consentData: CookieConsent) => {
    // Initialize analytics cookies
    if (consentData.analytics) {
      // Initialize Google Analytics or other analytics
      console.log('Analytics cookies enabled');
      // Example: gtag('config', 'GA_MEASUREMENT_ID');
    }

    // Initialize marketing cookies
    if (consentData.marketing) {
      // Initialize marketing pixels, Facebook Pixel, etc.
      console.log('Marketing cookies enabled');
    }

    // Initialize functional cookies
    if (consentData.functional) {
      // Initialize functional cookies like preferences, language settings
      console.log('Functional cookies enabled');
    }
  };

  const clearNonEssentialCookies = () => {
    // Get all cookies
    const cookies = document.cookie.split(';');
    
    // List of essential cookies that should not be deleted
    const essentialCookies = [
      'cookies-consent',
      'session',
      'csrf-token',
      'auth-token'
    ];

    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Only delete non-essential cookies
      if (!essentialCookies.some(essential => name.includes(essential))) {
        // Delete cookie by setting expiry date in the past
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
      }
    });

    // Clear localStorage items (except essential ones)
    const essentialLocalStorage = [
      'cookies-consent',
      'auth-user',
      'booking-data'
    ];

    Object.keys(localStorage).forEach(key => {
      if (!essentialLocalStorage.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    // Clear sessionStorage items (except essential ones)
    Object.keys(sessionStorage).forEach(key => {
      if (!essentialLocalStorage.includes(key)) {
        sessionStorage.removeItem(key);
      }
    });

    console.log('Non-essential cookies and storage cleared');
  };

  const handleAccept = () => {
    const consentData: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    setConsent(consentData);
    setShowBanner(false);
    initializeCookies(consentData);
  };

  const handleDecline = () => {
    const consentData: CookieConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    setConsent(consentData);
    setShowBanner(false);
    clearNonEssentialCookies();
  };

  const updateConsent = (newConsent: Partial<CookieConsent>) => {
    const updatedConsent = {
      ...consent,
      ...newConsent,
      necessary: true, // Always true
      timestamp: new Date().toISOString(),
      version: '1.0'
    } as CookieConsent;
    
    localStorage.setItem('cookies-consent', JSON.stringify(updatedConsent));
    setConsent(updatedConsent);
    
    // Clear cookies if any category was disabled
    const hasDisabledCategory = !newConsent.analytics || !newConsent.marketing || !newConsent.functional;
    if (hasDisabledCategory) {
      clearNonEssentialCookies();
    }
    
    initializeCookies(updatedConsent);
  };

  const resetConsent = () => {
    localStorage.removeItem('cookies-consent');
    setConsent(null);
    setShowBanner(true);
    clearNonEssentialCookies();
  };

  return {
    consent,
    showBanner,
    handleAccept,
    handleDecline,
    updateConsent,
    resetConsent,
    clearNonEssentialCookies
  };
};