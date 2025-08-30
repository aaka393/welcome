import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { discountService } from '../services/discountService';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  createdDate: string;
  keycloakId: string;
}

interface AdminAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AdminUser | null;
  error: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  setUser: (user: AdminUser | null) => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const result = await discountService.adminLogin(username, password);

          if (result.success && result.data) {
            const adminUser: AdminUser = {
              id: result.data.id,
              username: result.data.username,
              email: result.data.email,
              role: result.data.role,
              createdDate: result.data.createdDate,
              keycloakId: result.data.keycloakId,
            };

            set({
              user: adminUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            return true;
          } else {
            set({
              error: result.error || 'Login failed',
              isLoading: false,
              isAuthenticated: false,
            });
            return false;
          }
        } catch (error) {
          const errorMessage = (error as Error).message || 'Login failed';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        // Clear persisted data
        useAdminAuthStore.persist.clearStorage();
      },

      clearError: () => set({ error: null }),

      setUser: (user: AdminUser | null) => set({ user }),
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);