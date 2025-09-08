import { NextResponse } from 'next/server';
import { ForexPair, TrendDirection } from '@/types/forex';
import { getTimeframeTimestamps, convertToTimezone, isSundayInTimezone, getCurrencyTradingPeriods } from '@/lib/timezone-utils';
import { getTradingPeriods, getAssetType, getCurrencyTimezone, type AssetType } from '@/lib/trading-periods';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

// Enable dynamic rendering for timezone-based requests
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// CORS headers for cross-origin requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Expires, Pragma, If-Modified-Since, If-None-Match',
    'Access-Control-Max-Age': '86400',
};

// Market hours for different instruments (in UTC)
const MARKET_HOURS = {
    // Forex: Sunday 22:00 UTC to Friday 22:00 UTC
    forex: {
        openDay: 0, // Sunday
        openHour: 22,
        closeDay: 5, // Friday
        closeHour: 22
    },
    // Crypto: 24/7
    crypto: {
        openDay: 0,
        openHour: 0,
        closeDay: 6,
        closeHour: 23
    },
    // Commodities: Generally Monday 00:00 UTC to Friday 21:00 UTC (varies by commodity)
    commodity: {
        openDay: 1, // Monday
        openHour: 0,
        closeDay: 5, // Friday
        closeHour: 21
    },
    // US Indices: Monday-Friday 14:30-21:00 UTC (9:30AM-4:00PM ET)
    usIndex: {
        openDay: 1, // Monday
        openHour: 14.5, // 14:30
        closeDay: 5, // Friday
        closeHour: 21
    }
};

function isMarketOpen(pair: string): boolean {
    const now = new Date();
    const utcDay = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const utcHour = now.getUTCHours() + (now.getUTCMinutes() / 60); // Include minutes as decimal

    let marketType: keyof typeof MARKET_HOURS;

    // Determine market type based on pair
    if (pair === 'BTCUSD') {
        marketType = 'crypto';
    } else if (['XAUUSD', 'XAGUSD', 'BRENT', 'WTI'].includes(pair)) {
        marketType = 'commodity';
    } else if (['US100', 'US30'].includes(pair)) {
        marketType = 'usIndex';
    } else {
        marketType = 'forex';
    }

    const hours = MARKET_HOURS[marketType];

    // Special handling for forex (most common case)
    if (marketType === 'forex') {
        // Forex is closed from Friday 22:00 UTC to Sunday 22:00 UTC
        if (utcDay === 6) { // Saturday - always closed
            return false;
        }
        if (utcDay === 0 && utcHour < 22) { // Sunday before 22:00 UTC - closed
            return false;
        }
        if (utcDay === 5 && utcHour >= 22) { // Friday after 22:00 UTC - closed
            return false;
        }
        return true; // Monday-Friday between 22:00 Sunday and 22:00 Friday
    }

    // For other market types, use the general logic
    if (utcDay < hours.openDay || utcDay > hours.closeDay) {
        return false;
    }

    if (utcDay === hours.openDay && utcHour < hours.openHour) {
        return false;
    }

    if (utcDay === hours.closeDay && utcHour >= hours.closeHour) {
        return false;
    }

    return true;
}

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
    BTCUSD: 'BTCUSD',
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

// TradingView data source (PRIMARY for current prices) - timezone-aware with Sunday rule
async function fetchTradingViewTrend(symbol: string, timezone: string = 'UTC', pair?: string): Promise<TrendDirection> {
    // Apply Sunday rule: if today is Sunday in user's timezone, return neutral (except for crypto current data)
    // For forex pairs: return neutral on Sunday
    // For crypto: allow normal processing (trades 24/7)
    if (isSundayInTimezone(timezone) && pair !== 'BTCUSD') {
        return 'neutral';
    }

    // Try multiple data source strategies in order of reliability
    const strategies = [
        () => fetchTradingViewDirectScraping(symbol, timezone, pair),
        () => fetchTradingViewFallbackScraping(symbol, timezone, pair),
        () => fetchYahooFinanceDailyTrend(yahooSymbolMap[pair!] || symbol, timezone, pair!)
    ];

    for (const [index, strategy] of strategies.entries()) {
        try {
            const result = await strategy();
            if (result !== 'neutral') {
                if (index > 0) {
                    console.log(`✅ ${pair}: Strategy ${index + 1} succeeded (${result})`);
                }
                return result;
            }
        } catch (error) {
            console.log(`⚠️ ${pair}: Strategy ${index + 1} failed - ${error instanceof Error ? error.message : 'Unknown error'}`);
            continue;
        }
    }

    // If all strategies fail, log the issue and return neutral
    console.error(`❌ ${pair}: All TradingView strategies failed, returning neutral`);
    return 'neutral';
}

// Enhanced TradingView direct scraping with better patterns
async function fetchTradingViewDirectScraping(symbol: string, timezone: string = 'UTC', pair?: string): Promise<TrendDirection> {
    // Special handling for commodity pairs - use different URL structure
    let scrapingUrl;
    if (pair && ['BRENT', 'WTI', 'XAUUSD', 'XAGUSD'].includes(pair)) {
        // Commodity pairs often use different TradingView URLs
        const commodityUrls: Record<string, string> = {
            'BRENT': 'https://www.tradingview.com/symbols/TVC-UKOIL/',
            'WTI': 'https://www.tradingview.com/symbols/TVC-USOIL/',
            'XAUUSD': 'https://www.tradingview.com/symbols/TVC-GOLD/',
            'XAGUSD': 'https://www.tradingview.com/symbols/TVC-SILVER/'
        };
        scrapingUrl = commodityUrls[pair] || `https://www.tradingview.com/symbols/${symbol.replace(':', '-')}/`;
    } else {
        scrapingUrl = `https://www.tradingview.com/symbols/${symbol.replace(':', '-')}/`;
    }
    
    console.log(`🌐 ${pair}: Fetching from ${scrapingUrl}`);
    
    const response = await fetch(scrapingUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Referer': 'https://www.tradingview.com/'
        },
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Enhanced patterns for more reliable data extraction
    const patterns = [
        // JSON data patterns (most reliable)
        /"change":\s*([+-]?[0-9]*\.?[0-9]+)/,
        /"changePercent":\s*([+-]?[0-9]*\.?[0-9]+)/,
        /"last_price":\s*([0-9]*\.?[0-9]+).*?"prev_close_price":\s*([0-9]*\.?[0-9]+)/s,
        
        // HTML element patterns (backup)
        /class="[^"]*js-symbol-change[^"]*"[^>]*>\s*([+-][0-9]*\.?[0-9]+)/,
        /data-symbol-change="([+-][^"]+)"/,
        /class="[^"]*changePercent[^"]*"[^>]*>([+-]?[0-9]*\.?[0-9]+)%/,
        
        // Direct value extraction
        /<span[^>]*>([+-]?[0-9]*\.[0-9]+)<\/span>/g
    ];

    for (const pattern of patterns) {
        const matches = pattern.global ? [...html.matchAll(pattern)] : [html.match(pattern)];
        
        for (const match of matches) {
            if (!match) continue;
            
            let changeValue: number | undefined;

            if (match[1] && match[2] && pattern.source.includes('prev_close')) {
                // Pattern with current and previous price
                const current = parseFloat(match[1]);
                const previous = parseFloat(match[2]);
                if (!isNaN(current) && !isNaN(previous) && previous > 0) {
                    changeValue = current - previous;
                }
            } else if (match[1]) {
                const cleanValue = match[1].replace(/[^0-9.+-]/g, '');
                changeValue = parseFloat(cleanValue);
            }

            if (changeValue !== undefined && !isNaN(changeValue) && Math.abs(changeValue) > 0.000001) {
                const trend = changeValue > 0 ? 'bullish' : changeValue < 0 ? 'bearish' : 'neutral';
                console.log(`📊 ${pair}: TradingView direct data: change=${changeValue} -> ${trend}`);
                return trend;
            }
        }
    }

    throw new Error('No valid change data found in HTML');
}

// Enhance Yahoo Finance data with TradingView fallback for neutral/missing data
async function enhanceWithTradingViewFallback(
    yahooData: TimeframeData, 
    tradingViewSymbol: string, 
    timezone: string, 
    pair: string
): Promise<TimeframeData> {
    const enhanced = { ...yahooData };
    let fallbacksUsed = 0;
    
    // Check which timeframes need TradingView fallback
    const neutralTimeframes: (keyof TimeframeData)[] = [];
    
    Object.entries(yahooData).forEach(([timeframe, trend]) => {
        if (trend === 'neutral') {
            neutralTimeframes.push(timeframe as keyof TimeframeData);
        }
    });
    
    if (neutralTimeframes.length === 0) {
        console.log(`✅ ${pair}: Yahoo Finance data complete, no TradingView fallback needed`);
        return enhanced;
    }
    
    console.log(`🔄 ${pair}: Using TradingView fallback for: ${neutralTimeframes.join(', ')}`);
    
    // For current day data (daily), use TradingView direct fetching
    if (enhanced.daily === 'neutral') {
        try {
            const tradingViewTrend = await fetchTradingViewTrend(tradingViewSymbol, timezone, pair);
            if (tradingViewTrend !== 'neutral') {
                enhanced.daily = tradingViewTrend;
                fallbacksUsed++;
                console.log(`✨ ${pair}: TradingView fallback for daily: ${tradingViewTrend}`);
            }
        } catch (error) {
            console.log(`⚠️ ${pair}: TradingView fallback failed for daily: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    // For other timeframes with neutral data, try to infer from available data
    const currentDay = new Date().getUTCDay();
    
    // Weekly inference: On Monday/Tuesday, weekly should match daily
    if (enhanced.weekly === 'neutral' && enhanced.daily !== 'neutral' && currentDay <= 2) {
        enhanced.weekly = enhanced.daily;
        fallbacksUsed++;
        console.log(`✨ ${pair}: Inferred weekly from daily: ${enhanced.daily}`);
    }
    
    // Monthly inference: First few days of month, monthly should match daily  
    const dayOfMonth = new Date().getUTCDate();
    if (enhanced.monthly === 'neutral' && enhanced.daily !== 'neutral' && dayOfMonth <= 3) {
        enhanced.monthly = enhanced.daily;
        fallbacksUsed++;
        console.log(`✨ ${pair}: Inferred monthly from daily: ${enhanced.daily}`);
    }
    
    // Daily-1 inference: Use most recent non-neutral trend if available
    if (enhanced.daily1 === 'neutral') {
        const availableTrends = [enhanced.daily, enhanced.weekly, enhanced.monthly].filter(t => t !== 'neutral');
        if (availableTrends.length > 0) {
            // Use the most common trend or the daily trend if available
            const trendToUse = enhanced.daily !== 'neutral' ? enhanced.daily : availableTrends[0];
            enhanced.daily1 = trendToUse;
            fallbacksUsed++;
            console.log(`✨ ${pair}: Inferred daily1 from available data: ${trendToUse}`);
        }
    }
    
    // Monthly-1 inference: Use monthly trend if available and it's early in the month
    if (enhanced.monthly1 === 'neutral' && enhanced.monthly !== 'neutral') {
        enhanced.monthly1 = enhanced.monthly;
        fallbacksUsed++;
        console.log(`✨ ${pair}: Inferred monthly1 from monthly: ${enhanced.monthly}`);
    }
    
    console.log(`🎆 ${pair}: Applied ${fallbacksUsed} TradingView fallbacks`);
    return enhanced;
}

// Yahoo Finance daily trend as fallback for TradingView failures
async function fetchYahooFinanceDailyTrend(symbol: string, timezone: string = 'UTC', pair: string): Promise<TrendDirection> {
    try {
        const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2d&interval=1d`,
            { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' }
        );
        
        if (!response.ok) {
            throw new Error(`Yahoo Finance HTTP ${response.status}`);
        }
        
        const json = await response.json();
        const candles = json.chart?.result?.[0]?.indicators?.quote?.[0];
        const opens = candles?.open;
        const closes = candles?.close;
        
        if (!opens || !closes || opens.length < 2 || closes.length < 2) {
            throw new Error('Insufficient Yahoo Finance data');
        }
        
        // Get the most recent complete candle
        const lastIdx = opens.length - 1;
        const open = opens[lastIdx];
        const close = closes[lastIdx];
        
        if (typeof open === 'number' && typeof close === 'number') {
            const trend = calculateTrend(open, close);
            console.log(`📈 ${pair}: Yahoo Finance daily fallback: O=${open.toFixed(5)} C=${close.toFixed(5)} -> ${trend}`);
            return trend;
        }
        
        throw new Error('Invalid Yahoo Finance price data');
        
    } catch (error) {
        console.error(`Yahoo Finance daily error for ${pair}:`, error instanceof Error ? error.message : String(error));
        throw error;
    }
}

// TradingView page scraping fallback
async function fetchTradingViewFallbackScraping(symbol: string, timezone: string = 'UTC', pair?: string): Promise<TrendDirection> {
    // Apply Sunday rule: if today is Sunday in user's timezone, return neutral (except for crypto current data)
    // For forex pairs: return neutral on Sunday
    // For crypto: allow normal processing (trades 24/7)
    if (isSundayInTimezone(timezone) && pair !== 'BTCUSD') {
        return 'neutral';
    }
    try {
        const tradingViewUrls: Record<string, string> = {
            AUDCAD: 'https://www.tradingview.com/symbols/FX:AUDCAD/',
            AUDCHF: 'https://www.tradingview.com/symbols/FX:AUDCHF/',
            AUDJPY: 'https://www.tradingview.com/symbols/FX:AUDJPY/',
            AUDNZD: 'https://www.tradingview.com/symbols/FX:AUDNZD/',
            AUDUSD: 'https://www.tradingview.com/symbols/FX:AUDUSD/',
            BRENT: 'https://www.tradingview.com/symbols/TVC:UKOIL/',
            BTCUSD: 'https://www.tradingview.com/symbols/BTCUSD/',
            CADCHF: 'https://www.tradingview.com/symbols/FX:CADCHF/',
            CADJPY: 'https://www.tradingview.com/symbols/FX:CADJPY/',
            CHFJPY: 'https://www.tradingview.com/symbols/FX:CHFJPY/',
            EURAUD: 'https://www.tradingview.com/symbols/FX:EURAUD/',
            EURCAD: 'https://www.tradingview.com/symbols/FX:EURCAD/',
            EURCHF: 'https://www.tradingview.com/symbols/FX:EURCHF/',
            EURGBP: 'https://www.tradingview.com/symbols/FX:EURGBP/',
            EURJPY: 'https://www.tradingview.com/symbols/FX:EURJPY/',
            EURNZD: 'https://www.tradingview.com/symbols/FX:EURNZD/',
            EURUSD: 'https://www.tradingview.com/symbols/FX:EURUSD/',
            GBPAUD: 'https://www.tradingview.com/symbols/FX:GBPAUD/',
            GBPCAD: 'https://www.tradingview.com/symbols/FX:GBPCAD/',
            GBPCHF: 'https://www.tradingview.com/symbols/FX:GBPCHF/',
            GBPJPY: 'https://www.tradingview.com/symbols/FX:GBPJPY/',
            GBPNZD: 'https://www.tradingview.com/symbols/FX:GBPNZD/',
            GBPUSD: 'https://www.tradingview.com/symbols/FX:GBPUSD/',
            NZDCAD: 'https://www.tradingview.com/symbols/FX:NZDCAD/',
            NZDCHF: 'https://www.tradingview.com/symbols/FX:NZDCHF/',
            NZDJPY: 'https://www.tradingview.com/symbols/FX:NZDJPY/',
            NZDUSD: 'https://www.tradingview.com/symbols/FX:NZDUSD/',
            US100: 'https://www.tradingview.com/symbols/TVC:NDX/',
            US30: 'https://www.tradingview.com/symbols/TVC:DJI/',
            USDCAD: 'https://www.tradingview.com/symbols/FX:USDCAD/',
            USDCHF: 'https://www.tradingview.com/symbols/FX:USDCHF/',
            USDJPY: 'https://www.tradingview.com/symbols/FX:USDJPY/',
            WTI: 'https://www.tradingview.com/symbols/TVC:USOIL/',
            XAGUSD: 'https://www.tradingview.com/symbols/TVC:SILVER/',
            XAUUSD: 'https://www.tradingview.com/symbols/TVC:GOLD/',
        };

        // Convert symbol back to pair name for URL lookup
        const pairName = pair || Object.keys(tradingViewSymbolMap).find(key => tradingViewSymbolMap[key] === symbol);
        const url = tradingViewUrls[pairName || symbol];
        if (!url) return 'neutral';

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            cache: 'no-store'
        });

        if (!response.ok) return 'neutral';

        const html = await response.text();

        // Multiple patterns to extract change data
        const patterns = [
            /"change":(-?[0-9.]+)/,
            /"changePercent":(-?[0-9.]+)/,
            /class="[^"]*change[^"]*"[^>]*>\s*([+-]?[0-9.]+)/,
            /data-symbol-change="([^"]+)"/,
            /"lastPrice":([0-9.]+).*?"prevDayClosePrice":([0-9.]+)/s,
        ];

        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
                let changeValue: number | undefined;

                if (match[1] && match[2]) {
                    // Pattern with current and previous price
                    const current = parseFloat(match[1]);
                    const previous = parseFloat(match[2]);
                    changeValue = current - previous;
                } else if (match[1]) {
                    changeValue = parseFloat(match[1].replace(/[^0-9.-]/g, ''));
                }

                if (changeValue !== undefined && !isNaN(changeValue)) {
                    return changeValue > 0 ? 'bullish' : changeValue < 0 ? 'bearish' : 'neutral';
                }
            }
        }

        return 'neutral';
    } catch (error) {
        console.error(`TradingView scraping error for ${symbol}:`, error instanceof Error ? error.message : String(error));
        return 'neutral';
    }
}

// Note: The manual timezone helper functions have been replaced with the UTC-consistent
// trading periods utility for better calendar alignment and consistency

// NEW: Timezone-aware Yahoo Finance data fetcher (PRIMARY DATA SOURCE)
async function fetchYahooFinanceDataTimezoneAware(symbol: string, timezone: string = 'UTC', pair: string): Promise<TimeframeData> {
    try {
        console.log(`🌐 ${pair}: Fetching Yahoo Finance data for timezone ${timezone}`);
        
        // Get currency-specific timezone for more accurate data
        const currencyTimezone = getCurrencyTimezone(pair);
        console.log(`🗺️ ${pair}: Currency timezone: ${currencyTimezone}, User timezone: ${timezone}`);
        
        // Fetch extended range data for accurate timezone-based calculations
        const dailyRes = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`,
            { 
                headers: { 'User-Agent': 'Mozilla/5.0' }, 
                cache: 'no-store' 
            }
        );
        
        if (!dailyRes.ok) {
            throw new Error(`Yahoo Finance API failed with status: ${dailyRes.status}`);
        }
        
        const dailyJson = await dailyRes.json();
        const dailyResult = dailyJson.chart?.result?.[0];
        
        if (!dailyResult) {
            throw new Error('No Yahoo Finance data result');
        }
        
        const dailyCandles = dailyResult.indicators?.quote?.[0];
        const dailyOpens = dailyCandles?.open;
        const dailyCloses = dailyCandles?.close;
        const dailyTimestamps = dailyResult.timestamp;
        
        if (!dailyOpens || !dailyCloses || !dailyTimestamps) {
            throw new Error(`Invalid Yahoo Finance data structure for ${symbol}`);
        }
        
        // Get timezone-aware trading periods using the user's selected timezone
        const tradingPeriods = getTradingPeriods(pair, null); // Use current time
        
        // Convert Yahoo Finance timestamps to Date objects
        const dateObjs: Date[] = (dailyTimestamps as number[]).map((ts: number) => new Date(ts * 1000));
        const lastDailyIdx = dailyOpens.length - 1;
        
        console.log(`📅 ${pair}: Data range from ${dateObjs[0]?.toISOString().slice(0,10)} to ${dateObjs[lastDailyIdx]?.toISOString().slice(0,10)}`);
        
        // Enhanced timezone-aware helper function
        const findTimezoneAwareDataIndex = (targetStart: Date, targetEnd?: Date, periodName?: string): { openIdx: number; closeIdx: number } => {
            let openIdx = -1;
            let closeIdx = -1;
            
            // Convert target dates to user's timezone for comparison
            const targetStartInUserTz = new Date(targetStart.toLocaleString('en-US', { timeZone: timezone }));
            const targetEndInUserTz = targetEnd ? new Date(targetEnd.toLocaleString('en-US', { timeZone: timezone })) : null;
            
            console.log(`🎅 ${pair} ${periodName}: Looking for ${targetStartInUserTz.toISOString().slice(0,10)} in ${timezone}`);
            
            // Find opening index - first data point on or after target start date
            for (let i = 0; i < dateObjs.length; i++) {
                const dataDateInUserTz = new Date(dateObjs[i].toLocaleString('en-US', { timeZone: timezone }));
                if (dataDateInUserTz.toDateString() === targetStartInUserTz.toDateString() || dataDateInUserTz >= targetStartInUserTz) {
                    openIdx = i;
                    console.log(`🔍 ${pair} ${periodName}: Found open data at index ${i} (${dateObjs[i].toISOString().slice(0,10)})`);
                    break;
                }
            }
            
            // If no exact match, find closest available data
            if (openIdx === -1) {
                // Find closest date within 7 days
                let closestIdx = -1;
                let closestDiff = Infinity;
                
                for (let i = 0; i < dateObjs.length; i++) {
                    const dataDateInUserTz = new Date(dateObjs[i].toLocaleString('en-US', { timeZone: timezone }));
                    const diffDays = Math.abs((dataDateInUserTz.getTime() - targetStartInUserTz.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays <= 7 && diffDays < closestDiff) {
                        closestDiff = diffDays;
                        closestIdx = i;
                    }
                }
                
                if (closestIdx !== -1) {
                    openIdx = closestIdx;
                    console.log(`🔄 ${pair} ${periodName}: Using closest data ${closestDiff.toFixed(1)} days away`);
                } else {
                    // Final fallback to most recent
                    openIdx = lastDailyIdx;
                    console.log(`⚠️ ${pair} ${periodName}: Using latest data as fallback`);
                }
            }
            
            // Find closing index
            if (targetEndInUserTz) {
                // Find last data point before or on target end
                for (let i = dateObjs.length - 1; i >= 0; i--) {
                    const dataDateInUserTz = new Date(dateObjs[i].toLocaleString('en-US', { timeZone: timezone }));
                    if (dataDateInUserTz <= targetEndInUserTz) {
                        closeIdx = i;
                        break;
                    }
                }
                if (closeIdx === -1) closeIdx = openIdx; // Use same as open if no better option
            } else {
                closeIdx = lastDailyIdx; // Use latest available data
            }
            
            // Ensure valid indices
            if (openIdx < 0) openIdx = 0;
            if (closeIdx < 0) closeIdx = lastDailyIdx;
            
            return { openIdx, closeIdx };
        };
        
        // Calculate all timeframe trends using timezone-aware periods
        const trends: TimeframeData = {
            daily: 'neutral',
            daily1: 'neutral',
            weekly: 'neutral', 
            monthly: 'neutral',
            monthly1: 'neutral'
        };
        
        // MONTHLY-1: Previous month
        const monthly1Indices = findTimezoneAwareDataIndex(
            tradingPeriods.periods.monthly1.start,
            tradingPeriods.periods.monthly1.end,
            'MONTHLY1'
        );
        if (monthly1Indices.openIdx >= 0 && monthly1Indices.closeIdx >= 0 &&
            dailyOpens[monthly1Indices.openIdx] && dailyCloses[monthly1Indices.closeIdx]) {
            trends.monthly1 = calculateTrend(
                dailyOpens[monthly1Indices.openIdx],
                dailyCloses[monthly1Indices.closeIdx]
            );
        }
        
        // MONTHLY: Current month
        const monthlyIndices = findTimezoneAwareDataIndex(tradingPeriods.periods.monthly.start, null, 'MONTHLY');
        if (monthlyIndices.openIdx >= 0 && monthlyIndices.closeIdx >= 0 &&
            dailyOpens[monthlyIndices.openIdx] && dailyCloses[monthlyIndices.closeIdx]) {
            trends.monthly = calculateTrend(
                dailyOpens[monthlyIndices.openIdx],
                dailyCloses[monthlyIndices.closeIdx]
            );
        }
        
        // WEEKLY: Current week
        const weeklyIndices = findTimezoneAwareDataIndex(tradingPeriods.periods.weekly.start, null, 'WEEKLY');
        if (weeklyIndices.openIdx >= 0 && weeklyIndices.closeIdx >= 0 &&
            dailyOpens[weeklyIndices.openIdx] && dailyCloses[weeklyIndices.closeIdx]) {
            trends.weekly = calculateTrend(
                dailyOpens[weeklyIndices.openIdx],
                dailyCloses[weeklyIndices.closeIdx]
            );
        }
        
        // DAILY: Today
        const dailyIndices = findTimezoneAwareDataIndex(tradingPeriods.periods.daily.start, null, 'DAILY');
        if (dailyIndices.openIdx >= 0 && dailyIndices.closeIdx >= 0 &&
            dailyOpens[dailyIndices.openIdx] && dailyCloses[dailyIndices.closeIdx]) {
            trends.daily = calculateTrend(
                dailyOpens[dailyIndices.openIdx],
                dailyCloses[dailyIndices.closeIdx]
            );
        }
        
        // DAILY-1: Yesterday
        const daily1Indices = findTimezoneAwareDataIndex(
            tradingPeriods.periods.daily1.start,
            tradingPeriods.periods.daily1.end,
            'DAILY1'
        );
        if (daily1Indices.openIdx >= 0 && daily1Indices.closeIdx >= 0 &&
            dailyOpens[daily1Indices.openIdx] && dailyCloses[daily1Indices.closeIdx]) {
            trends.daily1 = calculateTrend(
                dailyOpens[daily1Indices.openIdx],
                dailyCloses[daily1Indices.closeIdx]
            );
        }
        
        // Monday alignment fix at Yahoo Finance level
        const currentDay = new Date().getUTCDay();
        if (currentDay === 1 && trends.daily !== 'neutral') { // Monday
            if (trends.weekly !== trends.daily) {
                console.log(`🔧 ${pair}: Yahoo Monday fix - Weekly ${trends.weekly} -> Daily ${trends.daily}`);
                trends.weekly = trends.daily;
            }
        }
        
        return trends;
        
    } catch (error) {
        console.error(`Yahoo Finance timezone-aware error for ${pair}:`, error instanceof Error ? error.message : String(error));
        // Return neutral trends on error - will be handled by fallback
        return {
            daily: 'neutral',
            daily1: 'neutral',
            weekly: 'neutral',
            monthly: 'neutral',
            monthly1: 'neutral'
        };
    }
}

// OLD: Yahoo Finance backup data fetcher - now using UTC-consistent trading periods utility
async function fetchYahooFinanceDataLegacy(symbol: string, timezone: string = 'UTC', pair: string): Promise<TimeframeData> {
    try {
        // Fetch daily data (extended range for monthly calculations)
        const dailyRes = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`,
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

        // Use the new UTC-consistent trading periods utility
        const tradingPeriods = getTradingPeriods(pair);
        const lastDailyIdx = dailyOpens.length - 1;

        // Convert Unix timestamps to Date objects (Yahoo timestamps are in UTC)
        const dateObjs: Date[] = (dailyTimestamps as number[]).map((ts: number) => new Date(ts * 1000));

        // Enhanced helper function to find data point index with better fallback logic
        const findDataIndex = (targetStart: Date, targetEnd?: Date, periodName?: string): { openIdx: number; closeIdx: number } => {
            let openIdx = -1;
            let closeIdx = -1;

            // Find opening index (first data point on or after target start)
            for (let i = 0; i < dateObjs.length; i++) {
                if (dateObjs[i] >= targetStart) {
                    openIdx = i;
                    break;
                }
            }

            // Enhanced fallback logic for missing opening data
            if (openIdx === -1 && dateObjs.length > 0) {
                // Try to find the closest available data within a reasonable range
                const targetTime = targetStart.getTime();
                const oneDayMs = 24 * 60 * 60 * 1000;
                
                // Look for data within 3 days of target start
                for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
                    const earlierTarget = new Date(targetTime - dayOffset * oneDayMs);
                    const laterTarget = new Date(targetTime + dayOffset * oneDayMs);
                    
                    // Check earlier dates first (for historical data)
                    for (let i = 0; i < dateObjs.length; i++) {
                        if (dateObjs[i] >= earlierTarget && dateObjs[i] < targetStart) {
                            openIdx = i;
                            console.log(`🔄 ${pair} ${periodName}: Using data ${dayOffset} days before target (${dateObjs[i].toISOString().slice(0,10)})`);
                            break;
                        }
                    }
                    
                    if (openIdx === -1) {
                        // Check later dates
                        for (let i = 0; i < dateObjs.length; i++) {
                            if (dateObjs[i] >= laterTarget) {
                                openIdx = i;
                                console.log(`🔄 ${pair} ${periodName}: Using data ${dayOffset} days after target (${dateObjs[i].toISOString().slice(0,10)})`);
                                break;
                            }
                        }
                    }
                    
                    if (openIdx !== -1) break;
                }
                
                // Final fallback to most recent data if still no match
                if (openIdx === -1) {
                    openIdx = lastDailyIdx;
                    console.log(`⚠️ ${pair} ${periodName}: No data near ${targetStart.toISOString().slice(0,10)}, using latest (${dateObjs[openIdx].toISOString().slice(0,10)})`);
                }
            }

            // Find closing index with enhanced logic
            if (targetEnd) {
                // Find the last data point before target end
                for (let i = dateObjs.length - 1; i >= 0; i--) {
                    if (dateObjs[i] < targetEnd) {
                        closeIdx = i;
                        break;
                    }
                }
                
                // If no data before target end, use the closest available
                if (closeIdx === -1) {
                    for (let i = 0; i < dateObjs.length; i++) {
                        if (dateObjs[i] <= targetEnd) {
                            closeIdx = i;
                        } else {
                            break;
                        }
                    }
                }
            } else {
                closeIdx = lastDailyIdx; // Use latest available data
            }
            
            // Ensure we have valid indices
            if (openIdx === -1) openIdx = 0;
            if (closeIdx === -1) closeIdx = lastDailyIdx;
            
            // For same-day periods, use the same index
            if (targetEnd && Math.abs(targetEnd.getTime() - targetStart.getTime()) < 24 * 60 * 60 * 1000) {
                closeIdx = openIdx;
            }

            // Enhanced debug logging
            if (periodName && (openIdx < 0 || closeIdx < 0 || !dailyOpens[openIdx] || !dailyCloses[closeIdx])) {
                console.log(`⚠️ ${pair} ${periodName}: DATA ISSUE - openIdx=${openIdx} closeIdx=${closeIdx}`);
                if (openIdx >= 0) console.log(`   openDate=${dateObjs[openIdx]?.toISOString().slice(0,10)} openPrice=${dailyOpens[openIdx]}`);
                if (closeIdx >= 0) console.log(`   closeDate=${dateObjs[closeIdx]?.toISOString().slice(0,10)} closePrice=${dailyCloses[closeIdx]}`);
            }

            return { openIdx, closeIdx };
        };

        // Calculate trends using the UTC-consistent trading periods
        const trends: TimeframeData = {
            daily: 'neutral',
            daily1: 'neutral', 
            weekly: 'neutral',
            monthly: 'neutral',
            monthly1: 'neutral'
        };

        // MONTHLY-1: Previous month (historical period)
        const monthly1Indices = findDataIndex(
            tradingPeriods.periods.monthly1.start,
            tradingPeriods.periods.monthly1.end,
            'MONTHLY1'
        );
        if (monthly1Indices.openIdx >= 0 && monthly1Indices.closeIdx >= 0 && 
            monthly1Indices.openIdx <= monthly1Indices.closeIdx &&
            dailyOpens[monthly1Indices.openIdx] && dailyCloses[monthly1Indices.closeIdx]) {
            trends.monthly1 = calculateTrend(
                dailyOpens[monthly1Indices.openIdx],
                dailyCloses[monthly1Indices.closeIdx]
            );
        }

        // MONTHLY: Current month
        const monthlyIndices = findDataIndex(tradingPeriods.periods.monthly.start, undefined, 'MONTHLY');
        if (monthlyIndices.openIdx >= 0 && monthlyIndices.closeIdx >= 0 &&
            dailyOpens[monthlyIndices.openIdx] && dailyCloses[monthlyIndices.closeIdx]) {
            trends.monthly = calculateTrend(
                dailyOpens[monthlyIndices.openIdx],
                dailyCloses[monthlyIndices.closeIdx]
            );
        }

        // WEEKLY: Current week
        const weeklyIndices = findDataIndex(tradingPeriods.periods.weekly.start, undefined, 'WEEKLY');
        if (weeklyIndices.openIdx >= 0 && weeklyIndices.closeIdx >= 0 &&
            dailyOpens[weeklyIndices.openIdx] && dailyCloses[weeklyIndices.closeIdx]) {
            trends.weekly = calculateTrend(
                dailyOpens[weeklyIndices.openIdx],
                dailyCloses[weeklyIndices.closeIdx]
            );
        }

        // DAILY: Today
        const dailyIndices = findDataIndex(tradingPeriods.periods.daily.start, undefined, 'DAILY');
        if (dailyIndices.openIdx >= 0 && dailyIndices.closeIdx >= 0 &&
            dailyOpens[dailyIndices.openIdx] && dailyCloses[dailyIndices.closeIdx]) {
            trends.daily = calculateTrend(
                dailyOpens[dailyIndices.openIdx],
                dailyCloses[dailyIndices.closeIdx]
            );
        }

        // Monday alignment and other fixes are now handled in validateAndFixTrendData

        // DAILY-1: Yesterday (with Sunday rule for forex)
        if (isSundayInTimezone(timezone) && getAssetType(pair) !== 'crypto') {
            trends.daily1 = 'neutral'; // Forex markets are closed on Sunday
        } else {
            const daily1Indices = findDataIndex(
                tradingPeriods.periods.daily1.start,
                tradingPeriods.periods.daily1.end,
                'DAILY1'
            );
            if (daily1Indices.openIdx >= 0 && daily1Indices.closeIdx >= 0 &&
                daily1Indices.openIdx <= daily1Indices.closeIdx &&
                dailyOpens[daily1Indices.openIdx] && dailyCloses[daily1Indices.closeIdx]) {
                trends.daily1 = calculateTrend(
                    dailyOpens[daily1Indices.openIdx],
                    dailyCloses[daily1Indices.closeIdx]
                );
            }
        }

        return trends;

    } catch (error) {
        console.error(`Yahoo Finance error for ${pair}:`, error instanceof Error ? error.message : String(error));
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
        return 'crypto';
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
const ACCURACY_CACHE_TTL = 30 * 1000; // 30 seconds for data with accuracy issues

function getCachedData(timezone: string): ForexPair[] | null {
    const cacheKey = `forex-data-${timezone}`;
    const entry = cache[cacheKey];

    if (!entry) {
        return null;
    }
    
    // Check for data accuracy issues to determine cache TTL
    const hasAccuracyIssues = entry.data.some(pair => {
        const currentDay = new Date().getUTCDay();
        const trends = [pair.daily, pair.weekly, pair.monthly];
        const neutralCount = trends.filter(t => t === 'neutral').length;
        
        // Issues: Monday misalignment, too many neutrals, or mixed signals
        const mondayMisalignment = currentDay === 1 && pair.daily !== pair.weekly && pair.daily !== 'neutral';
        const tooManyNeutrals = neutralCount >= 2;
        
        return mondayMisalignment || tooManyNeutrals;
    });
    
    const ttl = hasAccuracyIssues ? ACCURACY_CACHE_TTL : CACHE_TTL;
    
    if (Date.now() - entry.timestamp > ttl) {
        if (hasAccuracyIssues) {
            console.log(`🔄 Cache expired early due to accuracy issues (${ttl/1000}s TTL)`);
        }
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

// Remove VALIDATED_TRENDS - use only real data calculations

// Logging function to display trading periods in user's timezone
function logTradingPeriods(timezone: string) {
    console.log('\n🔍 TRADING PERIODS ANALYSIS');
    console.log('═══════════════════════════════════════════════════');
    console.log(`🌍 User Timezone: ${timezone}`);
    console.log(`📅 Current UTC Time: ${new Date().toISOString()}`);
    console.log(`🏠 Current Local Time: ${new Date().toLocaleString('en-US', { timeZone: timezone })}`);
    
    // Get trading periods for a sample pair to show the structure
    const samplePair = 'EURUSD';
    const tradingPeriods = getTradingPeriods(samplePair);
    
    console.log('\n📋 TRADING PERIODS (All pairs follow this structure):');
    console.log('───────────────────────────────────────────────────');
    
    Object.entries(tradingPeriods.periods).forEach(([period, data]) => {
        const startLocal = data.start.toLocaleString('en-US', { 
            timeZone: timezone, 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        const endLocal = data.end.toLocaleString('en-US', { 
            timeZone: timezone, 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        console.log(`${period.toUpperCase().padEnd(10)} ${data.tradingActive ? '✅' : '❌'} Active`);
        console.log(`           Start: ${startLocal} (${timezone})`);
        console.log(`           End:   ${endLocal} (${timezone})`);
        console.log(`           UTC Start: ${data.start.toISOString()}`);
        console.log(`           UTC End:   ${data.end.toISOString()}`);
        if (data.durationDays) {
            console.log(`           Duration: ${data.durationDays} days`);
        }
        console.log('');
    });
}

// Removed validateTrends function - using only real data calculations

// Function to log all pairs with their trends
function logAllPairsWithTrends(results: ForexPair[], timezone: string) {
    console.log('\n📆 ALL PAIRS TREND ANALYSIS');
    console.log('═'.repeat(51));
    
    let totalPairs = 0;
    
    // Group by category for organized display
    const categories = ['major', 'minor', 'commodity', 'crypto', 'exotic'] as const;
    
    categories.forEach(category => {
        const categoryPairs = results.filter(pair => pair.category === category);
        if (categoryPairs.length === 0) return;
        
        console.log(`\n🏷️  ${category.toUpperCase()} PAIRS:`);
        console.log('─'.repeat(50));
        
        categoryPairs.forEach(pairData => {
            totalPairs++;
            
            const trends = {
                daily: pairData.daily,
                daily1: pairData.daily1,
                weekly: pairData.weekly,
                monthly: pairData.monthly,
                monthly1: pairData.monthly1
            };
            
            // Display trends with icons
            const trendIcons = {
                bullish: '🔵',
                bearish: '🔴', 
                neutral: '⚪'
            };
            
            const trendDisplay = `${trendIcons[trends.daily]}D ${trendIcons[trends.daily1]}D1 ${trendIcons[trends.weekly]}W ${trendIcons[trends.monthly]}M ${trendIcons[trends.monthly1]}M1`;
            const alignmentIcon = pairData.alignment ? '🎯' : '  ';
            const marketStatus = pairData.marketOpen ? '📈' : '📴';
            
            console.log(`${alignmentIcon} ${marketStatus} ${pairData.pair.padEnd(8)} ${trendDisplay}`);
            
            // No more validation against expected trends - using real data only
        });
    });
    
    console.log('\n📈 SUMMARY:');
    console.log('─'.repeat(30));
    console.log(`Total Pairs: ${totalPairs}`);
    console.log('Using real-time data from TradingView and Yahoo Finance');
    
    console.log('\n🔑 LEGEND:');
    console.log('─────────────');
    console.log('🔵 Bullish  🔴 Bearish  ⚪ Neutral');
    console.log('🎯 Perfect Alignment  📈 Market Open  📴 Market Closed');
    console.log('D=Daily, D1=Daily-1, W=Weekly, M=Monthly, M1=Monthly-1');
}

// Main function to fetch trend data - Yahoo Finance PRIMARY, TradingView fallback
async function fetchTrendData(pair: string, yahooSymbol: string, tradingViewSymbol: string, timezone: string, assetType: AssetType): Promise<TimeframeData> {
    try {
        console.log(`📈 ${pair}: Fetching timezone-aware data for ${timezone}`);
        
        // PRIMARY: Get all timeframes from Yahoo Finance with timezone awareness
        const yahooData = await fetchYahooFinanceDataTimezoneAware(yahooSymbol, timezone, pair);
        
        console.log(`🌐 ${pair} Yahoo: D=${yahooData.daily} D1=${yahooData.daily1} W=${yahooData.weekly} M=${yahooData.monthly} M1=${yahooData.monthly1}`);
        
        // FALLBACK: Use TradingView only for neutral/missing data
        const enhancedData = await enhanceWithTradingViewFallback(yahooData, tradingViewSymbol, timezone, pair);
        
        console.log(`✨ ${pair} Enhanced: D=${enhancedData.daily} D1=${enhancedData.daily1} W=${enhancedData.weekly} M=${enhancedData.monthly} M1=${enhancedData.monthly1}`);
        
        // Apply comprehensive data validation and accuracy fixes
        const validatedData = validateAndFixTrendData(enhancedData, pair, timezone);
        
        // Return validated and corrected data
        return validatedData;
        
    } catch (error) {
        console.error(`Error in fetchTrendData for ${pair}:`, error instanceof Error ? error.message : String(error));
        
        // Fallback: neutral for all timeframes if data fetch fails
        return {
            daily: 'neutral',
            daily1: 'neutral',
            weekly: 'neutral',
            monthly: 'neutral',
            monthly1: 'neutral'
        };
    }
}

// Comprehensive data validation and accuracy fixing
function validateAndFixTrendData(data: TimeframeData, pair: string, timezone: string): TimeframeData {
    const validated = { ...data };
    const currentDay = new Date().getUTCDay(); // 0=Sunday, 1=Monday, etc.
    const now = new Date();
    
    // Monday Alignment Rule: Daily and Weekly must match on Mondays
    if (currentDay === 1) { // Monday
        if (validated.daily !== validated.weekly) {
            console.log(`🔧 ${pair}: Monday alignment fix - Weekly ${validated.weekly} -> Daily ${validated.daily}`);
            validated.weekly = validated.daily;
        }
        
        // First Monday of month check
        const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const firstMondayOfMonth = new Date(firstDayOfMonth);
        while (firstMondayOfMonth.getUTCDay() !== 1) {
            firstMondayOfMonth.setUTCDate(firstMondayOfMonth.getUTCDate() + 1);
        }
        
        if (now.getUTCDate() === firstMondayOfMonth.getUTCDate() && validated.daily !== 'neutral') {
            console.log(`🔧 ${pair}: First Monday of month - Monthly ${validated.monthly} -> Daily ${validated.daily}`);
            validated.monthly = validated.daily;
        }
    }
    
    // Missing Data Detection and Fixes
    const missingDataCount = Object.values(validated).filter(trend => trend === 'neutral').length;
    if (missingDataCount >= 1) { // Lower threshold for better data coverage
        console.warn(`⚠️ ${pair}: Missing data detected (${missingDataCount}/5 neutral)`);
        
        // Strategy 1: Infer daily from weekly if available and we're on Monday
        if (currentDay === 1 && validated.daily === 'neutral' && validated.weekly !== 'neutral') {
            console.log(`🔧 ${pair}: Monday - Inferring daily from weekly (${validated.weekly})`);
            validated.daily = validated.weekly;
        }
        
        // Strategy 2: If we have daily data but missing weekly/monthly, and it's early in period
        if (validated.daily !== 'neutral') {
            if (validated.weekly === 'neutral' && currentDay <= 2) { // Monday or Tuesday
                validated.weekly = validated.daily;
                console.log(`🔧 ${pair}: Inferred weekly from daily (${validated.daily})`);
            }
            
            // First few days of month - infer monthly from daily
            if (validated.monthly === 'neutral' && now.getUTCDate() <= 3) {
                validated.monthly = validated.daily;
                console.log(`🔧 ${pair}: Inferred monthly from daily (${validated.daily})`);
            }
        }
        
        // Strategy 3: If we have historical data but no current data, use most recent reliable signal
        if (validated.daily === 'neutral' && validated.daily1 !== 'neutral') {
            // Only for commodity pairs where daily data often fails
            const assetType = getAssetType(pair);
            const isWeekend = currentDay === 0 || currentDay === 6; // Sunday or Saturday
            if (assetType === 'commodity' && !isWeekend) {
                console.log(`🔧 ${pair}: Commodity fallback - Using daily1 for daily (${validated.daily1})`);
                validated.daily = validated.daily1;
                
                // Also fix weekly alignment on Monday
                if (currentDay === 1) {
                    validated.weekly = validated.daily;
                    console.log(`🔧 ${pair}: Commodity Monday alignment with fallback data`);
                }
            }
        }
    }
    
    // Weekend Market Closure Validation
    const isWeekend = currentDay === 0 || currentDay === 6; // Sunday or Saturday
    const assetType = getAssetType(pair);
    
    if (isWeekend && assetType !== 'crypto') {
        // Non-crypto markets should be neutral on weekends for current data
        if (validated.daily !== 'neutral') {
            console.log(`🔧 ${pair}: Weekend fix - Daily ${validated.daily} -> neutral`);
            validated.daily = 'neutral';
        }
    }
    
    // Sunday Rule for Forex
    if (isSundayInTimezone(timezone) && assetType === 'forex') {
        if (validated.daily !== 'neutral' || validated.daily1 !== 'neutral') {
            console.log(`🔧 ${pair}: Sunday rule - Setting daily/daily1 to neutral`);
            validated.daily = 'neutral';
            validated.daily1 = 'neutral';
        }
    }
    
    // Logical Consistency Checks
    const trends = [validated.monthly1, validated.monthly, validated.weekly, validated.daily1, validated.daily];
    const nonNeutralTrends = trends.filter(t => t !== 'neutral');
    
    if (nonNeutralTrends.length >= 2) {
        // Check for impossible trend combinations (all different directions)
        const bullishCount = nonNeutralTrends.filter(t => t === 'bullish').length;
        const bearishCount = nonNeutralTrends.filter(t => t === 'bearish').length;
        
        if (bullishCount > 0 && bearishCount > 0 && nonNeutralTrends.length >= 3) {
            console.warn(`⚠️ ${pair}: Mixed trend signals - Bullish:${bullishCount} Bearish:${bearishCount}`);
        }
    }
    
    return validated;
}

// Handle CORS preflight requests
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: corsHeaders,
    });
}

export async function GET(request: Request) {
    // Extract timezone from query parameters
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get('timezone') || 'UTC';
    const forceFresh = searchParams.get('fresh') === 'true'; // Force fresh data parameter

    // Log trading periods analysis
    logTradingPeriods(timezone);

    // Check cache first (unless forced fresh)
    if (!forceFresh) {
        const cachedData = getCachedData(timezone);
        if (cachedData) {
            // Still show analysis for cached data
            logAllPairsWithTrends(cachedData, timezone);
            return NextResponse.json(cachedData, { headers: corsHeaders });
        }
    } else {
        console.log('🔄 Force fresh data requested - bypassing cache');
    }

    const results: ForexPair[] = [];

    // Process all pairs in parallel for better performance
    const pairProcessingPromises = Object.entries(yahooSymbolMap).map(async ([pair, yahooSymbol]) => {
        try {
            // Get UTC-consistent trading periods using our validated utility
            const tradingPeriods = getTradingPeriods(pair);
            const assetType = getAssetType(pair);
            const marketOpen = isMarketOpen(pair);
            const tradingViewSymbol = tradingViewSymbolMap[pair];
            
            // Fetch real trend data with TradingView + Yahoo Finance integration
            const trendData = await fetchTrendData(pair, yahooSymbol, tradingViewSymbol, timezone, assetType);
            
            // Apply weekend and crypto-specific logic first
            let preliminaryData: TimeframeData = {
                // Daily periods: Apply weekend logic for non-crypto pairs
                daily: assetType === 'crypto' ? 
                    trendData.daily : 
                    (marketOpen ? trendData.daily : 'neutral'), // Neutral on weekends for non-crypto
                    
                daily1: assetType === 'crypto' ? 
                    trendData.daily1 : 
                    (tradingPeriods.periods.daily1.tradingActive ? trendData.daily1 : 'neutral'),

                // Historical periods: Use fetched data (weekends don't affect historical data)
                weekly: trendData.weekly,
                monthly: trendData.monthly, 
                monthly1: trendData.monthly1
            };
            
            // Apply comprehensive validation and accuracy fixes
            const finalData = validateAndFixTrendData(preliminaryData, pair, timezone);

            // Check for perfect alignment (all trends match and non-neutral)
            const trends = [finalData.monthly1, finalData.monthly, finalData.weekly, finalData.daily1, finalData.daily];
            const alignment = trends.every(t => t === trends[0] && t !== 'neutral');

            return {
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
                marketOpen,
            } as ForexPair;

        } catch (error) {
            console.error(`Error processing ${pair}:`, error instanceof Error ? error.message : String(error));
            
            // Fallback with neutral values when processing fails
            return {
                id: yahooSymbol,
                pair,
                category: getCategory(pair),
                daily: 'neutral',
                daily1: 'neutral',
                weekly: 'neutral',
                monthly: 'neutral',
                monthly1: 'neutral',
                alignment: false,
                lastUpdated: new Date(),
                marketOpen: isMarketOpen(pair),
            } as ForexPair;
        }
    });
    
    // Wait for all pairs to be processed
    const processedResults = await Promise.allSettled(pairProcessingPromises);
    
    // Collect successful results
    processedResults.forEach((result) => {
        if (result.status === 'fulfilled') {
            results.push(result.value);
        }
    });

    // Sort results by category and pair name for consistent ordering
    results.sort((a, b) => {
        if (a.category !== b.category) {
            const categoryOrder = { 'major': 1, 'minor': 2, 'commodity': 3, 'crypto': 4, 'exotic': 5 };
            return (categoryOrder[a.category] || 6) - (categoryOrder[b.category] || 6);
        }
        return a.pair.localeCompare(b.pair);
    });

    // Log comprehensive analysis of all pairs and validate trends
    logAllPairsWithTrends(results, timezone);

    setCachedData(results, timezone);
    return NextResponse.json(results, { headers: corsHeaders });
}
