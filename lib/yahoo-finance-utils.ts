import { isValidTradingSession, wasYesterdayTradingDay, getTimeframeTimestamps, convertToTimezone, isSundayInTimezone } from './timezone-utils';
import { TrendDirection } from '../types/forex';

export interface YahooFinanceCandle {
  timestamp: number;
  date: Date;
  open: number | null;
  close: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
}

export interface ProcessedTrendData {
  daily1: TrendDirection;
  hasValidData: boolean;
  lastValidDate?: Date;
}

/**
 * Check if we should ignore Saturday data due to Sunday rule
 * This applies when today is Sunday in the user's timezone
 * For BTCUSD: Sunday rule does NOT apply (crypto trades 24/7)
 */
export function shouldIgnoreSaturdayData(timezone: string = 'UTC', pair?: string): boolean {
  // Crypto trades 24/7, so Sunday rule doesn't apply
  if (pair === 'BTCUSD') {
    return false;
  }
  
  // Check if it's Sunday in the user's selected timezone
  return isSundayInTimezone(timezone);
}

/**
 * Check if we should ignore Saturday data due to Sunday rule, but only for historical data (daily-1)
 * For BTCUSD: Sunday rule does NOT apply (crypto trades 24/7)
 */
export function shouldIgnoreSaturdayDataForDaily1(timezone: string = 'UTC', pair?: string): boolean {
  // Crypto trades 24/7, so Sunday rule doesn't apply
  if (pair === 'BTCUSD') {
    return false;
  }
  
  // Check if it's Sunday in the user's selected timezone
  return isSundayInTimezone(timezone);
}

/**
 * Process Yahoo Finance data to extract daily-1 trend, handling weekends properly
 */
export function processDailyTrend(
  timestamps: number[],
  opens: (number | null)[],
  closes: (number | null)[],
  timezone: string = 'UTC',
  pair?: string
): ProcessedTrendData {
  
  const timeframes = getTimeframeTimestamps(timezone);
  
  // Special rule: If today is Sunday in user's timezone, ignore Saturday data and set daily-1 to neutral (applies to ALL pairs including crypto)
  if (shouldIgnoreSaturdayDataForDaily1(timezone, pair)) {
    return {
      daily1: 'neutral',
      hasValidData: false
    };
  }
  
  // First check if yesterday was a trading day
  if (!wasYesterdayTradingDay(timezone)) {
    return {
      daily1: 'neutral',
      hasValidData: false
    };
  }
  
  // Convert raw data to structured candles
  const candles: YahooFinanceCandle[] = timestamps.map((ts, idx) => ({
    timestamp: ts,
    date: new Date(ts * 1000),
    open: opens[idx],
    close: closes[idx],
    high: null, // Not used for trend calculation
    low: null,  // Not used for trend calculation
    volume: null // Not used for trend calculation
  }));

  // Find yesterday's candle with valid data
  let yesterdayCandle: YahooFinanceCandle | null = null;
  
  for (let i = candles.length - 1; i >= 0; i--) {
    const candle = candles[i];
    
    // Check if this candle is from yesterday
    if (candle.date >= timeframes.yesterdayStart && candle.date < timeframes.yesterdayEnd) {
      // Only use if it has valid open/close data
      if (candle.open !== null && candle.close !== null) {
        yesterdayCandle = candle;
        break;
      }
    }
  }

  if (!yesterdayCandle) {
    return {
      daily1: 'neutral',
      hasValidData: false
    };
  }

  // Calculate trend based on open vs close
  const open = yesterdayCandle.open!;
  const close = yesterdayCandle.close!;
  
  let trend: TrendDirection;
  if (close > open) {
    trend = 'bullish';
  } else if (close < open) {
    trend = 'bearish';
  } else {
    trend = 'neutral';
  }

  return {
    daily1: trend,
    hasValidData: true,
    lastValidDate: yesterdayCandle.date
  };
}

/**
 * Fetch and process Yahoo Finance data for a specific symbol
 */
export async function fetchYahooFinanceData(symbol: string, timezone: string = 'UTC', pair?: string): Promise<ProcessedTrendData> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=7d&interval=1d`,
      { 
        headers: { 'User-Agent': 'Mozilla/5.0' },
        cache: 'no-store' 
      }
    );
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API failed with status: ${response.status}`);
    }
    
    const json = await response.json();
    const result = json.chart?.result?.[0];
    
    if (!result) {
      throw new Error('No chart result found');
    }
    
    const candles = result.indicators?.quote?.[0];
    const opens = candles?.open;
    const closes = candles?.close;
    const timestamps = result.timestamp;
    
    if (!opens || !closes || !timestamps) {
      throw new Error('Invalid Yahoo Finance data structure');
    }
    
    return processDailyTrend(timestamps, opens, closes, timezone, pair);
    
  } catch (error) {
    console.error(`Error fetching Yahoo Finance data for ${symbol}:`, error);
    return {
      daily1: 'neutral',
      hasValidData: false
    };
  }
}
