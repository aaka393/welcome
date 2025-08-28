/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { serviceBaseUrl } from "../constants/appConstants";
import { logout } from "../services/authService";

interface AuthState {
  isLoading: boolean;
  user: any | null; // User state
  loginWithProvider: (provider: string) => void;
  logout: () => void;
  setUser: (user: any) => void; // Set user state
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoading: false,
      user: null, // Initialize user state

      loginWithProvider: (provider: string) => {
        set({ isLoading: true });
        try {
          const redirectUrl = `${serviceBaseUrl}/auth/provider?provider=${provider}`;
          window.location.href = redirectUrl; // External login redirection
          console.log("redirectUrl",redirectUrl)
        } catch (error) {
          console.error("Error during login redirection:", error);
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          const responseCode = await logout();
          if (responseCode === 1005) {
            document.cookie =
              "access_token=; Max-Age=0; path=/; domain=" +
              window.location.hostname +
              "; Secure; SameSite=Lax";
            localStorage.removeItem("auth-storage");
            sessionStorage.clear();
            await useAuthStore.persist.clearStorage();
            set({ user: null, isLoading: false }); // Clear user on logout
          } else {
            console.warn("Logout failed:", responseCode);
          }
        } catch (error) {
          console.error("Logout failed:", error);
        }
      },

      setUser: (user: any) => {
        set({ user }); // Set the user state
      },
    }),
    {
      name: "auth-storage", // Persistent storage for the state
    }
  )
);
