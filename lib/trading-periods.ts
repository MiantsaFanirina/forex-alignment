/**
 * TRADING PERIODS UTILITY - TypeScript Version
 * ============================================
 * Comprehensive utility to get current date/time and calculate trading periods
 * based on currency-specific timezones and market hours.
 * 
 * Features:
 * - Currency-specific timezone handling
 * - Daily, Daily-1, Weekly, Monthly, Monthly-1 period calculations
 * - Trading day logic (excludes weekends for forex/commodities/indices)
 * - 24/7 support for crypto currencies
 * - UTC-based consistency to prevent calendar alignment issues
 * - TypeScript interfaces for type safety
 */

// Currency to timezone mappings
export const CURRENCY_TIMEZONES = {
  // Major Forex pairs - use primary trading center timezone
  'USD': 'America/New_York',
  'EUR': 'Europe/London',
  'GBP': 'Europe/London', 
  'JPY': 'Asia/Tokyo',
  'CHF': 'Europe/Zurich',
  'AUD': 'Australia/Sydney',
  'NZD': 'Pacific/Auckland',
  'CAD': 'America/Toronto',
  
  // Crypto - typically UTC but can follow major exchange locations
  'BTC': 'UTC',
  'ETH': 'UTC',
  
  // Commodities - follow major trading centers
  'XAU': 'America/New_York', // Gold
  'XAG': 'America/New_York', // Silver
  'BRENT': 'Europe/London',   // Brent Oil
  'WTI': 'America/New_York',  // WTI Oil
  
  // Indices - follow their respective markets
  'US30': 'America/New_York',  // Dow Jones
  'US100': 'America/New_York', // NASDAQ
  'SPX': 'America/New_York',   // S&P 500
  'UK100': 'Europe/London',    // FTSE 100
  'GER40': 'Europe/Berlin',    // DAX
  'JPN225': 'Asia/Tokyo',      // Nikkei
  
  // Default fallback
  'DEFAULT': 'UTC'
} as const;

// Asset type mappings
export const ASSET_TYPES = {
  // Forex pairs
  'AUDCAD': 'forex', 'AUDCHF': 'forex', 'AUDJPY': 'forex', 'AUDNZD': 'forex', 'AUDUSD': 'forex',
  'CADCHF': 'forex', 'CADJPY': 'forex', 'CHFJPY': 'forex',
  'EURAUD': 'forex', 'EURCAD': 'forex', 'EURCHF': 'forex', 'EURGBP': 'forex', 'EURJPY': 'forex', 'EURNZD': 'forex', 'EURUSD': 'forex',
  'GBPAUD': 'forex', 'GBPCAD': 'forex', 'GBPCHF': 'forex', 'GBPJPY': 'forex', 'GBPNZD': 'forex', 'GBPUSD': 'forex',
  'NZDCAD': 'forex', 'NZDCHF': 'forex', 'NZDJPY': 'forex', 'NZDUSD': 'forex',
  'USDCAD': 'forex', 'USDCHF': 'forex', 'USDJPY': 'forex',
  
  // Crypto
  'BTCUSD': 'crypto', 'ETHUSD': 'crypto', 'XRPUSD': 'crypto',
  
  // Commodities  
  'XAUUSD': 'commodity', 'XAGUSD': 'commodity', 'BRENT': 'commodity', 'WTI': 'commodity',
  
  // Indices
  'US30': 'index', 'US100': 'index', 'SPX': 'index', 'UK100': 'index', 'GER40': 'index', 'JPN225': 'index'
} as const;

// TypeScript interfaces
export type AssetType = 'forex' | 'crypto' | 'commodity' | 'index';
export type CurrencyPair = keyof typeof ASSET_TYPES;

export interface TradingPeriod {
  name: string;
  start: Date;
  end: Date;
  durationDays?: number;
  isWeekend?: boolean;
  tradingActive: boolean;
  isHistorical?: boolean;
}

export interface TradingPeriods {
  daily: TradingPeriod;
  daily1: TradingPeriod;
  weekly: TradingPeriod;
  monthly: TradingPeriod;
  monthly1: TradingPeriod;
}

export interface TradingPeriodsResult {
  // Input parameters
  currency: string;
  assetType: AssetType;
  timezone: string;
  isCrypto: boolean;
  
  // Current date/time information
  utcDateTime: string;
  localDateTime: string;
  utcHour: number;
  
  // Day information
  isWeekend: boolean;
  dayOfWeek: string;
  
  // Trading periods
  periods: TradingPeriods;
}

export interface TimeframeTimestamps {
  now: Date;
  todayStart: Date;
  yesterdayStart: Date;
  yesterdayEnd: Date;
  weekStart: Date;
  monthStart: Date;
  prevMonthStart: Date;
  prevMonthEnd: Date;
  nextMonthStart: Date;
  nextMonthEnd: Date;
  yearStart: Date;
  yearEnd: Date;
}
export function getCurrencyTimezone(currencyOrPair: string): string {
  // First check if it's a direct match (trading pair)
  if (currencyOrPair.length > 3) {
    // For pairs like EURUSD, use the base currency (first 3 chars)
    const baseCurrency = currencyOrPair.substring(0, 3) as keyof typeof CURRENCY_TIMEZONES;
    return CURRENCY_TIMEZONES[baseCurrency] || CURRENCY_TIMEZONES.DEFAULT;
  }
  
  // Single currency
  const currency = currencyOrPair as keyof typeof CURRENCY_TIMEZONES;
  return CURRENCY_TIMEZONES[currency] || CURRENCY_TIMEZONES.DEFAULT;
}

/**
 * Gets the asset type for a trading pair
 */
export function getAssetType(pair: string): AssetType {
  const pairKey = pair as keyof typeof ASSET_TYPES;
  return ASSET_TYPES[pairKey] || 'forex'; // Default to forex
}

/**
 * Checks if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Gets the first trading day of a month
 */
export function getFirstTradingDayOfMonth(year: number, month: number, isCrypto: boolean = false): Date {
  const firstDay = new Date(Date.UTC(year, month, 1));
  
  if (isCrypto) {
    return firstDay; // Crypto trades every day
  }
  
  // For forex/commodities/indices, skip weekends
  while (isWeekend(firstDay)) {
    firstDay.setUTCDate(firstDay.getUTCDate() + 1);
  }
  
  return firstDay;
}

/**
 * Gets the last trading day of a month
 */
export function getLastTradingDayOfMonth(year: number, month: number, isCrypto: boolean = false): Date {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)); // Last day of month
  
  if (isCrypto) {
    return lastDay; // Crypto trades every day
  }
  
  // For forex/commodities/indices, skip weekends
  while (isWeekend(lastDay)) {
    lastDay.setUTCDate(lastDay.getUTCDate() - 1);
  }
  
  return lastDay;
}

/**
 * Gets the start of the current week (Monday)
 */
export function getWeekStart(currentDate: Date): Date {
  const date = new Date(currentDate);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // If Sunday (0), go back 6 days; otherwise go back to Monday
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/**
 * Main utility function to get current date/time and calculate all trading periods
 * Compatible with existing timezone-utils interface
 */
export function getTradingPeriods(currencyOrPair: string, inputDate?: Date | string | null): TradingPeriodsResult {
  // Determine current date (use inputDate for testing, or current date)
  const currentDate = inputDate ? new Date(inputDate) : new Date();
  
  // Get currency-specific timezone and asset type
  const timezone = getCurrencyTimezone(currencyOrPair);
  const assetType = getAssetType(currencyOrPair);
  const isCrypto = assetType === 'crypto';
  
  // Get local time in the currency's timezone
  const localTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(currentDate);
  
  // Calculate yesterday
  const yesterday = new Date(currentDate);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  
  // Calculate weekly period (Monday to current day)
  const weekStart = getWeekStart(currentDate);
  const weekEnd = new Date(currentDate);
  weekEnd.setUTCHours(23, 59, 59, 999); // End of current day
  
  // Calculate monthly period (first trading day of month to current day)
  const monthStart = getFirstTradingDayOfMonth(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), isCrypto);
  const monthEnd = new Date(currentDate);
  monthEnd.setUTCHours(23, 59, 59, 999);
  
  // Calculate monthly-1 period (previous month's first to last trading day)
  const prevMonth = currentDate.getUTCMonth() - 1;
  const prevYear = prevMonth < 0 ? currentDate.getUTCFullYear() - 1 : currentDate.getUTCFullYear();
  const adjustedPrevMonth = prevMonth < 0 ? 11 : prevMonth;
  
  const month1Start = getFirstTradingDayOfMonth(prevYear, adjustedPrevMonth, isCrypto);
  const month1End = getLastTradingDayOfMonth(prevYear, adjustedPrevMonth, isCrypto);
  
  return {
    // Input parameters
    currency: currencyOrPair,
    assetType,
    timezone,
    isCrypto,
    
    // Current date/time information
    utcDateTime: currentDate.toISOString(),
    localDateTime: localTime,
    utcHour: currentDate.getUTCHours(),
    
    // Day information
    isWeekend: isWeekend(currentDate),
    dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
    
    // Trading periods
    periods: {
      daily: {
        name: 'Daily',
        start: new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate())),
        end: new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate(), 23, 59, 59, 999)),
        isWeekend: isWeekend(currentDate),
        tradingActive: isCrypto ? true : !isWeekend(currentDate)
      },
      
      daily1: {
        name: 'Daily-1 (Yesterday)',
        start: new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate())),
        end: new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate(), 23, 59, 59, 999)),
        isWeekend: isWeekend(yesterday),
        tradingActive: isCrypto ? true : !isWeekend(yesterday)
      },
      
      weekly: {
        name: 'Weekly (Monday to Today)',
        start: weekStart,
        end: weekEnd,
        durationDays: Math.ceil((weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)),
        tradingActive: true
      },
      
      monthly: {
        name: 'Monthly (This Month)',
        start: monthStart,
        end: monthEnd,
        durationDays: Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)),
        tradingActive: true
      },
      
      monthly1: {
        name: 'Monthly-1 (Previous Month)',
        start: month1Start,
        end: month1End,
        durationDays: Math.ceil((month1End.getTime() - month1Start.getTime()) / (1000 * 60 * 60 * 24)),
        tradingActive: true,
        isHistorical: true
      }
    }
  };
}

/**
 * Get timezone-adjusted timestamps for timeframe calculations
 * Compatible with existing timezone-utils interface
 */
export function getTimeframeTimestamps(timezone: string = 'UTC', currencyOrPair: string = 'EURUSD'): TimeframeTimestamps {
  const result = getTradingPeriods(currencyOrPair);
  const now = new Date();
  const assetType = getAssetType(currencyOrPair);
  const isCrypto = assetType === 'crypto';
  
  // Calculate next month dates
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  const nextMonth = currentMonth + 1;
  const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
  const adjustedNextMonth = nextMonth > 11 ? 0 : nextMonth;
  
  const nextMonthStart = getFirstTradingDayOfMonth(nextYear, adjustedNextMonth, isCrypto);
  const nextMonthEnd = getLastTradingDayOfMonth(nextYear, adjustedNextMonth, isCrypto);
  
  // Calculate year dates
  const yearStart = getFirstTradingDayOfMonth(currentYear, 0, isCrypto); // January 1st
  const yearEnd = getLastTradingDayOfMonth(currentYear, 11, isCrypto);   // December 31st
  
  return {
    now,
    todayStart: result.periods.daily.start,
    yesterdayStart: result.periods.daily1.start,
    yesterdayEnd: result.periods.daily1.end,
    weekStart: result.periods.weekly.start,
    monthStart: result.periods.monthly.start,
    prevMonthStart: result.periods.monthly1.start,
    prevMonthEnd: result.periods.monthly1.end,
    nextMonthStart,
    nextMonthEnd,
    yearStart,
    yearEnd
  };
}

/**
 * Check if it's Sunday in the user's timezone
 * Compatible with existing timezone-utils interface
 */
export function isSundayInTimezone(timezone: string = 'UTC'): boolean {
  const nowUtc = new Date();
  const nowInTimezone = new Date(nowUtc.toLocaleString('en-US', { timeZone: timezone }));
  return nowInTimezone.getDay() === 0; // Sunday = 0
}

/**
 * Check if a date is a weekend in a specific timezone
 */
export function isWeekendInTimezone(date: Date, timezone: string = 'UTC'): boolean {
  const dateInTimezone = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const day = dateInTimezone.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Formats a trading periods result for display
 */
export function formatTradingPeriods(result: TradingPeriodsResult): string {
  const lines = [
    `🔍 TRADING PERIODS FOR ${result.currency}`,
    `═══════════════════════════════════════════════════`,
    `📊 Asset Type: ${result.assetType.toUpperCase()} ${result.isCrypto ? '(24/7 Trading)' : '(Weekday Trading)'}`,
    `🌍 Timezone: ${result.timezone}`,
    `📅 Current Date: ${result.utcDateTime}`,
    `🏠 Local Time: ${result.localDateTime}`,
    `⏰ UTC Hour: ${result.utcHour}:00`,
    `📆 Day: ${result.dayOfWeek} ${result.isWeekend ? '(Weekend)' : '(Weekday)'}`,
    ``,
    `📋 TRADING PERIODS:`,
    `───────────────────────────────────────────────────`
  ];
  
  Object.entries(result.periods).forEach(([key, period]) => {
    const status = period.tradingActive ? '✅ Active' : '❌ Inactive';
    const weekend = period.isWeekend !== undefined ? (period.isWeekend ? ' (Weekend)' : ' (Weekday)') : '';
    const duration = period.durationDays ? ` [${period.durationDays} days]` : '';
    const historical = period.isHistorical ? ' [Historical]' : '';
    
    lines.push(`${key.toUpperCase().padEnd(8)} ${status}${weekend}${duration}${historical}`);
    lines.push(`         Start: ${period.start.toISOString().split('T')[0]} ${period.start.toISOString().split('T')[1].split('.')[0]}`);
    lines.push(`         End:   ${period.end.toISOString().split('T')[0]} ${period.end.toISOString().split('T')[1].split('.')[0]}`);
    lines.push('');
  });
  
  return lines.join('\n');
}

// Export additional utility functions for backward compatibility
export {
  CURRENCY_TIMEZONES as currencyTimezones,
  ASSET_TYPES as assetTypes
};

// Default export for main function
export default getTradingPeriods;
