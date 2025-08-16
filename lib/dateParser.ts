// lib/dateParser.ts
// Utility functions for parsing and formatting dates

/**
 * Parses various date formats and returns a valid Date object
 * @param dateString - The date string to parse
 * @returns A valid Date object or null if parsing fails
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;

  const cleanDate = dateString.trim().toLowerCase();
  
  // Handle relative dates
  if (cleanDate === 'today') {
    return new Date();
  }
  
  if (cleanDate === 'tomorrow') {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  if (cleanDate === 'day after tomorrow' || cleanDate === 'day after') {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    return dayAfter;
  }
  
  // Handle "next week", "next month", etc.
  if (cleanDate.includes('next week')) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }
  
  if (cleanDate.includes('next month')) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  }

  // Handle ordinal dates like "28th of August", "August 28th", etc.
  const ordinalMatch = cleanDate.match(/(\d+)(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)(?:\s+(\d{4}))?/i);
  if (ordinalMatch) {
    const day = parseInt(ordinalMatch[1]);
    const monthName = ordinalMatch[2];
    const year = ordinalMatch[3] ? parseInt(ordinalMatch[3]) : new Date().getFullYear();
    
    const monthIndex = getMonthIndex(monthName);
    if (monthIndex !== -1) {
      const date = new Date(year, monthIndex, day);
      // Check if the date is valid
      if (date.getDate() === day && date.getMonth() === monthIndex && date.getFullYear() === year) {
        return date;
      }
    }
  }

  // Handle "August 28" format
  const monthDayMatch = cleanDate.match(/([a-z]+)\s+(\d+)(?:\s+(\d{4}))?/i);
  if (monthDayMatch) {
    const monthName = monthDayMatch[1];
    const day = parseInt(monthDayMatch[2]);
    const year = monthDayMatch[3] ? parseInt(monthDayMatch[3]) : new Date().getFullYear();
    
    const monthIndex = getMonthIndex(monthName);
    if (monthIndex !== -1) {
      const date = new Date(year, monthIndex, day);
      if (date.getDate() === day && date.getMonth() === monthIndex && date.getFullYear() === year) {
        return date;
      }
    }
  }

  // Handle ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    const date = new Date(cleanDate);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Handle DD/MM/YYYY or MM/DD/YYYY format
  const slashMatch = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1]);
    const month = parseInt(slashMatch[2]) - 1; // Month is 0-indexed
    const year = parseInt(slashMatch[3]);
    
    const date = new Date(year, month, day);
    if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
      return date;
    }
  }

  // Try parsing with Date constructor as fallback
  const fallbackDate = new Date(cleanDate);
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate;
  }

  return null;
}

/**
 * Converts a month name to its 0-indexed number
 * @param monthName - The month name (case insensitive)
 * @returns The month index (0-11) or -1 if not found
 */
function getMonthIndex(monthName: string): number {
  const months: { [key: string]: number } = {
    'january': 0, 'jan': 0,
    'february': 1, 'feb': 1,
    'march': 2, 'mar': 2,
    'april': 3, 'apr': 3,
    'may': 4,
    'june': 5, 'jun': 5,
    'july': 6, 'jul': 6,
    'august': 7, 'aug': 7,
    'september': 8, 'sep': 8, 'sept': 8,
    'october': 9, 'oct': 9,
    'november': 10, 'nov': 10,
    'december': 11, 'dec': 11
  };
  
  return months[monthName.toLowerCase()] ?? -1;
}

/**
 * Formats a date for display
 * @param date - The date to format
 * @returns A formatted date string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formats a date for API calls (YYYY-MM-DD)
 * @param date - The date to format
 * @returns A date string in YYYY-MM-DD format
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Checks if a date is in the future
 * @param date - The date to check
 * @returns True if the date is in the future
 */
export function isFutureDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date > today;
}