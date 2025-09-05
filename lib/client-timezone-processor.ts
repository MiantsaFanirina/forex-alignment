import { ForexPair, TrendDirection } from '@/types/forex';
import { getTimeframeTimestamps } from './timezone-utils';

export interface ProcessedForexData extends ForexPair {
  originalData?: ForexPair;
}

/**
 * Process forex data with timezone-aware trend calculations on the client side
 */
export function processForexDataWithTimezone(
  rawData: ForexPair[],
  timezone: string = 'UTC'
): ProcessedForexData[] {
  // If timezone is UTC, return data as-is since server already calculated for UTC
  if (timezone === 'UTC') {
    return rawData.map(pair => ({ ...pair }));
  }

  // For non-UTC timezones, we need to simulate the calculation
  // This is a simplified approach since we don't have the raw market data
  // In a real implementation, you would recalculate trends based on timezone-adjusted timeframes
  
  const timestamps = getTimeframeTimestamps(timezone);
  
  return rawData.map(pair => {
    // For now, we'll return the same trends but mark that they've been processed
    // In a production system, you would want to recalculate based on timezone-adjusted periods
    
    const processedPair: ProcessedForexData = {
      ...pair,
      originalData: pair,
      // Update the lastUpdated to reflect timezone processing
      lastUpdated: timestamps.now
    };

    // Recalculate alignment based on potentially different trends
    const trends = [
      processedPair.monthly1,
      processedPair.monthly,
      processedPair.weekly,
      processedPair.daily1,
      processedPair.daily
    ];
    
    processedPair.alignment = trends.every(t => t === trends[0] && t !== 'neutral');

    return processedPair;
  });
}

/**
 * Simple trend adjustment based on timezone offset (placeholder implementation)
 * In a real-world scenario, you'd need access to the raw market data to properly recalculate
 */
function adjustTrendForTimezone(
  originalTrend: TrendDirection,
  timeframe: string,
  timezone: string
): TrendDirection {
  // This is a placeholder implementation
  // Real timezone adjustment would require access to raw OHLC data
  // and recalculating the trends based on timezone-adjusted time periods
  
  // For now, return the original trend
  // You could implement more sophisticated logic here if you have access to
  // historical price data or can make additional API calls
  
  return originalTrend;
}

/**
 * Check if timezone processing would significantly change the trends
 * This helps determine if we need to show a warning to users about timezone differences
 */
export function shouldShowTimezoneWarning(
  originalData: ForexPair[],
  processedData: ProcessedForexData[],
  timezone: string
): boolean {
  if (timezone === 'UTC') return false;
  
  // Check for significant differences that might affect trading decisions
  let significantChanges = 0;
  
  for (let i = 0; i < originalData.length; i++) {
    const original = originalData[i];
    const processed = processedData[i];
    
    if (original.alignment !== processed.alignment) {
      significantChanges++;
    }
  }
  
  // Show warning if more than 10% of pairs have alignment changes
  return significantChanges / originalData.length > 0.1;
}

/**
 * Get a user-friendly timezone display name
 */
export function getTimezoneDisplayName(timezone: string): string {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value;
    return timeZoneName || timezone;
  } catch (error) {
    return timezone;
  }
}
