export interface ForexPair {
  id: string;
  pair: string;
  category: 'major' | 'minor' | 'exotic' | 'commodity';
  monthly: TrendDirection;
  monthly1: TrendDirection;
  weekly: TrendDirection;
  daily1: TrendDirection;
  daily: TrendDirection;
  alignment: boolean;
  lastUpdated: Date;
  marketOpen?: boolean; // Optional for backward compatibility
}

export type TrendDirection = 'bullish' | 'bearish' | 'neutral';

export interface MarketData {
  pair: string;
  timeframe: string;
  trend: TrendDirection;
  strength: number; // 1-100
  timestamp: Date;
}