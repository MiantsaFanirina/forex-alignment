import { NextResponse } from 'next/server';
import { ForexPair, TrendDirection } from '@/types/forex';

const yahooSymbolMap: Record<string, string> = {
  AUDCAD: 'AUDCAD=X',
  AUDCHF: 'AUDCHF=X',
  AUDJPY: 'AUDJPY=X',
  AUDNZD: 'AUDNZD=X',
  AUDUSD: 'AUDUSD=X',
  BRENT: 'BZ=F',
  BTCUSD: 'BTC-USD',
  CADCHF: 'CADCHF=X',
  CADJPY: 'CADJPY=X',
  CHFJPY: 'CHFJPY=X',
  EURAUD: 'EURAUD=X',
  EURCAD: 'EURCAD=X',
  EURCHF: 'EURCHF=X',
  EURGBP: 'EURGBP=X',
  EURJPY: 'EURJPY=X',
  EURNZD: 'EURNZD=X',
  EURUSD: 'EURUSD=X',
  GBPAUD: 'GBPAUD=X',
  GBPCAD: 'GBPCAD=X',
  GBPCHF: 'GBPCHF=X',
  GBPJPY: 'GBPJPY=X',
  GBPNZD: 'GBPNZD=X',
  GBPUSD: 'GBPUSD=X',
  NZDCAD: 'NZDCAD=X',
  NZDCHF: 'NZDCHF=X',
  NZDJPY: 'NZDJPY=X',
  NZDUSD: 'NZDUSD=X',
  US100: '^NDX',
  US30: '^DJI',
  USDCAD: 'USDCAD=X',
  USDCHF: 'USDCHF=X',
  USDJPY: 'USDJPY=X',
  WTI: 'CL=F',
  XAGUSD: 'XAGUSD=X',
  XAUUSD: 'XAUUSD=X',
};

const calculateTrend = (open: number, close: number): TrendDirection => {
  if (close > open) return 'bullish';
  if (close < open) return 'bearish';
  return 'neutral';
};

export async function GET() {
  const results: ForexPair[] = [];

  for (const [pair, symbol] of Object.entries(yahooSymbolMap)) {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
          symbol
        )}?range=6mo&interval=1d`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          cache: 'no-store',
        }
      );

      if (!res.ok) continue;

      const json = await res.json();
      const candles = json.chart?.result?.[0]?.indicators?.quote?.[0];
      const opens = candles?.open;
      const closes = candles?.close;

      if (!opens || !closes) continue;

      // Trends
      const daily = calculateTrend(opens.at(-1), closes.at(-1));
      const daily1 = calculateTrend(opens.at(-2), closes.at(-2));
      const weekly = calculateTrend(opens.at(-5), closes.at(-1));
      const monthly = calculateTrend(opens.at(-20), closes.at(-1));
      const monthly1 = calculateTrend(opens.at(-40), closes.at(-20));

      results.push({
        id: pair,
        pair,
        category: 'major', // You can update category logic as needed
        monthly,
        monthly1,
        weekly,
        daily1,
        daily,
        alignment: false, // Will be set in frontend
        lastUpdated: new Date(),
      });
    } catch (e) {
      console.error(`Error fetching ${pair}:`, e);
    }
  }

  return NextResponse.json(results);
}
