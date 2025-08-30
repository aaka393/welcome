// types.ts
export interface FamilyMember {
  id: string;
  name: string;
  // Optional pronunciation recording metadata
  pronunciationId?: string; // backend saved filename (uniqueId.ext)
  pronunciationUrl?: string; // playable URL, e.g., /static/audio/<filename>
}

export interface Family {
  id: string;
  gotra: string;
  // Optional gotra pronunciation recording metadata
  gotraPronunciationId?: string; // backend saved filename (uniqueId.ext)
  gotraPronunciationUrl?: string; // playable URL
  members: FamilyMember[];
}

// Align with FastAPI models
export type PaymentStatus = "pending" | "success" | "failed" | "refunded" | "canceled" | "completed";

export interface NameWithPronunciation {
  name: string;
  pronunciationAudio?: string | null; // store filename only (no URL)
  pronunciationMp3?: string | null;   // store filename only (no URL)
}

export interface BookingFamilyRequest {
  gotraDetails: NameWithPronunciation;
  memberDetails: NameWithPronunciation[];
}

export interface BookingRequest {
  bookingId?: string; // optional: include existing bookingId when resubmitting/continuing
  userEmail: string;
  pujaType: string;
  preferredDatetime?: string; // e.g. "20250821150310129"
  families: BookingFamilyRequest[];
  paymentStatus?: PaymentStatus;
  paymentMethod?: string | null;
  amountPaid?: number | null;
  currency?: string | null;
  discountCode?: string | null;
  discountAmount?: number | null;
  finalAmount?: number | null;
  isDiscount?: boolean | null;
  donation?: number | null;
  sessionId?: string | null;
  invoiceId?: string | null;
  isDeleted?: boolean | null;
  pujariId?: string | null;
  pujariName?: string | null;
}

// Legacy response family shape from older endpoints (keep if needed elsewhere)
export interface BookingFamily {
  gotra: string;
  members: string[];
}

export interface BookingResponse {
  bookingId: string;
  id?: string;
  status: string;
  paymentLink?: string;
}

export interface Pujari {
  id: string;
  name: string;
  image: string;
  tagline: string;
}

export interface BookingStore {
  currentBooking: Partial<BookingRequest>;
  selectedPujari: Pujari | null;
  families: Family[];
  discountCode: string;
  discountAmount: number;
  finalAmount: number | null;
  lastBooking?: BookingResponse;

  setSelectedPujari: (pujari: Pujari) => void;
  setPujaDetails: (pujaType: string, date: string, time: string) => void;
  addFamily: (family: Family) => void;
  updateFamily: (familyId: string, updates: Partial<Family>) => void;
  removeFamily: (familyId: string) => void;
  applyDiscount: (code: string) => Promise<number>;
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
}
