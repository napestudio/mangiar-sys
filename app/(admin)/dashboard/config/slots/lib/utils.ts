import { DAYS } from "./time-slots";

/**
 * Formats a 24-hour time string or Date to 12-hour format with AM/PM
 */
export function formatTime(time: string | Date): string {
  if (!time) return "";

  let timeString: string;

  // If it's a Date object, extract the time portion using UTC to avoid timezone issues
  if (time instanceof Date) {
    const hours = time.getUTCHours().toString().padStart(2, "0");
    const minutes = time.getUTCMinutes().toString().padStart(2, "0");
    timeString = `${hours}:${minutes}`;
  } else if (typeof time === 'string' && time.includes('T')) {
    // If it's an ISO string, extract just the time portion (HH:mm)
    timeString = time.substring(11, 16);
  } else {
    timeString = time;
  }

  return timeString;
}

/**
 * Converts an array of day values to a human-readable string
 */
export function getDayBadges(days: string[]): string {
  if (days.length === 7) return "Todos los días";
  if (
    days.length === 5 &&
    !days.includes("saturday") &&
    !days.includes("sunday")
  )
    return "Días de semana";
  if (days.length === 2 && days.includes("saturday") && days.includes("sunday"))
    return "Días de semana";

  return days
    .map((day) => DAYS.find((d) => d.value === day)?.short)
    .filter(Boolean)
    .join(", ");
}

function _toMinutes(t: Date | string): number {
  if (typeof t === 'string') {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }
  return t.getUTCHours() * 60 + t.getUTCMinutes();
}

/**
 * Checks if two time ranges overlap, correctly handling cross-midnight ranges
 * (e.g. 20:00–00:30). Uses minutes-since-midnight with 24h-shift alignment.
 */
export function doTimesOverlap(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): boolean {
  let s1 = _toMinutes(start1);
  let e1 = _toMinutes(end1);
  let s2 = _toMinutes(start2);
  let e2 = _toMinutes(end2);

  // Normalize cross-midnight ranges
  if (e1 <= s1) e1 += 1440;
  if (e2 <= s2) e2 += 1440;

  // Check overlap in direct alignment and both 24h-shifted alignments
  return (
    (s1 < e2 && s2 < e1) ||
    (s1 + 1440 < e2 && s2 < e1 + 1440) ||
    (s1 < e2 + 1440 && s2 + 1440 < e1)
  );
}

/**
 * Checks if two arrays of days have any common days
 */
export function haveCommonDays(days1: string[], days2: string[]): boolean {
  return days1.some((day) => days2.includes(day));
}

/**
 * Checks if two time slots overlap (same day + overlapping times)
 */
export function doTimeSlotsOverlap(
  slot1: { startTime: Date | string; endTime: Date | string; daysOfWeek: string[] },
  slot2: { startTime: Date | string; endTime: Date | string; daysOfWeek: string[] }
): boolean {
  // Check if they share at least one common day
  if (!haveCommonDays(slot1.daysOfWeek, slot2.daysOfWeek)) {
    return false;
  }

  // Check if their time ranges overlap
  return doTimesOverlap(slot1.startTime, slot1.endTime, slot2.startTime, slot2.endTime);
}
