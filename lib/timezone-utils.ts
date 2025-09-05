import { format, startOfDay, startOfWeek, startOfMonth, subDays, subMonths } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export interface TimezoneInfo {
  value: string;
  label: string;
  abbreviation: string;
}

export const TRADING_TIMEZONES: TimezoneInfo[] = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', abbreviation: 'UTC' },
  { value: 'America/New_York', label: 'New York (Eastern)', abbreviation: 'EST/EDT' },
  { value: 'Europe/London', label: 'London (Greenwich)', abbreviation: 'GMT/BST' },
  { value: 'Asia/Tokyo', label: 'Tokyo (Japan)', abbreviation: 'JST' },
  { value: 'Australia/Sydney', label: 'Sydney (Australian Eastern)', abbreviation: 'AEST/AEDT' },
  { value: 'Europe/Frankfurt', label: 'Frankfurt (Central European)', abbreviation: 'CET/CEST' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', abbreviation: 'HKT' },
  { value: 'Asia/Singapore', label: 'Singapore', abbreviation: 'SGT' }
];

export const DEFAULT_TIMEZONE = 'UTC';

/**
 * Get timezone-adjusted timestamps for timeframe calculations
 */
export interface TimeframeTimestamps {
  now: Date;
  todayStart: Date;
  yesterdayStart: Date;
  yesterdayEnd: Date;
  weekStart: Date;
  monthStart: Date;
  prevMonthStart: Date;
  prevMonthEnd: Date;
}

export function getTimeframeTimestamps(timezone: string = DEFAULT_TIMEZONE): TimeframeTimestamps {
  const nowUtc = new Date();
  const nowInTimezone = toZonedTime(nowUtc, timezone);
  
  // Get start of periods in the target timezone
  const todayStartInTimezone = startOfDay(nowInTimezone);
  const yesterdayInTimezone = subDays(nowInTimezone, 1);
  const yesterdayStartInTimezone = startOfDay(yesterdayInTimezone);
  
  // Week starts on Monday
  const weekStartInTimezone = startOfWeek(nowInTimezone, { weekStartsOn: 1 });
  
  const monthStartInTimezone = startOfMonth(nowInTimezone);
  const prevMonthDate = subMonths(nowInTimezone, 1);
  const prevMonthStartInTimezone = startOfMonth(prevMonthDate);
  
  // Convert back to UTC for consistent API usage
  return {
    now: fromZonedTime(nowInTimezone, timezone),
    todayStart: fromZonedTime(todayStartInTimezone, timezone),
    yesterdayStart: fromZonedTime(yesterdayStartInTimezone, timezone),
    yesterdayEnd: fromZonedTime(startOfDay(nowInTimezone), timezone), // Today start = yesterday end
    weekStart: fromZonedTime(weekStartInTimezone, timezone),
    monthStart: fromZonedTime(monthStartInTimezone, timezone),
    prevMonthStart: fromZonedTime(prevMonthStartInTimezone, timezone),
    prevMonthEnd: fromZonedTime(monthStartInTimezone, timezone), // Current month start = prev month end
  };
}

/**
 * Format a date in a specific timezone
 */
export function formatInTimezone(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE,
  formatStr: string = 'MMM dd, yyyy HH:mm:ss zzz'
): string {
  return formatInTimeZone(date, timezone, formatStr);
}

/**
 * Get timezone abbreviation for display
 */
export function getTimezoneAbbreviation(timezone: string = DEFAULT_TIMEZONE): string {
  const timezoneInfo = TRADING_TIMEZONES.find(tz => tz.value === timezone);
  return timezoneInfo?.abbreviation || timezone;
}

/**
 * Convert a UTC date to a specific timezone
 */
export function convertToTimezone(utcDate: Date, timezone: string = DEFAULT_TIMEZONE): Date {
  return toZonedTime(utcDate, timezone);
}

/**
 * Convert a timezone date to UTC
 */
export function convertToUtc(localDate: Date, timezone: string = DEFAULT_TIMEZONE): Date {
  return fromZonedTime(localDate, timezone);
}

/**
 * Check if a date falls within a timeframe in a specific timezone
 */
export function isDateInTimeframe(
  date: Date,
  timeframe: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'prevMonth',
  timezone: string = DEFAULT_TIMEZONE
): boolean {
  const timestamps = getTimeframeTimestamps(timezone);
  
  switch (timeframe) {
    case 'today':
      return date >= timestamps.todayStart && date <= timestamps.now;
    case 'yesterday':
      return date >= timestamps.yesterdayStart && date < timestamps.yesterdayEnd;
    case 'thisWeek':
      return date >= timestamps.weekStart && date <= timestamps.now;
    case 'thisMonth':
      return date >= timestamps.monthStart && date <= timestamps.now;
    case 'prevMonth':
      return date >= timestamps.prevMonthStart && date < timestamps.prevMonthEnd;
    default:
      return false;
  }
}

/**
 * Get current market session based on timezone
 */
export function getCurrentMarketSession(timezone: string = DEFAULT_TIMEZONE): string {
  const nowInTimezone = toZonedTime(new Date(), timezone);
  const hour = nowInTimezone.getHours();
  
  // Define trading sessions (24-hour format)
  if (timezone.includes('New_York') || timezone.includes('America')) {
    if (hour >= 9 && hour < 16) return 'NY Session';
  } else if (timezone.includes('London') || timezone.includes('Europe')) {
    if (hour >= 8 && hour < 16) return 'London Session';
  } else if (timezone.includes('Tokyo') || timezone.includes('Asia')) {
    if (hour >= 9 && hour < 15) return 'Tokyo Session';
  } else if (timezone.includes('Sydney') || timezone.includes('Australia')) {
    if (hour >= 9 && hour < 17) return 'Sydney Session';
  }
  
  return 'Off Hours';
}
