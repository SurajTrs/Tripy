// src/lib/dateParser.ts
import { parse, addDays, nextMonday, format, isFuture, isPast, startOfDay, isValid } from 'date-fns';
import { enGB } from 'date-fns/locale'; // Ensure locale is imported for consistent parsing

/**
 * Parses a natural language date string and formats it into 'YYYY-MM-DD'.
 * Handles relative dates (tomorrow, next week) and common explicit formats.
 * If a date is in the past and no explicit year is given, it assumes the next year.
 *
 * @param dateString The date string from NLP (e.g., "18 August 2025", "tomorrow").
 * @returns Formatted date 'YYYY-MM-DD' or null if parsing fails.
 */
export function parseAndFormatDate(dateString: string): string | null {
  if (!dateString || typeof dateString !== 'string' || dateString.trim() === '') {
    return null;
  }

  const lowerCaseDate = dateString.toLowerCase().trim();
  const today = startOfDay(new Date()); // Start of today for consistent calculations
  const currentYear = today.getFullYear();

  // --- Handle relative dates ---
  if (lowerCaseDate.includes('today')) {
    return format(today, 'yyyy-MM-dd');
  }
  if (lowerCaseDate.includes('tomorrow')) {
    return format(addDays(today, 1), 'yyyy-MM-dd');
  }
  if (lowerCaseDate.includes('day after tomorrow')) {
    return format(addDays(today, 2), 'yyyy-MM-dd');
  }
  if (lowerCaseDate.includes('next monday')) {
    return format(nextMonday(today), 'yyyy-MM-dd');
  }
  if (lowerCaseDate.includes('next tuesday')) {
    return format(addDays(nextMonday(today), 1), 'yyyy-MM-dd'); // Corrected logic for next Tuesday
  }
  if (lowerCaseDate.includes('next wednesday')) {
    return format(addDays(nextMonday(today), 2), 'yyyy-MM-dd'); // Corrected logic for next Wednesday
  }
  if (lowerCaseDate.includes('next thursday')) {
    return format(addDays(nextMonday(today), 3), 'yyyy-MM-dd'); // Corrected logic for next Thursday
  }
  if (lowerCaseDate.includes('next friday')) {
    return format(addDays(nextMonday(today), 4), 'yyyy-MM-dd'); // Corrected logic for next Friday
  }
  if (lowerCaseDate.includes('next saturday')) {
    return format(addDays(nextMonday(today), 5), 'yyyy-MM-dd'); // Corrected logic for next Saturday
  }
  if (lowerCaseDate.includes('next sunday')) {
    return format(addDays(nextMonday(today), 6), 'yyyy-MM-dd'); // Corrected logic for next Sunday
  }
  // Generic "in X days"
  const inDaysMatch = lowerCaseDate.match(/in\s+(\d+)\s+days?/);
  if (inDaysMatch && inDaysMatch[1]) {
    const days = parseInt(inDaysMatch[1], 10);
    if (!isNaN(days)) {
      return format(addDays(today, days), 'yyyy-MM-dd');
    }
  }

  // --- Try parsing common explicit date formats ---
  const commonFormats = [
    "d MMMM yyyy", "d MMM yyyy", // e.g., "18 August 2025", "18 Aug 2025"
    "MMMM d yyyy", "MMM d yyyy", // e.g., "August 18 2025", "Aug 18 2025"
    "dd-MM-yyyy", "d-M-yyyy", // e.g., "18-08-2025"
    "MM/dd/yyyy", "M/d/yyyy", // e.g., "08/18/2025"
    "yyyy-MM-dd",             // e.g., "2025-08-18"
    "d MMMM", "d MMM",        // e.g., "18 August", "18 Aug" (without year)
    "MMMM d", "MMM d"         // e.g., "August 18", "Aug 18" (without year)
  ];

  for (const fmt of commonFormats) {
    try {
      let parsedDate = parse(dateString, fmt, new Date(), { locale: enGB });

      if (isValid(parsedDate)) {
        // If the parsed date is in the past and no explicit year was given in the string,
        // assume the user means the next occurrence of that date.
        // This is a common pattern for travel dates (e.g., "I want to travel on Dec 25" usually means *this coming* Dec 25, or next year's if this year's has passed).
        if (isPast(parsedDate) && !dateString.match(/\d{4}/) && parsedDate.getFullYear() === currentYear) {
          const nextYearDate = parse(dateString, fmt, new Date(currentYear + 1, 0, 1), { locale: enGB });
          if (isValid(nextYearDate) && (isFuture(nextYearDate) || nextYearDate.getFullYear() > currentYear)) {
            parsedDate = nextYearDate;
          }
        }
        return format(parsedDate, 'yyyy-MM-dd');
      }
   } catch {
  // Ignore and try the next format
  continue;
}

  }

  console.warn(`Could not parse date string: "${dateString}"`);
  return null; // If no format matches
}