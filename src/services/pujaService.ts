import { Pujari } from "../types";
import { CreatePujaSegmentRequest, PujaSegmentResponse } from "../types/puja";
import { serviceBaseUrl } from "../constants/appConstants";
import axios from "axios";
import { availablePujaris } from "./api";

export const pujaService = {
  // Get all available pujaris
  getPujaris: async (): Promise<Pujari[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay
    return availablePujaris;
  },

  // Get puja types
  getPujaTypes: async (): Promise<string[]> => {
    return ["Ganesh Chaturthi"];
  },

  // Create puja segment (admin only)
  createPujaSegment: async (
    segmentData: CreatePujaSegmentRequest
  ): Promise<PujaSegmentResponse> => {
    try {
      const response = await axios.post(
        `${serviceBaseUrl}/puja-segments`,
        segmentData,
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          data: response.data.result || response.data,
        };
      }

      return {
        success: false,
        error: response.data.message || "Failed to create puja segment",
      };
    } catch (error: unknown) {
      console.error("Failed to create puja segment:", error);
      return {
        success: false,
        error: (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
          (error as Error).message ||
          "Failed to create puja segment",
      };
    }
  },

  // Create payment by Razorpay - posts order payload to /order
  createPaymentByRazorpay: async (order: {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
    bookingId?: string;
  }): Promise<{
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
  }> => {
    try {
      const response = await axios.post(`${serviceBaseUrl}/order`, order, {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        withCredentials: true,
      });

      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          data: response.data.result || response.data,
        };
      }

      return {
        success: false,
        error: response.data?.message || "Failed to create order",
      };
    } catch (error: unknown) {
      console.error("Failed to create order:", error);
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            // try to safely read message from axios response
            ((error.response as unknown as { data?: Record<string, unknown> })
              ?.data?.message as string | undefined) ||
            error.message ||
            "Failed to create order",
        };
      }

      return {
        success: false,
        error: (error as Error).message || "Failed to create order",
      };
    }
  },

  verifyPayment: async (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const response = await axios.post(
      `${serviceBaseUrl}/payments/payment/verify`,
      paymentData
    );
    return response.data.result;
  },

  // Stripe: create PaymentIntent
  createStripePaymentIntent: async (payload: {
    amount: number; // base unit (e.g., 12.34 -> 12.34)
    currency: string; // 'USD' | 'GBP'
    receipt: string;
    notes?: Record<string, string>;
    bookingId?: string;
  }) => {
    const response = await axios.post(
      `${serviceBaseUrl}/payment-intent/create`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        withCredentials: true,
      }
    );
    return response.data.result;
  },

  // Stripe: verify PaymentIntent
  verifyStripePaymentIntent: async (paymentIntentId: string) => {
    const response = await axios.post(
      `${serviceBaseUrl}/payment-intent/verify`,
      null,
      { params: { paymentIntentId }, withCredentials: true }
    );
    return response.data.result;
  },
};
