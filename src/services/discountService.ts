import axios, { AxiosError, AxiosResponse } from 'axios';
import {
  DiscountCode,
  CreateDiscountCodeRequest,
  UpdateDiscountCodeRequest,
  ValidateDiscountCodeResponse,
  DiscountCodeApiResponse
} from '../types/discount';
import { serviceBaseUrl } from '../constants/appConstants';


// Create axios instance with default config
const apiClient = axios.create({
  baseURL: serviceBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'accept': 'application/json'
  },
  timeout: 10000
});

export const setAuthToken = (token: string) => {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const clearAuthToken = () => {
  delete apiClient.defaults.headers.common['Authorization'];
};

const extractResult = <T>(response: AxiosResponse<{ code: number; message: string; result: T }>): T => {
  return response.data.result;
};

export const adminLogin = async (
  username: string,
  password: string
): Promise<{
  success: boolean;
  data?: {
    id: string;
    username: string;
    email: string;
    role: string;
    createdDate: string;
    keycloakId: string;
  };
  error?: string;
}> => {
  try {
    const response = await apiClient.post('/login', {
      username,
      password
    });

    const { code, result } = response.data;

    if (code === 1003 && result) {
      return {
        success: true,
        data: {
          id: result.id,
          username: result.username,
          email: result.email,
          role: result.role,
          createdDate: result.createdDate,
          keycloakId: result.keycloakId
        }
      };
    }

    return {
      success: false,
      error: response.data.message || 'Unexpected response format'
    };
  } catch (error) {
    console.error('Admin login error:', error);
    return {
      success: false,
      error: (error as AxiosError<{ message?: string; detail?: string }>).response?.data?.message || 
             (error as AxiosError<{ detail?: string }>).response?.data?.detail || 
             (error as Error).message || 
             'Login failed'
    };
  }
};

export const discountService = {
  getAllDiscountCodes: async (): Promise<DiscountCodeApiResponse> => {
    try {
      const response: AxiosResponse<{ code: number; message: string; result: DiscountCode[] }> =
        await apiClient.get('/admin/discount-codes');

      if (response.data.code === 3034 || response.status === 200) {
        return {
          success: true,
          data: response.data.result
        };
      }

      return {
        success: false,
        error: response.data.message || 'Unexpected response code'
      };
    } catch (error) {
      console.error('Failed to fetch discount codes:', error);
      return {
        success: false,
        error: (error as AxiosError<{ detail?: string }>).response?.data?.detail || (error as Error).message || 'Failed to fetch discount codes'
      };
    }
  }
  ,

  // Create new discount code
  createDiscountCode: async (
    discountCode: CreateDiscountCodeRequest
  ): Promise<{ success: boolean; data?: DiscountCode; error?: string }> => {
    try {
      const response: AxiosResponse<{ code: number; message: string; result: DiscountCode }> =
        await apiClient.post('/admin/discount-code', discountCode);

      // Adjust the success check to match response code 3026
      if (response.data.code === 3026) {
        return {
          success: true,
          data: extractResult<DiscountCode>(response)
        };
      }

      return {
        success: false,
        error: response.data.message || 'Unexpected response code'
      };
    } catch (error) {
      console.error('Failed to create discount code:', error);
      return {
        success: false,
        error: (error as AxiosError<{ detail?: string }>).response?.data?.detail || (error as Error).message || 'Failed to create discount code'
      };
    }
  },


  updateDiscountCode: async (
    code: string,
    discountCode: UpdateDiscountCodeRequest
  ): Promise<{ success: boolean; data?: DiscountCode; error?: string }> => {
    try {
      const response: AxiosResponse<{ code: number; message: string; result: DiscountCode }> =
        await apiClient.put(`/admin/discount-code/${code}`, discountCode);

      // Check for success code 3030
      if (response.data.code === 3030) {
        return {
          success: true,
          data: extractResult<DiscountCode>(response)
        };
      }

      return {
        success: false,
        error: response.data.message || 'Unexpected response code'
      };
    } catch (error) {
      console.error('Failed to update discount code:', error);
      return {
        success: false,
        error: (error as AxiosError<{ detail?: string }>).response?.data?.detail || (error as Error).message || 'Failed to update discount code'
      };
    }
  },

  deleteDiscountCode: async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.delete(`/admin/discount-code/${code}`);

      // Check for success code (assuming similar pattern)
      if (response.data?.code === 3031 || response.status === 200) {
        return { success: true };
      }

      return {
        success: false,
        error: response.data?.message || 'Unexpected response'
      };
    } catch (error) {
      console.error('Failed to delete discount code:', error);
      return {
        success: false,
        error: (error as AxiosError<{ detail?: string }>).response?.data?.detail || (error as Error).message || 'Failed to delete discount code'
      };
    }
  },

  // Validate discount code without bookingId (for booking page)
  validateDiscountCode: async (
    code: string,
    basePrice: number,
    currency: string = 'INR'
  ): Promise<ValidateDiscountCodeResponse> => {
    try {
      const response: AxiosResponse<{ code: number; message: string; result: { discountAmount: number; finalAmount: number; currency?: string; maxEntries?: number } }> =
        await apiClient.post('/validate', { 
          code, 
          basePrice,
          currency
        });

      if (response.data.code === 3037) {
        return {
          valid: true,
          discount: {
            code: code,
            value: 0, // Will be calculated from discountAmount
            discountAmount: response.data.result.discountAmount,
            finalAmount: response.data.result.finalAmount,
            discountType: 'Fixed', // Default, will be updated based on calculation
            expiryDate: '',
            status: 'Active',
            usageCount: 0,
            currency: (response.data.result.currency as unknown as DiscountCode['currency']),
            maxEntries: response.data.result.maxEntries
          },
          discountAmount: response.data.result.discountAmount,
          finalAmount: response.data.result.finalAmount
        };
      }

      return {
        valid: false,
        error: response.data.message || 'Invalid discount code'
      };
    } catch (error) {
      console.error('Failed to validate discount code:', error);
      
      const axiosErr = error as AxiosError<{ code?: number; detail?: string }>;
      if (axiosErr.response?.data?.code === 3029) {
        return {
          valid: false,
          error: 'Discount code not found or invalid'
        };
      }
      
      return {
        valid: false,
        error: axiosErr.response?.data?.detail || (error as Error).message || 'Invalid discount code'
      };
    }
  },

  // Validate discount code with bookingId (for payment page)

validateDiscountCodeWithBookingId: async (
  code: string,
  bookingId: string,
  basePrice?: number,
  currency: string = 'INR'
): Promise<ValidateDiscountCodeResponse> => {
  try {
    const totalAmount = basePrice || 999; // Use provided basePrice or default
    
    // send bookingId in body instead of query param
    const response: AxiosResponse<{ code: number; message: string; result: DiscountCode & { discountAmount: number; finalAmount: number; currency?: string; maxEntries?: number } }> =
      await apiClient.post('/validateDiscount', { 
        code, 
        bookingId,
        basePrice: totalAmount,
        currency
      });

    if (response.data.code === 3037) {
      return {
        valid: true,
        discount: {
          ...(response.data.result as DiscountCode),
          code: code,
          discountAmount: response.data.result.discountAmount,
          finalAmount: response.data.result.finalAmount,
          currency: response.data.result.currency,
          maxEntries: response.data.result.maxEntries
        },
        discountAmount: response.data.result.discountAmount,
        finalAmount: response.data.result.finalAmount
      };
    }

    return {
      valid: false,
      error: response.data.message || 'Invalid discount code'
    };
  } catch (error) {
    console.error('Failed to validate discount code:', error);
    const axiosErr = error as AxiosError<{ code?: number; detail?: string }>;
    if (axiosErr.response?.data?.code === 3029) {
      return {
        valid: false,
        error: 'Discount code not found or invalid'
      };
    }
    
    return {
      valid: false,
      error: axiosErr.response?.data?.detail || (error as Error).message || 'Invalid discount code'
    };
  }
}

  };

export { apiClient };