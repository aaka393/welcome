/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { adminBookingService, AdminBackendBooking, AdminUsersWithBookingsItem } from '../services/adminBookingService';

interface AdminBookingState {
  bookings: AdminBackendBooking[];
  usersWithBookings: AdminUsersWithBookingsItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBookings: (filters?: { userEmail?: string; pujaType?: string; paymentStatus?: string }) => Promise<void>;
  fetchUsersWithBookings: (filters?: { userEmail?: string; pujaType?: string; paymentStatus?: string }) => Promise<void>;
  getBookingById: (id: string) => Promise<AdminBackendBooking | null>;
  createBooking: (payload: any) => Promise<AdminBackendBooking>;
  updateBooking: (id: string, data: Partial<AdminBackendBooking>) => Promise<AdminBackendBooking[]>;
  // Soft-delete booking by marking isDeleted=true using update API
  deleteBooking: (id: string) => Promise<AdminBackendBooking[]>;
  clearError: () => void;
}

export const useAdminBookingStore = create<AdminBookingState>((set, get) => ({
  bookings: [],
  usersWithBookings: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchBookings: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const data = await adminBookingService.getAllBookings(filters);
      set({ bookings: data, isLoading: false });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to fetch bookings', isLoading: false, bookings: [] });
    }
  },

  fetchUsersWithBookings: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const data = await adminBookingService.getUsersWithBookings(filters);
      set({ usersWithBookings: data, isLoading: false });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to fetch users with bookings', isLoading: false, usersWithBookings: [] });
    }
  },

  getBookingById: async (id: string) => {
    try {
      return await adminBookingService.getBookingById(id);
    } catch (e: any) {
      set({ error: e?.message || 'Failed to get booking' });
      return null;
    }
  },

  createBooking: async (payload: any) => {
    set({ isLoading: true, error: null });
    try {
      const created = await adminBookingService.createBooking(payload);
      set({ bookings: [created, ...get().bookings], isLoading: false });
      return created;
    } catch (e: any) {
      set({ error: e?.message || 'Failed to create booking', isLoading: false });
      throw e;
    }
  },

  updateBooking: async (id: string, data: Partial<AdminBackendBooking>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedList = await adminBookingService.updateBooking(id, data);
      // If server returns only the updated booking (common), merge it into existing list
      const current = get().bookings;
      let next = current;
      if (Array.isArray(updatedList) && updatedList.length === 1) {
        const updated = updatedList[0];
        next = current.map((b) => (b.id === updated.id ? updated : b));
      } else if (Array.isArray(updatedList) && updatedList.length === 0) {
        // Fallback: server returned empty result; apply local merge with provided data
        next = current.map((b) => (b.id === id ? { ...b, ...data } : b));
      } else if (Array.isArray(updatedList) && updatedList.length > 1) {
        // In some cases server might return full list
        next = updatedList;
      }
      set({ bookings: next, isLoading: false });
      return updatedList;
    } catch (e: any) {
      set({ error: e?.message || 'Failed to update booking', isLoading: false });
      throw e;
    }
  },

  deleteBooking: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const updatedList = await adminBookingService.updateBooking(id, { isDeleted: true });
      const current = get().bookings;
      let next = current;
      if (Array.isArray(updatedList) && updatedList.length === 1) {
        const updated = updatedList[0];
        next = current.map((b) => (b.id === updated.id ? updated : b));
      } else if (Array.isArray(updatedList) && updatedList.length === 0) {
        // Fallback: mark deleted locally
        next = current.map((b) => (b.id === id ? { ...b, isDeleted: true } : b));
      } else if (Array.isArray(updatedList) && updatedList.length > 1) {
        next = updatedList;
      }
      set({ bookings: next, isLoading: false });
      return updatedList;
    } catch (e: any) {
      set({ error: e?.message || 'Failed to delete booking', isLoading: false });
      throw e;
    }
  },
}));

export default useAdminBookingStore;
