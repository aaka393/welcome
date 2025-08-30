import axios, { AxiosResponse } from 'axios';
import { serviceBaseUrl } from '../constants/appConstants';
import { BookingRequest, BookingFamilyRequest, PaymentStatus } from '../types';

// Mirror backend booking shape (aligned with FastAPI UserBooking)
export interface AdminBackendBooking {
  userEmail: string;
  pujaType: string;
  preferredDatetime?: string | null;
  families: BookingFamilyRequest[];
  paymentStatus: PaymentStatus;
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
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface AdminBookingsResponse {
  code: number;
  message: string;
  result: AdminBackendBooking[];
}

export interface AdminUsersWithBookingsItem {
  id: string;
  name: string;
  email: string;
  totalBookings: number;
  bookings: AdminBackendBooking[];
}

export interface AdminUsersWithBookingsResponse {
  code: number;
  message: string;
  result: AdminUsersWithBookingsItem[];
}

export const adminBookingService = {
  // Admin: list bookings with filters
  async getAllBookings(filters?: { userEmail?: string; pujaType?: string; paymentStatus?: string }): Promise<AdminBackendBooking[]> {
    const params = new URLSearchParams();
    if (filters?.userEmail) params.set('userEmail', filters.userEmail);
    if (filters?.pujaType) params.set('pujaType', filters.pujaType);
    if (filters?.paymentStatus) params.set('paymentStatus', filters.paymentStatus);

    const url = `${serviceBaseUrl}/admin/bookings${params.toString() ? `?${params.toString()}` : ''}`;
    const res: AxiosResponse<AdminBookingsResponse> = await axios.get(url, {
      headers: { accept: 'application/json' },
    });
    if (res.data.code === 3008) return res.data.result;
    throw new Error(res.data.message || 'Failed to fetch bookings');
  },

  // Admin: users with booking summaries
  async getUsersWithBookings(filters?: { userEmail?: string; pujaType?: string; paymentStatus?: string }): Promise<AdminUsersWithBookingsItem[]> {
    const params = new URLSearchParams();
    if (filters?.userEmail) params.set('userEmail', filters.userEmail);
    if (filters?.pujaType) params.set('pujaType', filters.pujaType);
    if (filters?.paymentStatus) params.set('paymentStatus', filters.paymentStatus);

    const url = `${serviceBaseUrl}/admin/users${params.toString() ? `?${params.toString()}` : ''}`;
    const res: AxiosResponse<AdminUsersWithBookingsResponse> = await axios.get(url, {
      headers: { accept: 'application/json' },
    });
    if (res.data.code === 3011) return res.data.result;
    throw new Error(res.data.message || 'Failed to fetch users with bookings');
  },

  // Read single booking by id
  async getBookingById(bookingId: string): Promise<AdminBackendBooking | null> {
    const res: AxiosResponse<AdminBookingsResponse> = await axios.get(
      `${serviceBaseUrl}/userBooking?bookingId=${encodeURIComponent(bookingId)}`,
      { headers: { accept: 'application/json' } }
    );
    if (res.data.code === 3003 && Array.isArray(res.data.result) && res.data.result.length > 0) {
      return res.data.result[0];
    }
    return null;
  },

  // Create booking (admin can create using same endpoint)
  async createBooking(payload: BookingRequest): Promise<AdminBackendBooking> {
    const res = await axios.post(`${serviceBaseUrl}/booking`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.data?.code === 3001 && res.data?.result) {
      return res.data.result as AdminBackendBooking;
    }
    // Some environments may proxy directly to the result
    return res.data?.result as AdminBackendBooking;
  },

  // Update booking (PUT /updateBooking?bookingId=...)
  // Backend expects a full UserBooking payload; we merge with current and normalize fields.
  async updateBooking(bookingId: string, bookingData: Partial<AdminBackendBooking>): Promise<AdminBackendBooking[]> {
    // Fetch current booking to construct a complete payload
    const current = await this.getBookingById(bookingId);
    if (!current) {
      throw new Error('Booking not found');
    }

    // Normalize paymentStatus to backend accepted literals
    const normalizeStatus = (status?: string): PaymentStatus => {
      const s = (status || '').toLowerCase();
      if (s === 'completed' || s === 'paid' || s === 'success') return 'success';
      if (s === 'refunded') return 'refunded';
      if (s === 'failed') return 'failed';
      return 'pending';
    };

    // Build a full payload matching api/Models/bookingModel.py::UserBooking
    const payload = {
      userEmail: bookingData.userEmail ?? current.userEmail,
      pujaType: bookingData.pujaType ?? current.pujaType,
  preferredDatetime: bookingData.preferredDatetime ?? current.preferredDatetime ?? null,
  families: bookingData.families ?? current.families ?? [],
  paymentStatus: normalizeStatus((bookingData.paymentStatus as string | undefined) ?? current.paymentStatus),
  paymentMethod: bookingData.paymentMethod ?? current.paymentMethod ?? null,
  amountPaid: bookingData.amountPaid ?? current.amountPaid ?? 0,
  currency: (bookingData.currency ?? current.currency ?? 'INR'),
  discountCode: bookingData.discountCode ?? current.discountCode ?? null,
  discountAmount: bookingData.discountAmount ?? current.discountAmount ?? 0,
  finalAmount: bookingData.finalAmount ?? current.finalAmount ?? 0,
  isDiscount: bookingData.isDiscount ?? current.isDiscount ?? false,
  donation: bookingData.donation ?? (current.donation ?? null),
  sessionId: bookingData.sessionId ?? current.sessionId ?? null,
  invoiceId: bookingData.invoiceId ?? current.invoiceId ?? null,
  isDeleted: bookingData.isDeleted ?? (current.isDeleted ?? false),
  pujariId: bookingData.pujariId ?? current.pujariId ?? null,
  pujariName: bookingData.pujariName ?? current.pujariName ?? null,
    };

    const res: AxiosResponse<{ code: number; message: string; result: AdminBackendBooking[] }> = await axios.put(
      `${serviceBaseUrl}/updateBooking?bookingId=${encodeURIComponent(bookingId)}`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (res.data.code === 3041) {
      return res.data.result;
    }
    throw new Error(res.data.message || 'Failed to update booking');
  },

};
