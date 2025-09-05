import { NextResponse } from 'next/server';
import { ForexPair, TrendDirection } from '@/types/forex';

const yahooSymbolMap: Record<string, string> = {
    AUDCAD: 'AUDCAD=X',
    AUDCHF: 'AUDCHF=X',
    AUDJPY: 'AUDJPY=X',
    AUDNZD: 'AUDNZD=X',
    AUDUSD: 'AUDUSD=X',
    BRENT: 'BZ=F',
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
    USDCAD: 'USDCAD=X',
    USDCHF: 'USDCHF=X',
    USDJPY: 'USDJPY=X',
    XAUUSD: 'GC=F',
    WTI: 'CL=F',
};

// ----------------------
// Helpers
// ----------------------
function calculateTrend(open: number, close: number): TrendDirection {
    if (close > open) return 'bullish';
    if (close < open) return 'bearish';
    return 'neutral';
}

function getPeriodIndices(timestamps: number[] | undefined, period: 'month' | 'prevMonth' | 'week') {
    if (!Array.isArray(timestamps) || timestamps.length === 0) {
        return [-1, -1];
    }

    const dates = timestamps.map((ts) => new Date(ts * 1000));
    const lastDate = dates[dates.length - 1];

    if (period === 'month') {
        const currentMonth = lastDate.getMonth();
        const currentYear = lastDate.getFullYear();
        const indices = dates
            .map((d, i) => ({ d, i }))
            .filter(({ d }) => d.getMonth() === currentMonth && d.getFullYear() === currentYear)
            .map(({ i }) => i);
        return indices.length > 0 ? [indices[0], indices[indices.length - 1]] : [-1, -1];
    }

    if (period === 'prevMonth') {
        const prevMonth = lastDate.getMonth() === 0 ? 11 : lastDate.getMonth() - 1;
        const prevYear = lastDate.getMonth() === 0 ? lastDate.getFullYear() - 1 : lastDate.getFullYear();
        const indices = dates
            .map((d, i) => ({ d, i }))
            .filter(({ d }) => d.getMonth() === prevMonth && d.getFullYear() === prevYear)
            .map(({ i }) => i);
        return indices.length > 0 ? [indices[0], indices[indices.length - 1]] : [-1, -1];
    }

    if (period === 'week') {
        const cutoff = new Date(lastDate);
        cutoff.setDate(cutoff.getDate() - 6); // last 7 days

        const indices = dates
            .map((d, i) => ({ d, i }))
            .filter(({ d }) => d >= cutoff)
            .map(({ i }) => i);

        return indices.length > 0 ? [indices[0], indices[indices.length - 1]] : [-1, -1];
    }

    return [-1, -1];
}

// ----------------------
// Main API
// ----------------------
export async function GET() {
    const results: Record<string, any> = {};

    for (const [pair, symbol] of Object.entries(yahooSymbolMap)) {
        try {
            const res = await fetch(
                `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=6mo&interval=1d`,
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
            const timestamps = json.chart?.result?.[0]?.timestamp;

            if (!opens || !closes || !Array.isArray(timestamps)) continue;

            const lastIdx = opens.length - 1;

            // Daily + Daily-1
            const daily = calculateTrend(opens[lastIdx], closes[lastIdx]);
            const daily1 = lastIdx > 0 ? calculateTrend(opens[lastIdx - 1], closes[lastIdx - 1]) : 'neutral';

            // Monthly
            const [monthlyOpenIdx, monthlyCloseIdx] = getPeriodIndices(timestamps, 'month');
            const monthly =
                monthlyOpenIdx >= 0 && monthlyCloseIdx >= 0
                    ? calculateTrend(opens[monthlyOpenIdx], closes[monthlyCloseIdx])
                    : 'neutral';

            // Previous month
            const [monthly1OpenIdx, monthly1CloseIdx] = getPeriodIndices(timestamps, 'prevMonth');
            const monthly1 =
                monthly1OpenIdx >= 0 && monthly1CloseIdx >= 0
                    ? calculateTrend(opens[monthly1OpenIdx], closes[monthly1CloseIdx])
                    : 'neutral';

            // Weekly (last 7 days rolling)
            const [weeklyOpenIdx, weeklyCloseIdx] = getPeriodIndices(timestamps, 'week');
            const weekly =
                weeklyOpenIdx >= 0 && weeklyCloseIdx >= 0
                    ? calculateTrend(opens[weeklyOpenIdx], closes[weeklyCloseIdx])
                    : 'neutral';

            results[pair] = { daily, daily1, weekly, monthly, monthly1 };
        } catch (err) {
            console.error(`Error fetching ${pair}:`, err);
        }
    }

    return NextResponse.json(results);
}
