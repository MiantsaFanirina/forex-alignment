import { NextResponse } from 'next/server';

const basePairs = [
  { id: '1', pair: 'AUDCAD', category: 'minor' },
  { id: '2', pair: 'AUDCHF', category: 'minor' },
  { id: '3', pair: 'AUDJPY', category: 'minor' },
  { id: '4', pair: 'AUDNZD', category: 'minor' },
  { id: '5', pair: 'AUDUSD', category: 'major' },
  { id: '6', pair: 'BRENT', category: 'commodity' },
  { id: '7', pair: 'BTCUSD', category: 'commodity' },
  { id: '8', pair: 'CADCHF', category: 'minor' },
  { id: '9', pair: 'CADJPY', category: 'minor' },
  { id: '10', pair: 'CHFJPY', category: 'minor' },
  { id: '11', pair: 'EURAUD', category: 'minor' },
  { id: '12', pair: 'EURCAD', category: 'minor' },
  { id: '13', pair: 'EURCHF', category: 'minor' },
  { id: '14', pair: 'EURGBP', category: 'minor' },
  { id: '15', pair: 'EURJPY', category: 'major' },
  { id: '16', pair: 'EURNZD', category: 'minor' },
  { id: '17', pair: 'EURUSD', category: 'major' },
  { id: '18', pair: 'GBPAUD', category: 'minor' },
  { id: '19', pair: 'GBPCAD', category: 'minor' },
  { id: '20', pair: 'GBPCHF', category: 'minor' },
  { id: '21', pair: 'GBPJPY', category: 'major' },
  { id: '22', pair: 'GBPNZD', category: 'minor' },
  { id: '23', pair: 'GBPUSD', category: 'major' },
  { id: '24', pair: 'NZDCAD', category: 'minor' },
  { id: '25', pair: 'NZDCHF', category: 'minor' },
  { id: '26', pair: 'NZDJPY', category: 'minor' },
  { id: '27', pair: 'NZDUSD', category: 'major' },
  { id: '28', pair: 'US100', category: 'commodity' },
  { id: '29', pair: 'US30', category: 'commodity' },
  { id: '30', pair: 'USDCAD', category: 'major' },
  { id: '31', pair: 'USDCHF', category: 'major' },
  { id: '32', pair: 'USDJPY', category: 'major' },
  { id: '33', pair: 'WTI', category: 'commodity' },
  { id: '34', pair: 'XAGUSD', category: 'commodity' },
  { id: '35', pair: 'XAUUSD', category: 'commodity' },
];

function getYahooFinanceUrl(pair: string, interval: string, range: string): string {
  let symbol = pair;
  if (symbol === 'BTCUSD') symbol = 'BTC-USD';
  else if (symbol === 'US100') symbol = '^NDX';
  else if (symbol === 'US30') symbol = '^DJI';
  else if (symbol === 'BRENT') symbol = 'BZ=F';
  else if (symbol === 'WTI') symbol = 'CL=F';
  else if (!symbol.endsWith('=X') && !symbol.includes('-')) symbol += '=X';
  return `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
}

async function fetchYahooTrend(pair: string, timeframe: string): Promise<{trend: string, explanation: string}> {
  let interval = '1d', range = '2d';
  if (timeframe.startsWith('monthly')) { interval = '1mo'; range = '2mo'; }
  else if (timeframe.startsWith('weekly')) { interval = '1wk'; range = '2wk'; }
  const url = getYahooFinanceUrl(pair, interval, range);
  try {
    const res = await fetch(url);
    if (!res.ok) return { trend: 'neutral', explanation: 'Yahoo Finance API did not return OK.' };
    const data = await res.json();
    const candles = data.chart?.result?.[0]?.indicators?.quote?.[0];
    const timestamps = data.chart?.result?.[0]?.timestamp;
    if (!candles || !timestamps || candles.open.length < 2) return { trend: 'neutral', explanation: 'Not enough candle data returned.' };
    let idx = timeframe.endsWith('1') ? candles.open.length - 2 : candles.open.length - 1;
    const open = candles.open[idx];
    const close = candles.close[idx];
    let trend = 'neutral';
    let explanation = `open=${open}, close=${close} => neutral (open == close)`;
    if (close > open) {
      trend = 'bullish';
      explanation = `open=${open}, close=${close} => bullish (close > open)`;
    } else if (close < open) {
      trend = 'bearish';
      explanation = `open=${open}, close=${close} => bearish (close < open)`;
    }
    return { trend, explanation };
  } catch {
    return { trend: 'neutral', explanation: 'Error fetching or parsing Yahoo Finance data.' };
  }
}

function checkAlignment(monthly: string, weekly: string, daily1: string, daily: string): boolean {
  if (monthly === 'neutral' || weekly === 'neutral' || daily1 === 'neutral' || daily === 'neutral') {
    return false;
  }
  return monthly === weekly && weekly === daily1 && daily1 === daily;
}

export async function GET() {
  const results: any[] = [];
  for (const pair of basePairs) {
    const monthlyObj = await fetchYahooTrend(pair.pair, 'monthly');
    const monthly1Obj = await fetchYahooTrend(pair.pair, 'monthly1');
    const weeklyObj = await fetchYahooTrend(pair.pair, 'weekly');
    const weekly1Obj = await fetchYahooTrend(pair.pair, 'weekly1');
    const daily1Obj = await fetchYahooTrend(pair.pair, 'daily1');
    const dailyObj = await fetchYahooTrend(pair.pair, 'daily');
    results.push({
      ...pair,
      monthly: monthlyObj.trend,
      monthly1: monthly1Obj.trend,
      weekly: weeklyObj.trend,
      weekly1: weekly1Obj.trend,
      daily1: daily1Obj.trend,
      daily: dailyObj.trend,
      explanation: {
        monthly: monthlyObj.explanation,
        monthly1: monthly1Obj.explanation,
        weekly: weeklyObj.explanation,
        weekly1: weekly1Obj.explanation,
        daily1: daily1Obj.explanation,
        daily: dailyObj.explanation,
      },
      alignment: checkAlignment(monthlyObj.trend, weeklyObj.trend, daily1Obj.trend, dailyObj.trend),
      lastUpdated: new Date(),
    });
  }
  // console.log(JSON.stringify(results, null, 2));
  return NextResponse.json(results);
}
