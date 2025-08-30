/* eslint-disable @typescript-eslint/no-explicit-any */
// bookingStore.ts
import { create } from "zustand";
import { BookingRequest, BookingResponse, Family, Pujari, NameWithPronunciation, BookingFamilyRequest } from "../types";
import { bookingService, BackendBooking } from "../services/bookingService";
import { dateToBackendFormat } from "../utils/dateUtils";
import { availablePujaris } from "../services/api";
import { PRICING } from "../constants/pricing";
import { useUserMetadataStore } from "./userMetadataStore";

// Use BackendBooking from bookingService to ensure consistent type

interface BookingStore {
  currentBooking: Partial<BookingRequest>;
  selectedPujari: Pujari | null;
  families: Family[];
  discountCode: string;
  discountAmount: number;
  finalAmount: number | null;
  lastBooking: BookingResponse | null;
  bookingId: string | null;
  userBookings: BackendBooking[];
  isLoadingBookings: boolean;
  bookingError: string | null;

  setSelectedPujari: (pujari: Pujari | null) => void;
  setPujaDetails: (pujaType: string, date: string, time: string) => void;
  addFamily: (family: Family) => void;
  updateFamily: (familyId: string, updates: Partial<Family>) => void;
  removeFamily: (familyId: string) => void;
  setDiscountDetails: (
    code: string,
    discountAmount: number,
    finalAmount: number
  ) => void;
  clearDiscount: () => void;
  calculateTotal: () => number;
  calculateFinalTotal: () => number;
  resetBooking: () => void;
  submitBooking: (userEmail: string) => Promise<BookingResponse>;
  setBookingData: (booking: BookingResponse) => void;
  fetchUserBookings: (userEmail: string, userId?: string) => Promise<void>;
  loadBookingFromBackend: (bookingId: string) => Promise<void>;
  clearBookingError: () => void;
}

// Helper function to convert backend booking to frontend format
const convertBackendBookingToFrontend = (backendBooking: BackendBooking) => {
  // Map families from backend (new schema only)
  const families: Family[] = (backendBooking.families as BookingFamilyRequest[]).map(
    (family: BookingFamilyRequest, index: number) => {
      const gotraName = family.gotraDetails?.name ?? '';
      const gotraAudioFile: string | undefined = family.gotraDetails?.pronunciationAudio || undefined;
      const gotraPronunciationUrl = gotraAudioFile ? `/api/static/audio/${gotraAudioFile}` : undefined;
      const members = Array.isArray(family.memberDetails)
        ? family.memberDetails.map((m: NameWithPronunciation, memberIndex: number) => ({
            id: `member-${index}-${memberIndex}`,
            name: m?.name ?? '',
            pronunciationId: m?.pronunciationAudio ?? undefined,
            pronunciationUrl: m?.pronunciationAudio ? `/api/static/audio/${m.pronunciationAudio}` : undefined,
          }))
        : [];
      return {
        id: `family-${index}`,
        gotra: gotraName,
        gotraPronunciationId: gotraAudioFile,
        gotraPronunciationUrl,
        members,
      } as Family;
    }
  );

  return {
    families,
    discountCode: backendBooking.discountCode || "",
    discountAmount: backendBooking.discountAmount || 0,
    finalAmount: backendBooking.finalAmount || null,
    currentBooking: {
      userEmail: backendBooking.userEmail,
      pujaType: backendBooking.pujaType,
      preferredDatetime: backendBooking.preferredDatetime || undefined,
      paymentStatus: backendBooking.paymentStatus,
      paymentMethod: backendBooking.paymentMethod || undefined,
      amountPaid: backendBooking.amountPaid || undefined,
      currency: backendBooking.currency || undefined,
      discountCode: backendBooking.discountCode || undefined,
      sessionId: backendBooking.sessionId || undefined,
      invoiceId: backendBooking.invoiceId || undefined,
      pujariId: backendBooking.pujariId || undefined,
      pujariName: backendBooking.pujariName || undefined,
    },
    bookingId: backendBooking.id,
    pujariId: backendBooking.pujariId || undefined,
    pujariName: backendBooking.pujariName || undefined,
  };
};

export const useBookingStore = create<BookingStore>()((set, get) => ({
  currentBooking: {},
  selectedPujari: null,
  families: [],
  discountCode: "",
  discountAmount: 0,
  finalAmount: null,
  lastBooking: null,
  bookingId: null,
  userBookings: [],
  isLoadingBookings: false,
  bookingError: null,

  setSelectedPujari: (pujari) => set({ selectedPujari: pujari }),

  setPujaDetails: (pujaType, date, time) => {
    // Convert date and time to backend format
    const dateTime = new Date(`${date}T${time}`);
    const backendDateTime = dateToBackendFormat(dateTime);

    set((state) => ({
      currentBooking: {
        ...state.currentBooking,
        pujaType,
        preferredDatetime: backendDateTime,
      },
    }));
  },

  addFamily: (family) =>
    set((state) => ({ families: [...state.families, family] })),

  updateFamily: (familyId, updates) =>
    set((state) => ({
      families: state.families.map((family) =>
        family.id === familyId ? { ...family, ...updates } : family
      ),
    })),

  removeFamily: (familyId) =>
    set((state) => ({
      families: state.families.filter((family) => family.id !== familyId),
    })),

  setDiscountDetails: (code, discountAmount, finalAmount) =>
    set({ discountCode: code, discountAmount, finalAmount }),

  clearDiscount: () =>
    set({ discountCode: "", discountAmount: 0, finalAmount: null }),

  calculateTotal: () => {
    const { families } = get();
    const currency = useUserMetadataStore.getState().selectedCurrency || 'INR';
    const pricing = PRICING[currency];
    // Use introductory offer as base for totals per requirements
    return pricing.intro + families.length * pricing.additionalFamily;
  },

  calculateFinalTotal: () => {
    const { finalAmount } = get();
    return finalAmount !== null ? finalAmount : get().calculateTotal();
  },

  setBookingData: (booking) =>
    set({
      lastBooking: booking,
      bookingId: booking.bookingId || booking.id || null,
    }),

  fetchUserBookings: async (userEmail: string) => {
    set({ isLoadingBookings: true, bookingError: null });

    try {
      const bookings: BackendBooking[] =
        await bookingService.getUserBookingsByEmail(userEmail);

      set({
        userBookings: bookings,
        isLoadingBookings: false,
        bookingError: null,
      });

      // If we have bookings and no current booking data, load the most recent one
      const currentState = get();
      if (bookings.length > 0 && !currentState.bookingId) {
        const validbookings = bookings
          .filter((b) => b != null && !b.isDeleted)
          .sort((a, b) => {
            return (b.createdAt || "").localeCompare(a.createdAt || "");
          });
        const mostRecentBooking = validbookings[0];
        const frontendData = convertBackendBookingToFrontend(mostRecentBooking);

        set({
          ...frontendData,
          selectedPujari:
            availablePujaris.find((p) => p.id === mostRecentBooking.pujariId) ||
            null,
          userBookings: bookings,
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch user bookings:", error);
      set({
        bookingError: error.message || "Failed to fetch bookings",
        isLoadingBookings: false,
        userBookings: [],
      });
    }
  },

  loadBookingFromBackend: async (bookingId: string) => {
    set({ isLoadingBookings: true, bookingError: null });

    try {
      const booking = await bookingService.getBookingById(bookingId);

      if (booking) {
        const frontendData = convertBackendBookingToFrontend(booking);
        set({
          ...frontendData,
          isLoadingBookings: false,
          selectedPujari:
            availablePujaris.find((p) => p.id === frontendData.pujariId) ||
            null,
          bookingError: null,
        });
      } else {
        set({
          bookingError: "Booking not found",
          isLoadingBookings: false,
        });
      }
    } catch (error: any) {
      console.error("Failed to load booking:", error);
      set({
        bookingError: error.message || "Failed to load booking",
        isLoadingBookings: false,
      });
    }
  },

  clearBookingError: () => set({ bookingError: null }),

  resetBooking: () =>
    set({
      currentBooking: {},
      selectedPujari: null,
      families: [],
      discountCode: "",
      discountAmount: 0,
      finalAmount: null,
      lastBooking: null,
      bookingId: null,
      bookingError: null,
    }),

  submitBooking: async (userEmail: string) => {
    const { currentBooking, families, discountCode, calculateFinalTotal } =
      get();

    // Helper to extract filename from a URL or filename
    const onlyFilename = (s?: string) => {
      if (!s) return undefined;
      try {
        // If it's a URL, take the pathname last segment
        if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/')) {
          const parts = s.split('/');
          return parts[parts.length - 1] || undefined;
        }
        // Otherwise assume it's already a filename
        return s;
      } catch {
        return s;
      }
    };

    const familiesPayload = families.map((f) => {
      const gotraDetails: NameWithPronunciation = {
        name: f.gotra,
        pronunciationAudio: onlyFilename(f.gotraPronunciationId || f.gotraPronunciationUrl) || null,
        pronunciationMp3: null,
      };
      const memberDetails: NameWithPronunciation[] = f.members.map((m) => ({
        name: m.name,
        pronunciationAudio: onlyFilename(m.pronunciationId || m.pronunciationUrl) || null,
        pronunciationMp3: null,
      }));
      return { gotraDetails, memberDetails };
    });

    const request: BookingRequest = {
      ...(get().bookingId ? { bookingId: get().bookingId as string } : {}),
      userEmail,
      pujaType: currentBooking.pujaType!,
      preferredDatetime: currentBooking.preferredDatetime,
      families: familiesPayload,
      paymentStatus: 'pending',
      paymentMethod: 'UPI',
      amountPaid: calculateFinalTotal(),
      currency: useUserMetadataStore.getState().selectedCurrency || 'INR',
      discountCode: discountCode || null,
      sessionId: 'TEMP_SESSION',
      invoiceId: 'TEMP_INVOICE',
      pujariId: get().selectedPujari?.id || null,
      pujariName: get().selectedPujari?.name || null,
    };

    const result = await bookingService.createBooking(request);

    set({
      lastBooking: result,
      bookingId: result.id,
    });

    console.log("result", result);
    return result;
  },
}));
