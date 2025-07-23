import { ForexPair, TrendDirection } from '@/types/forex';

// Generate realistic placeholder data
const generateTrend = (): TrendDirection => {
  const trends: TrendDirection[] = ['bullish', 'bearish', 'neutral'];
  return trends[Math.floor(Math.random() * trends.length)];
};

const checkAlignment = (monthly: TrendDirection, weekly: TrendDirection, daily1: TrendDirection, daily: TrendDirection): boolean => {
  if (monthly === 'neutral' || weekly === 'neutral' || daily1 === 'neutral' || daily === 'neutral') {
    return false;
  }
  return monthly === weekly && weekly === daily1 && daily1 === daily;
};

const basePairs : Array<{ id: string; pair: string; category: "major" | "minor" | "exotic" | "commodity" }> = [
  // Major Pairs
  { id: '1', pair: 'EUR/USD', category: 'major' },
  { id: '2', pair: 'GBP/USD', category: 'major' },
  { id: '3', pair: 'USD/JPY', category: 'major' },
  { id: '4', pair: 'USD/CHF', category: 'major' },
  { id: '5', pair: 'AUD/USD', category: 'major' },
  { id: '6', pair: 'USD/CAD', category: 'major' },
  { id: '7', pair: 'NZD/USD', category: 'major' },
  
  // Minor Pairs
  { id: '8', pair: 'EUR/GBP', category: 'minor' },
  { id: '9', pair: 'EUR/JPY', category: 'minor' },
  { id: '10', pair: 'GBP/JPY', category: 'minor' },
  { id: '11', pair: 'EUR/CHF', category: 'minor' },
  { id: '12', pair: 'GBP/CHF', category: 'minor' },
  { id: '13', pair: 'AUD/JPY', category: 'minor' },
  { id: '14', pair: 'CAD/JPY', category: 'minor' },
  { id: '15', pair: 'CHF/JPY', category: 'minor' },
  { id: '16', pair: 'EUR/AUD', category: 'minor' },
  { id: '17', pair: 'EUR/CAD', category: 'minor' },
  { id: '18', pair: 'GBP/AUD', category: 'minor' },
  { id: '19', pair: 'GBP/CAD', category: 'minor' },
  { id: '20', pair: 'AUD/CAD', category: 'minor' },
  { id: '21', pair: 'AUD/CHF', category: 'minor' },
  { id: '22', pair: 'CAD/CHF', category: 'minor' },
  { id: '23', pair: 'NZD/JPY', category: 'minor' },
  { id: '24', pair: 'NZD/CHF', category: 'minor' },
  
  // Exotic Pairs
  { id: '25', pair: 'USD/SGD', category: 'exotic' },
  { id: '26', pair: 'USD/HKD', category: 'exotic' },
  { id: '27', pair: 'USD/ZAR', category: 'exotic' },
  { id: '28', pair: 'USD/TRY', category: 'exotic' },
  { id: '29', pair: 'EUR/NOK', category: 'exotic' },
  { id: '30', pair: 'EUR/SEK', category: 'exotic' },
  
  // Commodities
  { id: '31', pair: 'XAU/USD', category: 'commodity' },
  { id: '32', pair: 'XAG/USD', category: 'commodity' },
  { id: '33', pair: 'WTI/USD', category: 'commodity' },
  { id: '34', pair: 'BTC/USD', category: 'commodity' },
  { id: '35', pair: 'ETH/USD', category: 'commodity' }
];

export const generateInitialForexPairs = (): ForexPair[] => {
  return basePairs.map((pair) => {
    const monthly = generateTrend();
    const monthly1 = generateTrend();
    const weekly = generateTrend();
    const daily1 = generateTrend();
    const daily = generateTrend();
    
    return {
      ...pair,
      monthly,
      monthly1,
      weekly,
      daily1,
      daily,
      alignment: checkAlignment(monthly, weekly, daily1, daily),
      lastUpdated: new Date()
    };
  });
};

export const updateForexData = (currentData: ForexPair[]): ForexPair[] => {
  return currentData.map(pair => {
    // Simulate realistic updates - trends don't change too frequently
    const shouldUpdate = Math.random() < 0.1; // 10% chance of update
    
    if (!shouldUpdate) return pair;
    
    const monthly = Math.random() < 0.05 ? generateTrend() : pair.monthly; // Monthly changes rarely
    const monthly1 = Math.random() < 0.05 ? generateTrend() : pair.monthly1; // Monthly-1 changes rarely
    const weekly = Math.random() < 0.15 ? generateTrend() : pair.weekly;   // Weekly changes occasionally
    const daily1 = Math.random() < 0.25 ? generateTrend() : pair.daily1;   // Daily-1 changes more often
    const daily = Math.random() < 0.35 ? generateTrend() : pair.daily;     // Daily changes most frequently
    
    return {
      ...pair,
      monthly,
      monthly1,
      weekly,
      daily1,
      daily,
      alignment: checkAlignment(monthly, weekly, daily1, daily),
      lastUpdated: new Date()
    };
  });
};