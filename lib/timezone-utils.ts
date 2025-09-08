import { format, startOfDay, startOfWeek, startOfMonth, subDays, subMonths } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { getTradingPeriods, getTimeframeTimestamps as getTradingPeriodsTimestamps, isSundayInTimezone as isSundayInTradingPeriods, type TimeframeTimestamps as TradingPeriodsTimestamps } from './trading-periods';

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
  { value: 'Europe/Berlin', label: 'Frankfurt (Central European)', abbreviation: 'CET/CEST' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', abbreviation: 'HKT' },
  { value: 'Asia/Singapore', label: 'Singapore', abbreviation: 'SGT' }
];

export const DEFAULT_TIMEZONE = 'UTC';

/**
 * Get timezone-adjusted timestamps for timeframe calculations
 */
export type TimeframeTimestamps = TradingPeriodsTimestamps;

export function getTimeframeTimestamps(timezone: string = DEFAULT_TIMEZONE, currencyOrPair: string = 'EURUSD'): TimeframeTimestamps {
  // Use the new trading periods utility for UTC-consistent calculations
  return getTradingPeriodsTimestamps(timezone, currencyOrPair);
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
 * Check if a given date/time represents a valid forex trading session
 * Forex markets are typically open from Sunday 22:00 UTC to Friday 22:00 UTC
 */
export function isValidTradingSession(date: Date): boolean {
  const utcDay = date.getUTCDay();
  const utcHour = date.getUTCHours();
  
  // Saturday is always closed
  if (utcDay === 6) {
    return false;
  }
  
  // Sunday opens at 22:00 UTC
  if (utcDay === 0 && utcHour < 22) {
    return false;
  }
  
  // Friday closes at 22:00 UTC
  if (utcDay === 5 && utcHour >= 22) {
    return false;
  }
  
  return true;
}

/**
 * Check if yesterday was a valid trading day
 * Returns true if yesterday had trading sessions, false for weekends/holidays
 */
export function wasYesterdayTradingDay(timezone: string = DEFAULT_TIMEZONE): boolean {
  const timestamps = getTimeframeTimestamps(timezone);
  return isValidTradingSession(timestamps.yesterdayStart);
}

/**
 * Get current date and time in the user's selected timezone
 */
export function getCurrentInTimezone(timezone: string = DEFAULT_TIMEZONE): {
  date: Date;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  hour: number;
  minute: number;
} {
  const nowUtc = new Date();
  const nowInTimezone = toZonedTime(nowUtc, timezone);
  
  return {
    date: nowInTimezone,
    dayOfWeek: nowInTimezone.getDay(),
    hour: nowInTimezone.getHours(),
    minute: nowInTimezone.getMinutes()
  };
}

/**
 * Check if it's Sunday in the user's timezone
 */
export function isSundayInTimezone(timezone: string = DEFAULT_TIMEZONE): boolean {
  // Use the new trading periods utility for consistent timezone handling
  return isSundayInTradingPeriods(timezone);
}

/**
 * Get current market session based on timezone (improved forex market hours)
 */
export function getCurrentMarketSession(timezone: string = DEFAULT_TIMEZONE): string {
  const now = new Date();
  
  if (!isValidTradingSession(now)) {
    return 'Off Hours';
  }
  
  const utcHour = now.getUTCHours();
  
  // Forex trading sessions in UTC
  if (utcHour >= 22 || utcHour < 8) {
    return 'Sydney/Tokyo Session';
  } else if (utcHour >= 8 && utcHour < 15) {
    return 'London Session';
  } else if (utcHour >= 13 && utcHour < 22) {
    return 'NY Session';
  }
  
  return 'Off Hours';
}

/**
 * Get comprehensive trading periods for a currency pair
 * Uses the new UTC-consistent trading periods utility
 */
export function getCurrencyTradingPeriods(currencyOrPair: string, inputDate?: Date | string | null) {
  return getTradingPeriods(currencyOrPair, inputDate);
}
