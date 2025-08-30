import { create } from "zustand";
import { persist } from "zustand/middleware";
import { verifyTokenService, logoutService, verifyTokenForLoginService } from "../services/authService";
import { serviceBaseUrl } from "../constants/appConstants";
import { User } from "../types/auth";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  loginWithProvider: (provider: string) => void;
  verifyTokenAfterLogin: () => Promise<void>;
  verifySessionPeriodically: () => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: false,
      user: null,

      loginWithProvider: (provider: string) => {
        try {
          const redirectUrl = `${serviceBaseUrl}/auth/provider?provider=${provider}`;
          window.location.href = redirectUrl;
        } catch (error) {
          console.error("Error during login redirection:", error);
          set({ isLoading: false });
        }
      },

       // 🔑 Called only after login redirect to verify and store user data
      verifyTokenAfterLogin: async () => {
        try {
         set({ isLoading: true });
          const data = await verifyTokenForLoginService();
          if (data?.code === 1040 && data?.result) {
            const user: User = data.result;
            set({
               user,
                isLoading: false,
                isAuthenticated:true
               });
            console.log("User verified and stored after login:", user);
          } else {
            set({ user: null, isLoading: false, isAuthenticated: false });
            console.log("Login verification failed");
          }
          set({ isLoading: false });
        } catch (error) {
          console.error("Error verifying token after login:", error);
          set({ user: null, isLoading: false });
        }
      },

      // 🔄 Called every 5s from App.tsx to check session validity
      verifySessionPeriodically: async () => {
        const currentUser = get().user;
        if (!currentUser) return; // Don't check if already logged out
        
        try {
          const data = await verifyTokenService();
          if (data.code !== 1040) {
            console.warn(`Session invalid (code: ${data.code}), logging out...`);
            get().logout();
          }
        } catch (error) {
          console.error("Error in periodic session verification:", error);
          get().logout();
        }
      },

      logout: async () => {
        set({ user: null, isLoading: false });
        
        try {
          const responseCode = await logoutService();
          console.log("Logout service response:", responseCode);
            set({
              isAuthenticated: false,
            });
        } catch (error) {
          console.error("Logout failed:", error);
        } finally {
          useAuthStore.persist.clearStorage();
          sessionStorage.clear();
          localStorage.clear();
        }
      },

      setUser: (user: User | null) => set({ user }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
    }
  )
);