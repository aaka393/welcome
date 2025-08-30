import axios from 'axios';
import { serviceBaseUrl } from '../constants/appConstants';

export interface UserMetaForCurrency {
	userId: string;
	country: string;
	currency: string;
}

type SuccessResponse = {
	status: 'success';
	result: UserMetaForCurrency;
};

type ErrorResponse = {
	status: 'error';
	message?: string;
};

export type UserMetaForCurrencyResponse = SuccessResponse | ErrorResponse;

/**
 * Fetch user metadata for currency selection.
 * - Server derives country (and hence currency) from client IP
 * - Optionally pass x-user-id header if you have an authenticated user ID
 */
export const getUserMetaForCurrency = async (
	userId?: string
): Promise<UserMetaForCurrency> => {
	try {
		const headers: Record<string, string> = { accept: 'application/json' };
		if (userId) headers['x-user-id'] = userId;

		const res = await axios.get<UserMetaForCurrencyResponse>(
			`${serviceBaseUrl}/usermetaForCurrency`,
			{ headers }
		);

		if (res.data && res.data.status === 'success') {
			return (res.data as SuccessResponse).result;
		}

		const message = (res.data as ErrorResponse)?.message || 'Failed to resolve user metadata';
		throw new Error(message);
		} catch (error: unknown) {
			// Normalize error message similar to other services
				if (axios.isAxiosError(error)) {
					const data = error.response?.data;
					let serverMessage: string | undefined;
					if (typeof data === 'object' && data !== null && 'message' in data) {
						const maybeMsg = (data as { message?: unknown }).message;
						serverMessage = typeof maybeMsg === 'string' ? maybeMsg : undefined;
					}
					const message = serverMessage || error.message || 'Failed to resolve user metadata';
					throw new Error(message);
				}
			throw new Error('Failed to resolve user metadata');
		}
};

export default {
	getUserMetaForCurrency,
};

