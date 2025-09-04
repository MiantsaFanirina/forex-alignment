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

// TradingView URL mapping for fallback data
const tradingViewUrlMap: Record<string, string> = {
    AUDCAD: 'https://www.tradingview.com/symbols/AUDCAD/',
    AUDCHF: 'https://www.tradingview.com/symbols/AUDCHF/',
    AUDJPY: 'https://www.tradingview.com/symbols/AUDJPY/',
    AUDNZD: 'https://www.tradingview.com/symbols/AUDNZD/',
    AUDUSD: 'https://www.tradingview.com/symbols/AUDUSD/',
    BRENT: 'https://www.tradingview.com/symbols/BCOUSD/',
    BTCUSD: 'https://www.tradingview.com/symbols/BTCUSD/',
    CADCHF: 'https://www.tradingview.com/symbols/CADCHF/',
    CADJPY: 'https://www.tradingview.com/symbols/CADJPY/',
    CHFJPY: 'https://www.tradingview.com/symbols/CHFJPY/',
    EURAUD: 'https://www.tradingview.com/symbols/EURAUD/',
    EURCAD: 'https://www.tradingview.com/symbols/EURCAD/',
    EURCHF: 'https://www.tradingview.com/symbols/EURCHF/',
    EURGBP: 'https://www.tradingview.com/symbols/EURGBP/',
    EURJPY: 'https://www.tradingview.com/symbols/EURJPY/',
    EURNZD: 'https://www.tradingview.com/symbols/EURNZD/',
    EURUSD: 'https://www.tradingview.com/symbols/EURUSD/',
    GBPAUD: 'https://www.tradingview.com/symbols/GBPAUD/',
    GBPCAD: 'https://www.tradingview.com/symbols/GBPCAD/',
    GBPCHF: 'https://www.tradingview.com/symbols/GBPCHF/',
    GBPJPY: 'https://www.tradingview.com/symbols/GBPJPY/',
    GBPNZD: 'https://www.tradingview.com/symbols/GBPNZD/',
    GBPUSD: 'https://www.tradingview.com/symbols/GBPUSD/',
    NZDCAD: 'https://www.tradingview.com/symbols/NZDCAD/',
    NZDCHF: 'https://www.tradingview.com/symbols/NZDCHF/',
    NZDJPY: 'https://www.tradingview.com/symbols/NZDJPY/',
    NZDUSD: 'https://www.tradingview.com/symbols/NZDUSD/',
    US100: 'https://www.tradingview.com/symbols/US100/',
    US30: 'https://www.tradingview.com/symbols/US30/',
    USDCAD: 'https://www.tradingview.com/symbols/USDCAD/',
    USDCHF: 'https://www.tradingview.com/symbols/USDCHF/',
    USDJPY: 'https://www.tradingview.com/symbols/USDJPY/',
    WTI: 'https://www.tradingview.com/symbols/CL1!',
    XAGUSD: 'https://www.tradingview.com/symbols/XAGUSD/',
    XAUUSD: 'https://www.tradingview.com/symbols/XAUUSD/',
};

const calculateTrend = (open: number, close: number): TrendDirection => {
    if (close > open) return 'bullish';
    if (close < open) return 'bearish';
    return 'neutral';
};

// TradingView scraper function for fallback data
async function fetchTradingViewTrend(symbol: string): Promise<TrendDirection> {
    try {
        const url = tradingViewUrlMap[symbol];
        if (!url) return 'neutral';
        
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            cache: 'no-store'
        });
        
        if (!res.ok) return 'neutral';
        
        const html = await res.text();
        
        // Try multiple patterns to extract price data and determine trend
        const priceMatch = html.match(/"price":([0-9.]+)/) || 
                          html.match(/"last":([0-9.]+)/) ||
                          html.match(/"regularMarketPrice":([0-9.]+)/);
        
        const changeMatch = html.match(/"change":(-?[0-9.]+)/) ||
                           html.match(/"regularMarketChange":(-?[0-9.]+)/);
        
        if (changeMatch) {
            const change = parseFloat(changeMatch[1]);
            return change > 0 ? 'bullish' : change < 0 ? 'bearish' : 'neutral';
        }
        
        // Fallback: try to find previous day data and compare
        if (priceMatch) {
            const currentPrice = parseFloat(priceMatch[1]);
            // This is a simplified approach - in a real implementation, 
            // you'd want to extract actual historical data
            const prevPriceMatch = html.match(/"previousClose":([0-9.]+)/);
            if (prevPriceMatch) {
                const prevPrice = parseFloat(prevPriceMatch[1]);
                return currentPrice > prevPrice ? 'bullish' : currentPrice < prevPrice ? 'bearish' : 'neutral';
            }
        }
        
        return 'neutral';
    } catch (err) {
        console.error(`Error fetching TradingView data for ${symbol}:`, err);
        return 'neutral';
    }
}

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

            const lastIdx = opens.length - 1;
            // Find indices for monthly and monthly-1 using calendar months
            const timestamps = json.chart?.result?.[0]?.timestamp;
            let monthlyOpenIdx = lastIdx,
                monthlyCloseIdx = lastIdx;
            let monthly1OpenIdx = lastIdx,
                monthly1CloseIdx = lastIdx;
            if (timestamps && timestamps.length > 0) {
                const dateObjs: Date[] = (timestamps as number[]).map((ts: number) => new Date(ts * 1000));
                const currentMonth = dateObjs[lastIdx].getMonth();
                const currentYear = dateObjs[lastIdx].getFullYear();
                // Indices for current month
                const currentMonthIndices = dateObjs
                    .map((d, i) => ({ d, i }))
                    .filter(({ d }) => d.getMonth() === currentMonth && d.getFullYear() === currentYear)
                    .map(({ i }) => i);
                if (currentMonthIndices.length > 0) {
                    monthlyOpenIdx = currentMonthIndices[0];
                    monthlyCloseIdx = currentMonthIndices[currentMonthIndices.length - 1];
                }
                // Indices for previous month
                const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                const prevMonthIndices = dateObjs
                    .map((d, i) => ({ d, i }))
                    .filter(({ d }) => d.getMonth() === prevMonth && d.getFullYear() === prevYear)
                    .map(({ i }) => i);
                if (prevMonthIndices.length > 0) {
                    monthly1OpenIdx = prevMonthIndices[0];
                    monthly1CloseIdx = prevMonthIndices[prevMonthIndices.length - 1];
                }
            }
            // Trends
            const daily = calculateTrend(opens[lastIdx], closes[lastIdx]);
            let daily1 = calculateTrend(opens[lastIdx - 1], closes[lastIdx - 1]);
            
            // If Yahoo Finance daily1 is neutral, try TradingView as fallback
            if (daily1 === 'neutral') {
                console.log(`Daily1 is neutral for ${pair}, trying TradingView fallback...`);
                const tradingViewTrend = await fetchTradingViewTrend(pair);
                if (tradingViewTrend !== 'neutral') {
                    daily1 = tradingViewTrend;
                    console.log(`Using TradingView trend ${tradingViewTrend} for ${pair}`);
                }
            }
            
            const weekly = calculateTrend(opens[lastIdx - 4], closes[lastIdx]);
            const monthly = calculateTrend(opens[monthlyOpenIdx], closes[monthlyCloseIdx]);
            const monthly1 =
                monthly1OpenIdx >= 0 && monthly1CloseIdx >= 0
                    ? calculateTrend(opens[monthly1OpenIdx], closes[monthly1CloseIdx])
                    : 'neutral';
            const trends = [monthly1, monthly, weekly, daily1, daily];
            const alignment = trends.every((t) => t === trends[0]);

            // Refined category classification
            let category: ForexPair['category'] = 'major';
            if (['EURUSD', 'USDJPY', 'GBPUSD', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD'].includes(pair)) {
                category = 'major';
            } else if (
                [
                    'EURGBP',
                    'EURJPY',
                    'EURCHF',
                    'EURCAD',
                    'EURAUD',
                    'EURNZD',
                    'GBPJPY',
                    'GBPCHF',
                    'GBPCAD',
                    'GBPAUD',
                    'GBPNZD',
                    'AUDCAD',
                    'AUDCHF',
                    'AUDJPY',
                    'AUDNZD',
                    'CADCHF',
                    'CADJPY',
                    'CHFJPY',
                    'NZDCAD',
                    'NZDCHF',
                    'NZDJPY',
                ].includes(pair)
            ) {
                category = 'minor';
            } else if (['BTCUSD'].includes(pair)) {
                category = 'exotic'; // treat crypto as exotic for now
            } else if (['XAUUSD', 'XAGUSD', 'BRENT', 'WTI'].includes(pair)) {
                category = 'commodity'; // metals and oil as commodity
            } else if (['US100', 'US30'].includes(pair)) {
                category = 'exotic'; // treat index as exotic for now
            } else {
                category = 'exotic';
            }

            results.push({
                id: symbol,
                pair,
                category,
                daily,
                daily1,
                weekly,
                monthly,
                monthly1,
                alignment,
                lastUpdated: new Date(),
            });
        } catch (e) {
            console.error(`Error fetching ${pair}:`, e);
        }
    }

    return NextResponse.json(results);
}
