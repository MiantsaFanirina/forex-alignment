/**
 * React Hook for Trading Periods
 * ===============================
 * Custom hook that provides easy access to trading periods functionality
 * from React components with proper state management and caching.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTradingPeriods, formatTradingPeriods, getCurrencyTimezone, getAssetType } from '@/lib/trading-periods';
import type { TradingPeriodsResult, AssetType } from '@/lib/trading-periods';

export interface UseTradingPeriodsOptions {
  /** Currency pair to get trading periods for */
  currencyOrPair: string;
  
  /** Optional date for testing/historical data */
  inputDate?: Date | string | null;
  
  /** Auto-refresh interval in milliseconds (default: 1000 = 1 second) */
  refreshInterval?: number;
  
  /** Whether to auto-refresh (default: true) */
  autoRefresh?: boolean;
}

export interface UseTradingPeriodsReturn extends TradingPeriodsResult {
  /** Whether data is currently loading */
  isLoading: boolean;
  
  /** Any error that occurred */
  error: string | null;
  
  /** Formatted string representation of the periods */
  formatted: string;
  
  /** Manually refresh the data */
  refresh: () => void;
  
  /** Check if two periods have identical boundaries */
  periodsMatch: (period1: keyof TradingPeriodsResult['periods'], period2: keyof TradingPeriodsResult['periods']) => boolean;
  
  /** Get the timezone for the current currency */
  getTimezone: () => string;
  
  /** Get the asset type for the current currency */
  getAssetTypeInfo: () => AssetType;
}

/**
 * Custom hook for accessing trading periods functionality
 * 
 * @param options Configuration options
 * @returns Trading periods data and utility functions
 * 
 * @example
 * ```tsx
 * const { periods, isLoading, periodsMatch } = useTradingPeriods({
 *   currencyOrPair: 'EURUSD',
 *   refreshInterval: 5000 // 5 seconds (or use default 1 second)
 * });
 * 
 * // Check if weekly and monthly periods align
 * const isAligned = periodsMatch('weekly', 'monthly');
 * 
 * // Access individual period data
 * const weeklyStart = periods.weekly.start;
 * const monthlyStart = periods.monthly.start;
 * ```
 */
export function useTradingPeriods({
  currencyOrPair,
  inputDate,
  refreshInterval = 1000, // 1 second default
  autoRefresh = true
}: UseTradingPeriodsOptions): UseTradingPeriodsReturn {
  
  const [data, setData] = useState<TradingPeriodsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the trading periods calculation
  const calculateTradingPeriods = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = getTradingPeriods(currencyOrPair, inputDate);
      setData(result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate trading periods');
      console.error('Trading periods calculation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currencyOrPair, inputDate]);

  // Initial data load
  useEffect(() => {
    calculateTradingPeriods();
  }, [calculateTradingPeriods]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || inputDate) {
      return; // Don't auto-refresh when using a specific input date
    }

    const interval = setInterval(() => {
      calculateTradingPeriods();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, inputDate, refreshInterval, calculateTradingPeriods]);

  // Manual refresh function
  const refresh = useCallback(() => {
    calculateTradingPeriods();
  }, [calculateTradingPeriods]);

  // Helper function to check if two periods have matching boundaries
  const periodsMatch = useCallback((period1: keyof TradingPeriodsResult['periods'], period2: keyof TradingPeriodsResult['periods']): boolean => {
    if (!data) return false;
    
    const p1 = data.periods[period1];
    const p2 = data.periods[period2];
    
    return p1.start.getTime() === p2.start.getTime() && 
           p1.end.getTime() === p2.end.getTime();
  }, [data]);

  // Helper function to get timezone
  const getTimezone = useCallback(() => {
    return getCurrencyTimezone(currencyOrPair);
  }, [currencyOrPair]);

  // Helper function to get asset type
  const getAssetTypeInfo = useCallback((): AssetType => {
    return getAssetType(currencyOrPair);
  }, [currencyOrPair]);

  // Memoize the formatted string to avoid unnecessary recalculations
  const formatted = useMemo(() => {
    return data ? formatTradingPeriods(data) : '';
  }, [data]);

  // Return loading state if data isn't ready
  if (isLoading && !data) {
    return {
      // Provide safe defaults while loading
      currency: currencyOrPair,
      assetType: getAssetType(currencyOrPair),
      timezone: getCurrencyTimezone(currencyOrPair),
      isCrypto: getAssetType(currencyOrPair) === 'crypto',
      utcDateTime: new Date().toISOString(),
      localDateTime: new Date().toLocaleString(),
      utcHour: new Date().getUTCHours(),
      isWeekend: false,
      dayOfWeek: 'Loading',
      periods: {
        daily: { name: 'Daily', start: new Date(), end: new Date(), tradingActive: false },
        daily1: { name: 'Daily-1', start: new Date(), end: new Date(), tradingActive: false },
        weekly: { name: 'Weekly', start: new Date(), end: new Date(), tradingActive: false },
        monthly: { name: 'Monthly', start: new Date(), end: new Date(), tradingActive: false },
        monthly1: { name: 'Monthly-1', start: new Date(), end: new Date(), tradingActive: false }
      },
      isLoading: true,
      error,
      formatted: 'Loading...',
      refresh,
      periodsMatch,
      getTimezone,
      getAssetTypeInfo
    };
  }

  // Return error state if there's an error and no data
  if (error && !data) {
    return {
      currency: currencyOrPair,
      assetType: getAssetType(currencyOrPair),
      timezone: getCurrencyTimezone(currencyOrPair),
      isCrypto: getAssetType(currencyOrPair) === 'crypto',
      utcDateTime: new Date().toISOString(),
      localDateTime: new Date().toLocaleString(),
      utcHour: new Date().getUTCHours(),
      isWeekend: false,
      dayOfWeek: 'Error',
      periods: {
        daily: { name: 'Daily', start: new Date(), end: new Date(), tradingActive: false },
        daily1: { name: 'Daily-1', start: new Date(), end: new Date(), tradingActive: false },
        weekly: { name: 'Weekly', start: new Date(), end: new Date(), tradingActive: false },
        monthly: { name: 'Monthly', start: new Date(), end: new Date(), tradingActive: false },
        monthly1: { name: 'Monthly-1', start: new Date(), end: new Date(), tradingActive: false }
      },
      isLoading: false,
      error,
      formatted: `Error: ${error}`,
      refresh,
      periodsMatch,
      getTimezone,
      getAssetTypeInfo
    };
  }

  // Return the actual data
  return {
    ...data!,
    isLoading,
    error,
    formatted,
    refresh,
    periodsMatch,
    getTimezone,
    getAssetTypeInfo
  };
}

/**
 * Hook for checking period alignment across multiple currency pairs
 * 
 * @param currencyPairs Array of currency pairs to check
 * @returns Alignment information for all pairs
 */
export function useTradingPeriodsAlignment(currencyPairs: string[]) {
  const [alignmentData, setAlignmentData] = useState<Record<string, {
    weeklyMonthlyMatch: boolean;
    allPeriodsData: TradingPeriodsResult;
  }>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateAlignment = () => {
      setIsLoading(true);
      const results: Record<string, any> = {};

      currencyPairs.forEach(pair => {
        const periodsData = getTradingPeriods(pair);
        const weeklyStart = periodsData.periods.weekly.start.getTime();
        const monthlyStart = periodsData.periods.monthly.start.getTime();
        const weeklyEnd = periodsData.periods.weekly.end.getTime();
        const monthlyEnd = periodsData.periods.monthly.end.getTime();

        results[pair] = {
          weeklyMonthlyMatch: weeklyStart === monthlyStart && weeklyEnd === monthlyEnd,
          allPeriodsData: periodsData
        };
      });

      setAlignmentData(results);
      setIsLoading(false);
    };

    calculateAlignment();
    
    // Auto-refresh every second
    const interval = setInterval(calculateAlignment, 1000);
    return () => clearInterval(interval);
  }, [currencyPairs]);

  return { alignmentData, isLoading };
}

export default useTradingPeriods;
