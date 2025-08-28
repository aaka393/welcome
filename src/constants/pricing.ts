// Centralized pricing model for multi-currency support
export type SupportedCurrency = 'INR' | 'USD' | 'GBP';

export type CurrencyPricing = {
  base: number; // Regular price (will be shown struck-through)
  intro: number; // Introductory offer price (used in totals)
  additionalFamily: number; // Per family added
  symbol: string; // Currency symbol for display
  code: SupportedCurrency;
};

export const PRICING: Record<SupportedCurrency, CurrencyPricing> = {
  INR: { base: 4499, intro: 999, additionalFamily: 199, symbol: '₹', code: 'INR' },
  USD: { base: 49, intro: 19, additionalFamily: 5, symbol: '$', code: 'USD' },
  GBP: { base: 49, intro: 19, additionalFamily: 5, symbol: '£', code: 'GBP' },
};

export const formatMoney = (amount: number, currency: SupportedCurrency): string => {
  const { symbol } = PRICING[currency];
  // Keep integers when possible; otherwise, max 2 decimals
  const isInt = Number.isInteger(amount);
  const formatted = isInt ? amount.toString() : amount.toFixed(2);
  return `${symbol}${formatted}`;
};
