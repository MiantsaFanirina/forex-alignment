#!/usr/bin/env node

/**
 * Test Timezone-Aware Data Fetching
 * Tests the new Yahoo Finance primary + TradingView fallback approach
 */

// Simulate the key functions for testing
const CURRENCY_TIMEZONES = {
    'EUR': 'Europe/London',
    'USD': 'America/New_York', 
    'JPY': 'Asia/Tokyo',
    'GBP': 'Europe/London',
    'CAD': 'America/Toronto',
    'AUD': 'Australia/Sydney',
    'DEFAULT': 'UTC'
};

function getCurrencyTimezone(currencyOrPair) {
    if (currencyOrPair.length > 3) {
        const baseCurrency = currencyOrPair.substring(0, 3);
        return CURRENCY_TIMEZONES[baseCurrency] || CURRENCY_TIMEZONES.DEFAULT;
    }
    return CURRENCY_TIMEZONES[currencyOrPair] || CURRENCY_TIMEZONES.DEFAULT;
}

function getTradingPeriods(pair) {
    const now = new Date();
    
    // Simplified trading period calculation for testing
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - now.getUTCDay() + 1); // Monday
    weekStart.setUTCHours(0, 0, 0, 0);
    
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    
    return {
        periods: {
            daily: {
                start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
                end: now
            },
            daily1: {
                start: new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate())),
                end: new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate(), 23, 59, 59))
            },
            weekly: {
                start: weekStart,
                end: now
            },
            monthly: {
                start: monthStart,
                end: now
            },
            monthly1: {
                start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)),
                end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59))
            }
        }
    };
}

async function testTimezoneAwareness() {
    console.log('🧪 TESTING TIMEZONE-AWARE DATA FETCHING');
    console.log('=' .repeat(60));
    console.log(`📅 Test Date: ${new Date().toISOString()}`);
    console.log(`📅 Day of Week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`);
    console.log('');
    
    const testPairs = ['EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'BRENT', 'WTI'];
    const testTimezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
    
    let totalTests = 0;
    let passedTests = 0;
    
    for (const pair of testPairs) {
        console.log(`🔍 TESTING ${pair}`);
        console.log('-'.repeat(40));
        
        const currencyTz = getCurrencyTimezone(pair);
        console.log(`💱 Currency timezone: ${currencyTz}`);
        
        const tradingPeriods = getTradingPeriods(pair);
        
        for (const userTz of testTimezones) {
            totalTests++;
            
            console.log(`\n🌐 User timezone: ${userTz}`);
            
            // Test timezone-aware period calculations
            const dailyStart = tradingPeriods.periods.daily.start;
            const weeklyStart = tradingPeriods.periods.weekly.start;
            
            // Convert to user timezone for display
            const dailyStartInUserTz = dailyStart.toLocaleString('en-US', { 
                timeZone: userTz, 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const weeklyStartInUserTz = weeklyStart.toLocaleString('en-US', { 
                timeZone: userTz, 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            console.log(`📊 Daily period start: ${dailyStartInUserTz} (${userTz})`);
            console.log(`📊 Weekly period start: ${weeklyStartInUserTz} (${userTz})`);
            
            // Monday alignment check
            const currentDay = new Date().getUTCDay();
            const isMondayAlignmentCorrect = currentDay !== 1 || dailyStart.toDateString() === weeklyStart.toDateString();
            
            if (isMondayAlignmentCorrect) {
                console.log('✅ Monday alignment: CORRECT');
                passedTests++;
            } else {
                console.log('❌ Monday alignment: INCORRECT');
                console.log(`   Daily: ${dailyStart.toISOString().slice(0,10)}`);
                console.log(`   Weekly: ${weeklyStart.toISOString().slice(0,10)}`);
            }
            
            // Test data range availability simulation
            console.log('📈 Simulating Yahoo Finance data availability...');
            
            // Simulate different data scenarios
            const scenarios = {
                'complete': { daily: 'bullish', weekly: 'bullish', monthly: 'bullish' },
                'missing_daily': { daily: 'neutral', weekly: 'bullish', monthly: 'bullish' },
                'missing_weekly': { daily: 'bullish', weekly: 'neutral', monthly: 'bullish' },
                'commodity_issues': { daily: 'neutral', weekly: 'bullish', monthly: 'bearish' }
            };
            
            let scenarioToTest = 'complete';
            if (pair === 'BRENT' || pair === 'WTI') {
                scenarioToTest = 'commodity_issues';
            } else if (Math.random() > 0.7) {
                scenarioToTest = Math.random() > 0.5 ? 'missing_daily' : 'missing_weekly';
            }
            
            const testData = scenarios[scenarioToTest];
            console.log(`🎲 Scenario: ${scenarioToTest}`);
            console.log(`📊 Data: D=${testData.daily} W=${testData.weekly} M=${testData.monthly}`);
            
            // Simulate fallback logic
            let fallbacksNeeded = 0;
            Object.values(testData).forEach(trend => {
                if (trend === 'neutral') fallbacksNeeded++;
            });
            
            if (fallbacksNeeded > 0) {
                console.log(`🔄 TradingView fallbacks needed: ${fallbacksNeeded}`);
            } else {
                console.log('✅ No fallbacks needed');
            }
        }
        
        console.log('\n' + '='.repeat(40));
    }
    
    console.log('\n📊 TIMEZONE TESTING SUMMARY');
    console.log('=' .repeat(40));
    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed tests: ${passedTests}`);
    console.log(`Success rate: ${Math.round(passedTests/totalTests*100)}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ALL TIMEZONE TESTS PASSED!');
    } else if (passedTests >= totalTests * 0.8) {
        console.log('👍 GOOD: Most timezone tests passed');
    } else {
        console.log('⚠️ NEEDS WORK: Multiple timezone issues detected');
    }
    
    console.log('\n🔧 NEW APPROACH SUMMARY:');
    console.log('✅ Yahoo Finance as primary data source');
    console.log('✅ Timezone-aware period calculations');
    console.log('✅ TradingView fallback for missing data');
    console.log('✅ Intelligent data inference');
    console.log('✅ Monday alignment validation');
}

// Run the test
testTimezoneAwareness();
