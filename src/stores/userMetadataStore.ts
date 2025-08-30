import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUserMetaForCurrency, UserMetaForCurrency } from '../services/userMetadataService';
import { useAuthStore } from './useAuthStore';
import type { SupportedCurrency } from '../constants/pricing';

interface UserMetadataState {
	meta: UserMetaForCurrency | null;
	isLoading: boolean;
	error: string | null;
	lastFetchedAt: number | null;

	// Locally selected currency (persisted). Defaults to 'INR'.
	selectedCurrency: SupportedCurrency;
	setSelectedCurrency: (currency: SupportedCurrency) => void;

	load: (force?: boolean) => Promise<void>;
	refresh: () => Promise<void>;
	clearError: () => void;
	reset: () => void;
}

// Avoid multiple concurrent fetches
let inflight: Promise<UserMetaForCurrency> | null = null;

export const useUserMetadataStore = create<UserMetadataState>()(
	persist(
		(set, get) => ({
			meta: null,
			isLoading: false,
			error: null,
			lastFetchedAt: null,
			selectedCurrency: 'INR',

			load: async (force = false) => {
				const state = get();
				if (state.isLoading) return; // already loading
				if (!force && state.meta) return; // already have data

				set({ isLoading: true, error: null });
				try {
					// Try to pull userId from auth store if available
					const auth = useAuthStore.getState();
					const userId = auth.user?.id || undefined;

					inflight = inflight || getUserMetaForCurrency(userId);
					const result = await inflight;
					inflight = null;

					// Only set if changed to avoid unnecessary renders
					const prev = get().meta;
					const changed =
						!prev ||
						prev.userId !== result.userId ||
						prev.country !== result.country ||
						prev.currency !== result.currency;

					if (changed) {
						set({ meta: result, lastFetchedAt: Date.now(), isLoading: false, error: null });
					} else {
						set({ isLoading: false, error: null });
					}
				} catch (e: unknown) {
					const message = e instanceof Error ? e.message : 'Failed to load user metadata';
					inflight = null;
					set({ error: message, isLoading: false });
				}
			},

			refresh: async () => {
				await get().load(true);
			},

			clearError: () => set({ error: null }),

			reset: () => set({ meta: null, isLoading: false, error: null, lastFetchedAt: null }),

			setSelectedCurrency: (currency: SupportedCurrency) => set({ selectedCurrency: currency }),
		}),
		{
			name: 'user-metadata-storage',
			partialize: (state) => ({ meta: state.meta, lastFetchedAt: state.lastFetchedAt, selectedCurrency: state.selectedCurrency }),
			onRehydrateStorage: () => () => {
				// Ensure volatile flags are reset post-rehydrate
				useUserMetadataStore.setState({ isLoading: false, error: null });
			},
		}
	)
);

