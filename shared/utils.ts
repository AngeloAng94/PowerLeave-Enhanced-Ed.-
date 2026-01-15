/**
 * Normalize a date to midnight UTC to avoid timezone issues
 * All dates in Power Leave are treated as date-only, not datetime
 */
export function normalizeDate(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Format a date as YYYY-MM-DD string for database storage
 */
export function formatDateString(date: Date | string): string {
  const d = normalizeDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if two date ranges overlap
 * Returns true if any day is shared between the two ranges
 */
export function dateRangesOverlap(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): boolean {
  const s1 = normalizeDate(start1);
  const e1 = normalizeDate(end1);
  const s2 = normalizeDate(start2);
  const e2 = normalizeDate(end2);

  // Two ranges overlap if one starts before or on the day the other ends
  // and the other starts before or on the day the first one ends
  return s1 <= e2 && s2 <= e1;
}

/**
 * Calculate number of days between two dates (inclusive)
 */
export function daysBetween(start: Date | string, end: Date | string): number {
  const s = normalizeDate(start);
  const e = normalizeDate(end);
  const diffTime = e.getTime() - s.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

/**
 * Convert hours to working days
 * 8H = 1 day, 4H = 0.5 days, 2H = 0.25 days
 */
export function hoursToDays(hours: number): number {
  return hours / 8;
}
