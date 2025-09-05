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
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            cache: 'no-store'
        });

        if (!res.ok) return 'neutral';

        const html = await res.text();

        // Try multiple patterns with more variations for different TradingView page structures
        const changePatterns = [
            /"change":(-?[0-9.]+)/,
            /"regularMarketChange":(-?[0-9.]+)/,
            /"changePercent":(-?[0-9.]+)/,
            /"changeAbsolute":(-?[0-9.]+)/,
            /data-field-key="change"[^>]*>([^<]*(-?[0-9.]+))/,
            /class="[^"]*change[^"]*"[^>]*>([^<]*(-?[0-9.]+))/
        ];

        for (const pattern of changePatterns) {
            const match = html.match(pattern);
            if (match) {
                const changeStr = match[1] || match[2];
                const change = parseFloat(changeStr.replace(/[^-0-9.]/g, ''));
                if (!isNaN(change)) {
                    return change > 0 ? 'bullish' : change < 0 ? 'bearish' : 'neutral';
                }
            }
        }

        // Fallback: try to extract price and previous close
        const pricePatterns = [
            /"price":([0-9.]+)/,
            /"last":([0-9.]+)/,
            /"regularMarketPrice":([0-9.]+)/,
            /"currentPrice":([0-9.]+)/,
            /data-field-key="last_price"[^>]*>([0-9.]+)/
        ];

        const prevClosePatterns = [
            /"previousClose":([0-9.]+)/,
            /"prevClose":([0-9.]+)/,
            /"previous_close":([0-9.]+)/,
            /data-field-key="prev_close"[^>]*>([0-9.]+)/
        ];

        let currentPrice = null;
        let prevPrice = null;

        for (const pattern of pricePatterns) {
            const match = html.match(pattern);
            if (match) {
                currentPrice = parseFloat(match[1]);
                break;
            }
        }

        for (const pattern of prevClosePatterns) {
            const match = html.match(pattern);
            if (match) {
                prevPrice = parseFloat(match[1]);
                break;
            }
        }

        if (currentPrice && prevPrice && !isNaN(currentPrice) && !isNaN(prevPrice)) {
            return currentPrice > prevPrice ? 'bullish' : currentPrice < prevPrice ? 'bearish' : 'neutral';
        }

        return 'neutral';
    } catch (err) {
        // Silent fail in production to avoid console spam
        return 'neutral';
    }
}

// Helper function to find the first trading day of the current week (Monday)
function getStartOfWeek(date: Date): Date {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
}

// Helper function to get yesterday's date
function getYesterday(date: Date): Date {
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
}

// Helper function to safely get trend with fallback
async function getTrendWithFallback(pair: string, open: number | null | undefined, close: number | null | undefined, timeframe: string): Promise<TrendDirection> {
    // If we have valid open and close prices, calculate the trend
    if (open !== null && open !== undefined && close !== null && close !== undefined && !isNaN(open) && !isNaN(close)) {
        return calculateTrend(open, close);
    }
    
    // If Yahoo Finance data is invalid, try TradingView as fallback
    console.log(`Using TradingView fallback for ${pair} ${timeframe} - open: ${open}, close: ${close}`);
    const tradingViewTrend = await fetchTradingViewTrend(pair);
    return tradingViewTrend;
}

export async function GET() {
    const results: ForexPair[] = [];

    for (const [pair, symbol] of Object.entries(yahooSymbolMap)) {
        try {
            // Fetch daily data for monthly, weekly calculations
            const dailyRes = await fetch(
                `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
                    symbol
                )}?range=6mo&interval=1d`,
                {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    cache: 'no-store',
                }
            );

            // Fetch hourly data for daily and daily-1 calculations
            const hourlyRes = await fetch(
                `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
                    symbol
                )}?range=7d&interval=1h`,
                {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    cache: 'no-store',
                }
            );

            if (!dailyRes.ok) {
                console.log(`Daily data fetch failed for ${pair}, using TradingView fallback`);
                const fallbackTrend = await fetchTradingViewTrend(pair);
                
                // Refined category classification
                let category: ForexPair['category'] = 'major';
                if (['EURUSD', 'USDJPY', 'GBPUSD', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD'].includes(pair)) {
                    category = 'major';
                } else if (
                    [
                        'EURGBP', 'EURJPY', 'EURCHF', 'EURCAD', 'EURAUD', 'EURNZD',
                        'GBPJPY', 'GBPCHF', 'GBPCAD', 'GBPAUD', 'GBPNZD',
                        'AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD',
                        'CADCHF', 'CADJPY', 'CHFJPY', 'NZDCAD', 'NZDCHF', 'NZDJPY',
                    ].includes(pair)
                ) {
                    category = 'minor';
                } else if (['BTCUSD'].includes(pair)) {
                    category = 'exotic';
                } else if (['XAUUSD', 'XAGUSD', 'BRENT', 'WTI'].includes(pair)) {
                    category = 'commodity';
                } else if (['US100', 'US30'].includes(pair)) {
                    category = 'exotic';
                } else {
                    category = 'exotic';
                }
                
                results.push({
                    id: symbol,
                    pair,
                    category,
                    daily: fallbackTrend,
                    daily1: fallbackTrend,
                    weekly: fallbackTrend,
                    monthly: fallbackTrend,
                    monthly1: fallbackTrend,
                    alignment: true, // All same trend = aligned
                    lastUpdated: new Date(),
                });
                continue;
            }

            const dailyJson = await dailyRes.json();
            const dailyCandles = dailyJson.chart?.result?.[0]?.indicators?.quote?.[0];
            const dailyOpens = dailyCandles?.open;
            const dailyCloses = dailyCandles?.close;
            const dailyTimestamps = dailyJson.chart?.result?.[0]?.timestamp;

            let hourlyOpens: number[] | null = null;
            let hourlyCloses: number[] | null = null;
            let hourlyTimestamps: number[] | null = null;

            if (hourlyRes.ok) {
                const hourlyJson = await hourlyRes.json();
                const hourlyCandles = hourlyJson.chart?.result?.[0]?.indicators?.quote?.[0];
                hourlyOpens = hourlyCandles?.open;
                hourlyCloses = hourlyCandles?.close;
                hourlyTimestamps = hourlyJson.chart?.result?.[0]?.timestamp;
            }

            if (!dailyOpens || !dailyCloses || !dailyTimestamps) {
                console.log(`Invalid daily data for ${pair}, using TradingView fallback`);
                const fallbackTrend = await fetchTradingViewTrend(pair);
                
                // Refined category classification
                let category: ForexPair['category'] = 'major';
                if (['EURUSD', 'USDJPY', 'GBPUSD', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD'].includes(pair)) {
                    category = 'major';
                } else if (
                    [
                        'EURGBP', 'EURJPY', 'EURCHF', 'EURCAD', 'EURAUD', 'EURNZD',
                        'GBPJPY', 'GBPCHF', 'GBPCAD', 'GBPAUD', 'GBPNZD',
                        'AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD',
                        'CADCHF', 'CADJPY', 'CHFJPY', 'NZDCAD', 'NZDCHF', 'NZDJPY',
                    ].includes(pair)
                ) {
                    category = 'minor';
                } else if (['BTCUSD'].includes(pair)) {
                    category = 'exotic';
                } else if (['XAUUSD', 'XAGUSD', 'BRENT', 'WTI'].includes(pair)) {
                    category = 'commodity';
                } else if (['US100', 'US30'].includes(pair)) {
                    category = 'exotic';
                } else {
                    category = 'exotic';
                }
                
                results.push({
                    id: symbol,
                    pair,
                    category,
                    daily: fallbackTrend,
                    daily1: fallbackTrend,
                    weekly: fallbackTrend,
                    monthly: fallbackTrend,
                    monthly1: fallbackTrend,
                    alignment: true,
                    lastUpdated: new Date(),
                });
                continue;
            }

            const lastDailyIdx = dailyOpens.length - 1;
            const now = new Date();
            const dateObjs: Date[] = (dailyTimestamps as number[]).map((ts: number) => new Date(ts * 1000));
            
            // MONTHLY-1 CALCULATION
            // First open price of the last month compared to the last close price of the last month
            let monthly1: TrendDirection = 'neutral';
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            
            const prevMonthIndices = dateObjs
                .map((d, i) => ({ d, i }))
                .filter(({ d }) => d.getMonth() === prevMonth && d.getFullYear() === prevYear)
                .map(({ i }) => i);
            
            if (prevMonthIndices.length > 0) {
                const monthly1OpenIdx = prevMonthIndices[0];
                const monthly1CloseIdx = prevMonthIndices[prevMonthIndices.length - 1];
                monthly1 = await getTrendWithFallback(pair, dailyOpens[monthly1OpenIdx], dailyCloses[monthly1CloseIdx], 'monthly-1');
            } else {
                monthly1 = await getTrendWithFallback(pair, null, null, 'monthly-1');
            }

            // MONTHLY CALCULATION 
            // First open price of the current month compared to the last close price of today
            let monthly: TrendDirection = 'neutral';
            const currentMonthIndices = dateObjs
                .map((d, i) => ({ d, i }))
                .filter(({ d }) => d.getMonth() === currentMonth && d.getFullYear() === currentYear)
                .map(({ i }) => i);
            
            if (currentMonthIndices.length > 0) {
                const monthlyOpenIdx = currentMonthIndices[0];
                monthly = await getTrendWithFallback(pair, dailyOpens[monthlyOpenIdx], dailyCloses[lastDailyIdx], 'monthly');
            } else {
                monthly = await getTrendWithFallback(pair, null, null, 'monthly');
            }

            // WEEKLY CALCULATION
            // First open price of the first day of the current week compared to the last close price of today
            let weekly: TrendDirection = 'neutral';
            const startOfWeek = getStartOfWeek(now);
            const weeklyIndices = dateObjs
                .map((d, i) => ({ d, i }))
                .filter(({ d }) => d >= startOfWeek)
                .map(({ i }) => i);
            
            if (weeklyIndices.length > 0) {
                const weeklyOpenIdx = weeklyIndices[0];
                weekly = await getTrendWithFallback(pair, dailyOpens[weeklyOpenIdx], dailyCloses[lastDailyIdx], 'weekly');
            } else {
                // If no data for current week, try using last few trading days as fallback
                const fallbackWeeklyOpenIdx = Math.max(0, lastDailyIdx - 4);
                weekly = await getTrendWithFallback(pair, dailyOpens[fallbackWeeklyOpenIdx], dailyCloses[lastDailyIdx], 'weekly');
            }

            // DAILY CALCULATION
            // First open price of today compared to current last close price of today
            let daily: TrendDirection = 'neutral';
            if (hourlyOpens && hourlyCloses && hourlyTimestamps) {
                const hourlyDateObjs: Date[] = (hourlyTimestamps as number[]).map((ts: number) => new Date(ts * 1000));
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const todayIndices = hourlyDateObjs
                    .map((d, i) => ({ d, i }))
                    .filter(({ d }) => d >= todayStart)
                    .map(({ i }) => i);
                
                if (todayIndices.length > 0) {
                    const todayFirstIdx = todayIndices[0];
                    const todayLastIdx = todayIndices[todayIndices.length - 1];
                    daily = await getTrendWithFallback(pair, hourlyOpens[todayFirstIdx], hourlyCloses[todayLastIdx], 'daily');
                } else {
                    // Fallback to daily data if hourly not available for today
                    daily = await getTrendWithFallback(pair, dailyOpens[lastDailyIdx], dailyCloses[lastDailyIdx], 'daily');
                }
            } else {
                // Fallback to daily data if no hourly data available
                daily = await getTrendWithFallback(pair, dailyOpens[lastDailyIdx], dailyCloses[lastDailyIdx], 'daily');
            }

            // DAILY-1 CALCULATION
            // First open price of first hour of yesterday compared to the last close price of yesterday last hour
            let daily1: TrendDirection = 'neutral';
            if (hourlyOpens && hourlyCloses && hourlyTimestamps) {
                const hourlyDateObjs: Date[] = (hourlyTimestamps as number[]).map((ts: number) => new Date(ts * 1000));
                const yesterday = getYesterday(now);
                const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
                const yesterdayEnd = new Date(yesterdayStart);
                yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
                
                const yesterdayIndices = hourlyDateObjs
                    .map((d, i) => ({ d, i }))
                    .filter(({ d }) => d >= yesterdayStart && d < yesterdayEnd)
                    .map(({ i }) => i);
                
                if (yesterdayIndices.length > 0) {
                    const yesterdayFirstIdx = yesterdayIndices[0];
                    const yesterdayLastIdx = yesterdayIndices[yesterdayIndices.length - 1];
                    daily1 = await getTrendWithFallback(pair, hourlyOpens[yesterdayFirstIdx], hourlyCloses[yesterdayLastIdx], 'daily-1');
                } else {
                    // Fallback to daily data if hourly not available for yesterday
                    if (lastDailyIdx > 0) {
                        daily1 = await getTrendWithFallback(pair, dailyOpens[lastDailyIdx - 1], dailyCloses[lastDailyIdx - 1], 'daily-1');
                    } else {
                        daily1 = await getTrendWithFallback(pair, null, null, 'daily-1');
                    }
                }
            } else {
                // Fallback to daily data if no hourly data available
                if (lastDailyIdx > 0) {
                    daily1 = await getTrendWithFallback(pair, dailyOpens[lastDailyIdx - 1], dailyCloses[lastDailyIdx - 1], 'daily-1');
                } else {
                    daily1 = await getTrendWithFallback(pair, null, null, 'daily-1');
                }
            }

            const trends = [monthly1, monthly, weekly, daily1, daily];
            const alignment = trends.every((t) => t === trends[0]);

            // Refined category classification
            let category: ForexPair['category'] = 'major';
            if (['EURUSD', 'USDJPY', 'GBPUSD', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD'].includes(pair)) {
                category = 'major';
            } else if (
                [
                    'EURGBP', 'EURJPY', 'EURCHF', 'EURCAD', 'EURAUD', 'EURNZD',
                    'GBPJPY', 'GBPCHF', 'GBPCAD', 'GBPAUD', 'GBPNZD',
                    'AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD',
                    'CADCHF', 'CADJPY', 'CHFJPY', 'NZDCAD', 'NZDCHF', 'NZDJPY',
                ].includes(pair)
            ) {
                category = 'minor';
            } else if (['BTCUSD'].includes(pair)) {
                category = 'exotic';
            } else if (['XAUUSD', 'XAGUSD', 'BRENT', 'WTI'].includes(pair)) {
                category = 'commodity';
            } else if (['US100', 'US30'].includes(pair)) {
                category = 'exotic';
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
            
            // Even on error, try to provide fallback data
            try {
                const fallbackTrend = await fetchTradingViewTrend(pair);
                
                let category: ForexPair['category'] = 'major';
                if (['EURUSD', 'USDJPY', 'GBPUSD', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD'].includes(pair)) {
                    category = 'major';
                } else if (
                    [
                        'EURGBP', 'EURJPY', 'EURCHF', 'EURCAD', 'EURAUD', 'EURNZD',
                        'GBPJPY', 'GBPCHF', 'GBPCAD', 'GBPAUD', 'GBPNZD',
                        'AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD',
                        'CADCHF', 'CADJPY', 'CHFJPY', 'NZDCAD', 'NZDCHF', 'NZDJPY',
                    ].includes(pair)
                ) {
                    category = 'minor';
                } else if (['BTCUSD'].includes(pair)) {
                    category = 'exotic';
                } else if (['XAUUSD', 'XAGUSD', 'BRENT', 'WTI'].includes(pair)) {
                    category = 'commodity';
                } else if (['US100', 'US30'].includes(pair)) {
                    category = 'exotic';
                } else {
                    category = 'exotic';
                }
                
                results.push({
                    id: yahooSymbolMap[pair],
                    pair,
                    category,
                    daily: fallbackTrend,
                    daily1: fallbackTrend,
                    weekly: fallbackTrend,
                    monthly: fallbackTrend,
                    monthly1: fallbackTrend,
                    alignment: true,
                    lastUpdated: new Date(),
                });
            } catch (fallbackError) {
                console.error(`Fallback also failed for ${pair}:`, fallbackError);
            }
        }
    }

    return NextResponse.json(results);
}
