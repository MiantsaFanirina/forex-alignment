import { NextResponse } from 'next/server';
import { ForexPair, TrendDirection } from '@/types/forex';

const yahooSymbolMap: Record<string, string> = {
    AUDCAD: 'AUDCAD=X', AUDCHF: 'AUDCHF=X', AUDJPY: 'AUDJPY=X',
    AUDNZD: 'AUDNZD=X', AUDUSD: 'AUDUSD=X', BRENT: 'BZ=F', BTCUSD: 'BTC-USD',
    CADCHF: 'CADCHF=X', CADJPY: 'CADJPY=X', CHFJPY: 'CHFJPY=X',
    EURAUD: 'EURAUD=X', EURCAD: 'EURCAD=X', EURCHF: 'EURCHF=X',
    EURGBP: 'EURGBP=X', EURJPY: 'EURJPY=X', EURNZD: 'EURNZD=X',
    EURUSD: 'EURUSD=X', GBPAUD: 'GBPAUD=X', GBPCAD: 'GBPCAD=X',
    GBPCHF: 'GBPCHF=X', GBPJPY: 'GBPJPY=X', GBPNZD: 'GBPNZD=X',
    GBPUSD: 'GBPUSD=X', NZDCAD: 'NZDCAD=X', NZDCHF: 'NZDCHF=X',
    NZDJPY: 'NZDJPY=X', NZDUSD: 'NZDUSD=X', US100: '^NDX',
    US30: '^DJI', USDCAD: 'USDCAD=X', USDCHF: 'USDCHF=X',
    USDJPY: 'USDJPY=X', WTI: 'CL=F', XAGUSD: 'XAGUSD=X', XAUUSD: 'XAUUSD=X',
};

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

// ISO calendar week number
const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// TradingView fallback
async function fetchTradingViewTrend(symbol: string): Promise<TrendDirection> {
    try {
        const url = tradingViewUrlMap[symbol];
        if (!url) return 'neutral';

        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' });
        if (!res.ok) return 'neutral';

        const html = await res.text();
        const match = html.match(/"change":(-?[0-9.]+)/);
        if (match) {
            const change = parseFloat(match[1]);
            return change > 0 ? 'bullish' : change < 0 ? 'bearish' : 'neutral';
        }
        return 'neutral';
    } catch {
        return 'neutral';
    }
}

export async function GET() {
    const results: ForexPair[] = [];

    for (const [pair, symbol] of Object.entries(yahooSymbolMap)) {
        try {
            const res = await fetch(
                `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=6mo&interval=1d`,
                { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' }
            );
            if (!res.ok) continue;

            const json = await res.json();
            const candles = json.chart?.result?.[0]?.indicators?.quote?.[0];
            const opens = candles?.open ?? [];
            const closes = candles?.close ?? [];
            const timestamps = json.chart?.result?.[0]?.timestamp ?? [];

            if (!opens.length || !closes.length || !timestamps.length) continue;

            const dateObjs = (timestamps as number[]).map((ts) => new Date(ts * 1000));
            const lastIdx = opens.length - 1;

            // --- Monthly ---
            const currentMonth = dateObjs[lastIdx].getMonth();
            const currentYear = dateObjs[lastIdx].getFullYear();
            const currentMonthIndices = dateObjs
                .map((d, i) => ({ d, i }))
                .filter(({ d }) => d.getMonth() === currentMonth && d.getFullYear() === currentYear)
                .map(({ i }) => i);
            const monthlyOpenIdx = currentMonthIndices[0] ?? lastIdx;
            const monthlyCloseIdx = currentMonthIndices[currentMonthIndices.length - 1] ?? lastIdx;

            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            const prevMonthIndices = dateObjs
                .map((d, i) => ({ d, i }))
                .filter(({ d }) => d.getMonth() === prevMonth && d.getFullYear() === prevYear)
                .map(({ i }) => i);
            const monthly1OpenIdx = prevMonthIndices[0] ?? 0;
            const monthly1CloseIdx = prevMonthIndices[prevMonthIndices.length - 1] ?? 0;

            // --- Weekly ---
            const currentWeek = getWeekNumber(dateObjs[lastIdx]);
            const currentWeekIndices = dateObjs
                .map((d, i) => ({ d, i }))
                .filter(({ d }) => getWeekNumber(d) === currentWeek && d.getFullYear() === currentYear)
                .map(({ i }) => i);
            const weeklyOpenIdx = currentWeekIndices[0] ?? lastIdx;
            const weeklyCloseIdx = currentWeekIndices[currentWeekIndices.length - 1] ?? lastIdx;

            // --- Trends ---
            let daily = calculateTrend(opens[lastIdx], closes[lastIdx]);
            let daily1 = calculateTrend(opens[lastIdx - 1] ?? opens[lastIdx], closes[lastIdx - 1] ?? closes[lastIdx]);
            let weekly = calculateTrend(opens[weeklyOpenIdx], closes[weeklyCloseIdx]);
            let monthly = calculateTrend(opens[monthlyOpenIdx], closes[monthlyCloseIdx]);
            let monthly1 = calculateTrend(opens[monthly1OpenIdx], closes[monthly1CloseIdx]);

            // Fallback to TradingView if Yahoo is neutral
            if (daily1 === 'neutral') daily1 = await fetchTradingViewTrend(pair);
            if (weekly === 'neutral') weekly = await fetchTradingViewTrend(pair);
            if (monthly === 'neutral') monthly = await fetchTradingViewTrend(pair);
            if (monthly1 === 'neutral') monthly1 = await fetchTradingViewTrend(pair);

            const trends = [monthly1, monthly, weekly, daily1, daily];
            const alignment = trends.every((t) => t === trends[0]);

            // --- Category ---
            let category: ForexPair['category'] = 'major';
            if (['EURUSD','USDJPY','GBPUSD','USDCHF','USDCAD','AUDUSD','NZDUSD'].includes(pair)) category = 'major';
            else if (
                [
                    'EURGBP','EURJPY','EURCHF','EURCAD','EURAUD','EURNZD',
                    'GBPJPY','GBPCHF','GBPCAD','GBPAUD','GBPNZD',
                    'AUDCAD','AUDCHF','AUDJPY','AUDNZD','CADCHF','CADJPY','CHFJPY',
                    'NZDCAD','NZDCHF','NZDJPY'
                ].includes(pair)
            ) category = 'minor';
            else if (['BTCUSD'].includes(pair)) category = 'exotic';
            else if (['XAUUSD','XAGUSD','BRENT','WTI'].includes(pair)) category = 'commodity';
            else if (['US100','US30'].includes(pair)) category = 'exotic';
            else category = 'exotic';

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
