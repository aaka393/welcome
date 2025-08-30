import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Button from "../components/UI/Button";
import LegalDialog from "../components/UI/LegalDialog";
import { useAuthStore } from "../stores/useAuthStore";
import Layout from "../components/Layout/Layout";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const { user, loginWithProvider } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleContinueWithGoogle = async () => {
    try {
      setIsLoading(true);
      await loginWithProvider("google");
    } catch (error) {
      console.error("Login failed", error);
      setIsLoading(false);
    }
  };


  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Authenticating...</p>
          </div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-200 p-8">
            <div className="text-center mb-8">
              <img
                src="/images/ai-pujari-logo.png"
                alt="AI Pujari"
                className="w-48 h-48 object-contain mx-auto mb-4"
              />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                Sign in with Google to continue your spiritual journey
              </p>
            </div>

            <div className="space-y-6">
              <Button
                onClick={handleContinueWithGoogle}
                loading={isLoading}
                className="w-full"
                size="lg"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-orange-200 text-center">
              <p className="text-sm text-gray-600">
                By continuing, you agree to our{" "}
                <button
                  onClick={() => setShowTerms(true)}
                  className="text-orange-600 hover:text-orange-700 font-medium underline"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  onClick={() => setShowPrivacy(true)}
                  className="text-orange-600 hover:text-orange-700 font-medium underline"
                >
                  Privacy Policy
                </button>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                New to AI Pujari?{" "}
                <Link
                  to="/"
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Learn more
                </Link>
              </p>
            </div>
          </div>
        </div>

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
      </div>
    </Layout>
  );
};

export default Login;
