/**
 * Converts a JavaScript Date to backend format: YYYYMMDDHHMMSSMMM
 * Example: 20250821144706721
 */
export const dateToBackendFormat = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
};

/**
 * Converts backend date format to JavaScript Date
 * Example: 20250821144706721 -> Date object
 */
export const backendFormatToDate = (backendDate: string): Date => {
  if (backendDate.length !== 17) {
    throw new Error('Invalid backend date format');
  }
  
  const year = parseInt(backendDate.substring(0, 4));
  const month = parseInt(backendDate.substring(4, 6)) - 1; // Month is 0-indexed
  const day = parseInt(backendDate.substring(6, 8));
  const hours = parseInt(backendDate.substring(8, 10));
  const minutes = parseInt(backendDate.substring(10, 12));
  const seconds = parseInt(backendDate.substring(12, 14));
  const milliseconds = parseInt(backendDate.substring(14, 17));
  
  return new Date(year, month, day, hours, minutes, seconds, milliseconds);
};

/**
 * Formats a date for display in the UI
 */
export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formats backend date string for display
 */
export const formatBackendDateForDisplay = (backendDate: string): string => {
  try {
    const date = backendFormatToDate(backendDate);
    return formatDateForDisplay(date);
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Validates if a date is in the future
 */
export const isFutureDate = (date: Date): boolean => {
  return date.getTime() > new Date().getTime();
};

/**
 * Validates if a backend date string is in the future
 */
export const isBackendDateFuture = (backendDate: string): boolean => {
  try {
    const date = backendFormatToDate(backendDate);
    return isFutureDate(date);
  } catch {
    return false;
  }
};

/**
 * Converts HTML date input value to backend format
 */
export const htmlDateToBackendFormat = (htmlDate: string): string => {
  const date = new Date(htmlDate);
  // Set to end of day for expiry dates
  date.setHours(23, 59, 59, 999);
  return dateToBackendFormat(date);
};

/**
 * Converts backend date to HTML date input format (YYYY-MM-DD)
 */
export const backendDateToHtmlFormat = (backendDate: string): string => {
  try {
    const date = backendFormatToDate(backendDate);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};