/* eslint-disable @typescript-eslint/no-explicit-any */
// services/bookingService.ts
import axios from "axios";
import { BookingRequest, BookingResponse, BookingFamilyRequest, PaymentStatus } from "../types";
import { serviceBaseUrl } from "../constants/appConstants";

// Backend booking interface to match FastAPI UserBooking response
export interface BackendBooking {
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

interface BackendBookingResponse {
  code: number;
  message: string;
  result: BackendBooking[];
}


export const bookingService = {
  createBooking: async (data: BookingRequest): Promise<BookingResponse> => {
    const res = await axios.post(`${serviceBaseUrl}/booking`, data, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data.result;
  },

  // Get user bookings by email
  getUserBookingsByEmail: async (email: string): Promise<BackendBooking[]> => {
    try {
      const encodedEmail = encodeURIComponent(email);
      const response = await axios.get<BackendBookingResponse>(
        `${serviceBaseUrl}/user/${encodedEmail}/bookings`,
        {
          headers: {
            'accept': 'application/json'
          }
        }
      );

      if (response.data.code === 3003) {
        return response.data.result;
      }

      throw new Error(response.data.message || 'Failed to fetch bookings');
    } catch (error: any) {
      console.error('Error fetching user bookings:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch bookings');
    }
  },


  // Get single booking by bookingId
  getBookingById: async (bookingId: string): Promise<BackendBooking | null> => {
    try {
      const response = await axios.get<BackendBookingResponse>(
        `${serviceBaseUrl}/userBooking?bookingId=${bookingId}`,
        {
          headers: {
            'accept': 'application/json'
          }
        }
      );

      if (response.data.code === 3003 && response.data.result.length > 0) {
        return response.data.result[0];
      }

      return null;
    } catch (error: any) {
      console.error('Error fetching booking by ID:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch booking');
    }
  }
};
