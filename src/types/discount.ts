export type Currency = 'INR' | 'USD' | 'GBP';

export interface DiscountCode {
  code: string;
  value: number;
  discountAmount: number;
  finalAmount?: number;
  discountType: 'Percentage' | 'Fixed';
  expiryDate: string;
  status: 'Active' | 'Inactive';
  usageCount: number;
  // Backend includes these; optional here to allow reuse in validation flows that don't return full object
  currency?: Currency;
  maxEntries?: number;
}

export interface CreateDiscountCodeRequest {
  code: string;
  value: number;
  discountType: 'Percentage' | 'Fixed';
  expiryDate: string;
  status: 'Active' | 'Inactive';
  usageCount: number;
  currency: Currency;
  maxEntries?: number;
}

// Must match backend Models.DiscountUpdate (cannot change currency/maxEntries on update)
export interface UpdateDiscountCodeRequest {
  value: number;
  discountType: 'Percentage' | 'Fixed';
  expiryDate: string;
  status: 'Active' | 'Inactive';
}

export interface ValidateDiscountCodeRequest {
  code: string;
  bookingId: string;
}

export interface ValidateDiscountCodeResponse {
  valid: boolean;
  discount?: DiscountCode;
  discountAmount?: number;
  finalAmount?: number;
  error?: string;
}

export interface DiscountCodeApiResponse {
  success: boolean;
  data?: DiscountCode[];
  error?: string;
}

