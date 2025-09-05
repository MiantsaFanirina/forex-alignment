import { NextResponse } from 'next/server';
import { ForexPair, TrendDirection } from '@/types/forex';
import { getTimeframeTimestamps } from '@/lib/timezone-utils';

// Enable dynamic rendering for timezone-based requests
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    XAGUSD: 'SI=F',  // Silver futures
    XAUUSD: 'GC=F',  // Gold futures
};

const tradingViewSymbolMap: Record<string, string> = {
    AUDCAD: 'FX:AUDCAD',
    AUDCHF: 'FX:AUDCHF',
    AUDJPY: 'FX:AUDJPY',
    AUDNZD: 'FX:AUDNZD',
    AUDUSD: 'FX:AUDUSD',
    BRENT: 'TVC:UKOIL',
    BTCUSD: 'BINANCE:BTCUSDT',
    CADCHF: 'FX:CADCHF',
    CADJPY: 'FX:CADJPY',
    CHFJPY: 'FX:CHFJPY',
    EURAUD: 'FX:EURAUD',
    EURCAD: 'FX:EURCAD',
    EURCHF: 'FX:EURCHF',
    EURGBP: 'FX:EURGBP',
    EURJPY: 'FX:EURJPY',
    EURNZD: 'FX:EURNZD',
    EURUSD: 'FX:EURUSD',
    GBPAUD: 'FX:GBPAUD',
    GBPCAD: 'FX:GBPCAD',
    GBPCHF: 'FX:GBPCHF',
    GBPJPY: 'FX:GBPJPY',
    GBPNZD: 'FX:GBPNZD',
    GBPUSD: 'FX:GBPUSD',
    NZDCAD: 'FX:NZDCAD',
    NZDCHF: 'FX:NZDCHF',
    NZDJPY: 'FX:NZDJPY',
    NZDUSD: 'FX:NZDUSD',
    US100: 'TVC:NDX',
    US30: 'TVC:DJI',
    USDCAD: 'FX:USDCAD',
    USDCHF: 'FX:USDCHF',
    USDJPY: 'FX:USDJPY',
    WTI: 'TVC:USOIL',
    XAGUSD: 'FX:XAGUSD',
    XAUUSD: 'FX:XAUUSD',
};

const calculateTrend = (open: number, close: number): TrendDirection => {
    if (close > open) return 'bullish';
    if (close < open) return 'bearish';
    return 'neutral';
};

interface TimeframeData {
    daily: TrendDirection;
    daily1: TrendDirection;
    weekly: TrendDirection;
    monthly: TrendDirection;
    monthly1: TrendDirection;
}

// TradingView fallback (simple web scraping) - only used when Yahoo fails
async function fetchTradingViewFallback(symbol: string): Promise<TrendDirection> {
    try {
        const tradingViewUrls: Record<string, string> = {
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
        
        const url = tradingViewUrls[symbol];
        if (!url) return 'neutral';
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            cache: 'no-store'
        });
        
        if (!response.ok) return 'neutral';
        
        const html = await response.text();
        
        // Look for change indicators
        const changeMatch = html.match(/"change":(-?[0-9.]+)/);
        if (changeMatch) {
            const change = parseFloat(changeMatch[1]);
            return change > 0 ? 'bullish' : change < 0 ? 'bearish' : 'neutral';
        }
        
        return 'neutral';
    } catch (error) {
        return 'neutral';
    }
}

// Yahoo Finance backup data fetcher - timezone-aware version
async function fetchYahooFinanceData(symbol: string, timezone: string = 'UTC'): Promise<TimeframeData> {
    try {
        // Fetch daily data
        const dailyRes = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=6mo&interval=1d`,
            { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' }
        );

        // Fetch hourly data
        const hourlyRes = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=7d&interval=1h`,
            { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' }
        );

        if (!dailyRes.ok) {
            throw new Error('Yahoo Finance API failed');
        }

        const dailyJson = await dailyRes.json();
        const dailyCandles = dailyJson.chart?.result?.[0]?.indicators?.quote?.[0];
        const dailyOpens = dailyCandles?.open;
        const dailyCloses = dailyCandles?.close;
        const dailyTimestamps = dailyJson.chart?.result?.[0]?.timestamp;

        if (!dailyOpens || !dailyCloses || !dailyTimestamps) {
            throw new Error(`Invalid Yahoo Finance data for ${symbol}`);
        }

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

        // Use timezone-aware timestamp calculations for proper candlestick boundaries
        const timestamps = getTimeframeTimestamps(timezone);
        const lastDailyIdx = dailyOpens.length - 1;
        
        // Convert Unix timestamps to Date objects
        const dateObjs: Date[] = (dailyTimestamps as number[]).map((ts: number) => new Date(ts * 1000));
        
        // MONTHLY-1: first open of previous month vs last close of previous month
        let monthly1: TrendDirection = 'neutral';
        const prevMonthIndices = dateObjs
            .map((d, i) => ({ d, i }))
            .filter(({ d }) => {
                // Use timezone-aware boundaries for previous month
                return d >= timestamps.prevMonthStart && d < timestamps.prevMonthEnd;
            })
            .map(({ i }) => i);
        
        if (prevMonthIndices.length > 0) {
            const monthly1OpenIdx = prevMonthIndices[0];
            const monthly1CloseIdx = prevMonthIndices[prevMonthIndices.length - 1];
            if (dailyOpens[monthly1OpenIdx] && dailyCloses[monthly1CloseIdx]) {
                monthly1 = calculateTrend(dailyOpens[monthly1OpenIdx], dailyCloses[monthly1CloseIdx]);
            }
        }

        // MONTHLY: first open of current month vs last close (timezone-aware)
        let monthly: TrendDirection = 'neutral';
        const currentMonthIndices = dateObjs
            .map((d, i) => ({ d, i }))
            .filter(({ d }) => {
                // Use timezone-aware boundaries for current month
                return d >= timestamps.monthStart;
            })
            .map(({ i }) => i);
        
        if (currentMonthIndices.length > 0) {
            const monthlyOpenIdx = currentMonthIndices[0];
            if (dailyOpens[monthlyOpenIdx] && dailyCloses[lastDailyIdx]) {
                monthly = calculateTrend(dailyOpens[monthlyOpenIdx], dailyCloses[lastDailyIdx]);
            }
        }

        // WEEKLY: first open of current week vs last close (timezone-aware)
        let weekly: TrendDirection = 'neutral';
        const weeklyIndices = dateObjs
            .map((d, i) => ({ d, i }))
            .filter(({ d }) => {
                // Use timezone-aware boundaries for current week
                return d >= timestamps.weekStart;
            })
            .map(({ i }) => i);
        
        if (weeklyIndices.length > 0) {
            const weeklyOpenIdx = weeklyIndices[0];
            if (dailyOpens[weeklyOpenIdx] && dailyCloses[lastDailyIdx]) {
                weekly = calculateTrend(dailyOpens[weeklyOpenIdx], dailyCloses[lastDailyIdx]);
            }
        } else {
            // Fallback to last 5 days if no data in current week
            const fallbackWeeklyOpenIdx = Math.max(0, lastDailyIdx - 4);
            if (dailyOpens[fallbackWeeklyOpenIdx] && dailyCloses[lastDailyIdx]) {
                weekly = calculateTrend(dailyOpens[fallbackWeeklyOpenIdx], dailyCloses[lastDailyIdx]);
            }
        }

        // DAILY: first open of today vs current last close of today (timezone-aware)
        let daily: TrendDirection = 'neutral';
        if (hourlyOpens && hourlyCloses && hourlyTimestamps) {
            const hourlyDateObjs: Date[] = (hourlyTimestamps as number[]).map((ts: number) => new Date(ts * 1000));
            const todayIndices = hourlyDateObjs
                .map((d, i) => ({ d, i }))
                .filter(({ d }) => {
                    // Use timezone-aware boundaries for today
                    return d >= timestamps.todayStart;
                })
                .map(({ i }) => i);
            
            if (todayIndices.length > 0) {
                const todayFirstIdx = todayIndices[0];
                const todayLastIdx = todayIndices[todayIndices.length - 1];
                if (hourlyOpens[todayFirstIdx] && hourlyCloses[todayLastIdx]) {
                    daily = calculateTrend(hourlyOpens[todayFirstIdx], hourlyCloses[todayLastIdx]);
                }
            } else if (dailyOpens[lastDailyIdx] && dailyCloses[lastDailyIdx]) {
                daily = calculateTrend(dailyOpens[lastDailyIdx], dailyCloses[lastDailyIdx]);
            }
        } else if (dailyOpens[lastDailyIdx] && dailyCloses[lastDailyIdx]) {
            daily = calculateTrend(dailyOpens[lastDailyIdx], dailyCloses[lastDailyIdx]);
        }

        // DAILY-1: first open of yesterday vs last close of yesterday (timezone-aware)
        let daily1: TrendDirection = 'neutral';
        if (hourlyOpens && hourlyCloses && hourlyTimestamps) {
            const hourlyDateObjs: Date[] = (hourlyTimestamps as number[]).map((ts: number) => new Date(ts * 1000));
            const yesterdayIndices = hourlyDateObjs
                .map((d, i) => ({ d, i }))
                .filter(({ d }) => {
                    // Use timezone-aware boundaries for yesterday
                    return d >= timestamps.yesterdayStart && d < timestamps.yesterdayEnd;
                })
                .map(({ i }) => i);
            
            if (yesterdayIndices.length > 0) {
                const yesterdayFirstIdx = yesterdayIndices[0];
                const yesterdayLastIdx = yesterdayIndices[yesterdayIndices.length - 1];
                if (hourlyOpens[yesterdayFirstIdx] && hourlyCloses[yesterdayLastIdx]) {
                    daily1 = calculateTrend(hourlyOpens[yesterdayFirstIdx], hourlyCloses[yesterdayLastIdx]);
                }
            } else if (lastDailyIdx > 0 && dailyOpens[lastDailyIdx - 1] && dailyCloses[lastDailyIdx - 1]) {
                daily1 = calculateTrend(dailyOpens[lastDailyIdx - 1], dailyCloses[lastDailyIdx - 1]);
            }
        } else if (lastDailyIdx > 0 && dailyOpens[lastDailyIdx - 1] && dailyCloses[lastDailyIdx - 1]) {
            daily1 = calculateTrend(dailyOpens[lastDailyIdx - 1], dailyCloses[lastDailyIdx - 1]);
        }

        return { daily, daily1, weekly, monthly, monthly1 };

    } catch (error) {
        return {
            daily: 'neutral',
            daily1: 'neutral',
            weekly: 'neutral',
            monthly: 'neutral',
            monthly1: 'neutral'
        };
    }
}

// Get category for a forex pair
function getCategory(pair: string): ForexPair['category'] {
    if (['EURUSD', 'USDJPY', 'GBPUSD', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD'].includes(pair)) {
        return 'major';
    } else if ([
        'EURGBP', 'EURJPY', 'EURCHF', 'EURCAD', 'EURAUD', 'EURNZD',
        'GBPJPY', 'GBPCHF', 'GBPCAD', 'GBPAUD', 'GBPNZD',
        'AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD',
        'CADCHF', 'CADJPY', 'CHFJPY', 'NZDCAD', 'NZDCHF', 'NZDJPY',
    ].includes(pair)) {
        return 'minor';
    } else if (['BTCUSD'].includes(pair)) {
        return 'exotic';
    } else if (['XAUUSD', 'XAGUSD', 'BRENT', 'WTI'].includes(pair)) {
        return 'commodity';
    } else if (['US100', 'US30'].includes(pair)) {
        return 'exotic';
    } else {
        return 'exotic';
    }
}

// Timezone-specific cache
interface CacheEntry {
    data: ForexPair[];
    timestamp: number;
    timezone: string;
}

const cache: { [key: string]: CacheEntry } = {};
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes (shorter for timezone-specific data)

function getCachedData(timezone: string): ForexPair[] | null {
    const cacheKey = `forex-data-${timezone}`;
    const entry = cache[cacheKey];
    
    if (!entry || Date.now() - entry.timestamp > CACHE_TTL) {
        return null;
    }
    
    return entry.data;
}

function setCachedData(data: ForexPair[], timezone: string): void {
    const cacheKey = `forex-data-${timezone}`;
    cache[cacheKey] = {
        data,
        timestamp: Date.now(),
        timezone
    };
}

export async function GET(request: Request) {
    // Extract timezone from query parameters
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get('timezone') || 'UTC';
    
    const cachedData = getCachedData(timezone);
    if (cachedData) {
        return NextResponse.json(cachedData);
    }

    const results: ForexPair[] = [];

    for (const [pair, yahooSymbol] of Object.entries(yahooSymbolMap)) {
        try {
            // Use Yahoo Finance as PRIMARY source with proper timeframe calculations
            const yahooData = await fetchYahooFinanceData(yahooSymbol, timezone);
            
            // Use TradingView only as fallback when Yahoo returns neutral
            const fallbackTrend = await fetchTradingViewFallback(pair);
            
            const finalData: TimeframeData = {
                daily: yahooData.daily !== 'neutral' ? yahooData.daily : fallbackTrend,
                daily1: yahooData.daily1 !== 'neutral' ? yahooData.daily1 : fallbackTrend,
                weekly: yahooData.weekly !== 'neutral' ? yahooData.weekly : fallbackTrend,
                monthly: yahooData.monthly !== 'neutral' ? yahooData.monthly : fallbackTrend,
                monthly1: yahooData.monthly1 !== 'neutral' ? yahooData.monthly1 : fallbackTrend,
            };
            
            const trends = [finalData.monthly1, finalData.monthly, finalData.weekly, finalData.daily1, finalData.daily];
            const alignment = trends.every(t => t === trends[0]);
            
            results.push({
                id: yahooSymbol,
                pair,
                category: getCategory(pair),
                daily: finalData.daily,
                daily1: finalData.daily1,
                weekly: finalData.weekly,
                monthly: finalData.monthly,
                monthly1: finalData.monthly1,
                alignment,
                lastUpdated: new Date(),
            });
            
        } catch (error) {
            // Ultimate fallback
            results.push({
                id: yahooSymbol,
                pair,
                category: getCategory(pair),
                daily: 'neutral',
                daily1: 'neutral',
                weekly: 'neutral',
                monthly: 'neutral',
                monthly1: 'neutral',
                alignment: true,
                lastUpdated: new Date(),
            });
        }
    }
    
    setCachedData(results, timezone);
    return NextResponse.json(results);
}
