import { create } from 'zustand';
import { DiscountCode, CreateDiscountCodeRequest, UpdateDiscountCodeRequest } from '../types/discount';
import { discountService, adminLogin as apiAdminLogin } from '../services/discountService';
import { useAuthStore } from './useAuthStore';
import { User } from '../types/auth';
import { useUserMetadataStore } from './userMetadataStore';

interface DiscountStore {
    // State
    discountCodes: DiscountCode[];
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;

    // Actions
    adminLogin: (username: string, password: string) => Promise<boolean>;
    fetchDiscountCodes: () => Promise<void>;
    createDiscountCode: (discountCode: CreateDiscountCodeRequest) => Promise<boolean>;
    updateDiscountCode: (code: string, discountCode: UpdateDiscountCodeRequest) => Promise<boolean>;
    deleteDiscountCode: (code: string) => Promise<boolean>;
    validateDiscountCode: (code: string) => Promise<{ valid: boolean; discount?: DiscountCode; error?: string }>;
    clearError: () => void;
    logout: () => void;
}

export const useDiscountStore = create<DiscountStore>((set, get) => ({
    // Initial state
    discountCodes: [],
    isLoading: false,
    error: null,
    isAuthenticated: false,

    // Admin login
    adminLogin: async (username: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
            const result = await apiAdminLogin(username, password);

            if (result.success) {
                const responseData = result.data as Partial<User>;


                const user: User = {
                    id: responseData?.id || '',
                    username: responseData?.username || '',
                    email: responseData?.email || '',
                    role: responseData?.role?.toLowerCase() || 'user',
                    profilePicture: null,
                    createdDate: responseData?.createdDate || '',
                    keycloakId: responseData?.keycloakId || '',
                    isEmailVerified: true, // or false, depending on your logic
                    provider: 'local' // or 'admin' or whatever fits your app
                };

                const setUser = useAuthStore.getState().setUser;
                setUser(user);

                set({
                    isAuthenticated: true,
                    isLoading: false,
                });

                return true;
            } else {
                set({
                    error: result.error || 'Login failed',
                    isLoading: false,
                    isAuthenticated: false
                });
                return false;
            }
        } catch (error) {
            set({
                error: (error as Error).message || 'Login failed',
                isLoading: false,
                isAuthenticated: false
            });
            return false;
        }
    },



    // Fetch all discount codes
    fetchDiscountCodes: async () => {
        set({ isLoading: true, error: null });

        try {
            const result = await discountService.getAllDiscountCodes();

            if (result.success && result.data) {
                set({
                    discountCodes: result.data,
                    isLoading: false
                });
            } else {
                set({
                    error: result.error || 'Failed to fetch discount codes',
                    isLoading: false
                });
            }
        } catch (error) {
            set({
                error: (error as Error).message || 'Failed to fetch discount codes',
                isLoading: false
            });
        }
    },

    // Create new discount code
    createDiscountCode: async (discountCode: CreateDiscountCodeRequest) => {
        set({ isLoading: true, error: null });

        try {
            const result = await discountService.createDiscountCode(discountCode);

            if (result.success && result.data) {
                const currentCodes = get().discountCodes || [];
                set({
                    discountCodes: [...currentCodes, result.data],
                    isLoading: false
                });
                return true;
            } else {
                set({
                    error: result.error || 'Failed to create discount code',
                    isLoading: false
                });
                return false;
            }
        } catch (error) {
            set({
                error: (error as Error).message || 'Failed to create discount code',
                isLoading: false
            });
            return false;
        }
    },

    // Update existing discount code
    updateDiscountCode: async (code: string, discountCode: UpdateDiscountCodeRequest) => {
        set({ isLoading: true, error: null });

        try {
            const result = await discountService.updateDiscountCode(code, discountCode);

            if (result.success) {
                await useDiscountStore.getState().fetchDiscountCodes();
                set({ isLoading: false });
                return true;
            } else {
                set({
                    error: result.error || 'Failed to update discount code',
                    isLoading: false
                });
                return false;
            }
        } catch (error) {
            console.error('Update discount code error:', error);
            set({
                error: (error as Error).message || 'Failed to update discount code',
                isLoading: false
            });
            return false;
        }
    },

    deleteDiscountCode: async (code: string) => {
        set({ isLoading: true, error: null });

        try {
            const result = await discountService.deleteDiscountCode(code);

            if (result.success) {
                const currentCodes = get().discountCodes;
                const filteredCodes = currentCodes.filter(dc => dc.code !== code);
                set({
                    discountCodes: filteredCodes,
                    isLoading: false
                });
                return true;
            } else {
                set({
                    error: result.error || 'Failed to delete discount code',
                    isLoading: false
                });
                return false;
            }
        } catch (error) {
            set({
                error: (error as Error).message || 'Failed to delete discount code',
                isLoading: false
            });
            return false;
        }
    },

    validateDiscountCode: async (code: string) => {
        try {
            const { selectedCurrency } = useUserMetadataStore.getState();
            const result = await discountService.validateDiscountCode(code, 0, selectedCurrency);
            return result;
        } catch (error) {
            return {
                valid: false,
                error: (error as Error).message || 'Failed to validate discount code'
            };
        }
    },

    clearError: () => {
        set({ error: null });
    },

    logout: () => {
        set({
            isAuthenticated: false,
            discountCodes: [],
            error: null
        });
    }
}));