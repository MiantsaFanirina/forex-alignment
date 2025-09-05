"use client";

import { useState, useEffect } from 'react';
import { ForexTable } from '@/components/forex-table';
import { MarketStats } from '@/components/market-stats';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wifi, WifiOff, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { TradingLoader } from '@/components/trading-loader';
import { useTimezone } from '@/contexts/timezone-context';
import { ForexPair } from '@/types/forex';

export default function Home() {
  const { selectedTimezone, isClient } = useTimezone();
  const [rawData, setRawData] = useState<ForexPair[]>([]);
  const [processedData, setProcessedData] = useState<ForexPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTimezoneLoading, setIsTimezoneLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch data from API route with timezone-specific candlestick calculations
  const fetchData = async (isTimezoneChange: boolean = false) => {
    // Only show main loading for initial load or timezone changes
    if (initialLoading || isTimezoneChange) {
      setIsLoading(true);
    }
    
    // Always show timezone loading indicator for timezone changes
    if (isTimezoneChange) {
      setIsTimezoneLoading(true);
    }
    
    try {
      const timezone = isClient ? selectedTimezone : 'UTC';
      
      const res = await fetch(`/api/forex?timezone=${encodeURIComponent(timezone)}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const json = await res.json();
      setRawData(json);
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
    }
    
    if (initialLoading || isTimezoneChange) {
      setIsLoading(false);
    }
    
    if (isTimezoneChange) {
      setIsTimezoneLoading(false);
    }
    
    setInitialLoading(false);
  };

  // Since we now get timezone-specific data from API, we use data directly
  useEffect(() => {
    if (rawData.length > 0) {
      // No need for client-side processing since API provides timezone-specific data
      setProcessedData(rawData);
    }
  }, [rawData]);

  useEffect(() => {
    fetchData();
  }, []);

  // Refetch data when timezone changes since candlestick boundaries are different
  useEffect(() => {
    if (isClient && !initialLoading) {
      fetchData(true); // Pass true to indicate this is a timezone change
    }
  }, [selectedTimezone, isClient]);

  useEffect(() => {
    if (!autoRefresh || initialLoading) return;
    const interval = setInterval(() => {
      fetchData(false); // Pass false for background auto-refresh
    }, 1000); 
    return () => clearInterval(interval);
  }, [autoRefresh, initialLoading, selectedTimezone, isClient]);

  const handleRefresh = () => fetchData(false); // Manual refresh doesn't need loading overlay
  const toggleAutoRefresh = () => setAutoRefresh(!autoRefresh);

  if (initialLoading) {
    return <TradingLoader />;
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
        <div className="container mx-auto p-4 max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
              <div className="px-3 sm:px-0">
                <h1 className="md:text-2xl text-xl font-bold text-white flex md:justify-start justify-center items-center gap-2 my-8">
                  <TrendingUp className="h-8 w-8 text-blue-500 md:mr-6 mr-2" />
                  Professional Forex Timeframe Alignment Analysis
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  {isConnected ? (
                      <div className="flex items-center gap-1 text-green-400">
                        <Wifi className="h-4 w-4" />
                        <span>Live</span>
                      </div>
                  ) : (
                      <div className="flex items-center gap-1 text-red-400">
                        <WifiOff className="h-4 w-4" />
                        <span>Offline</span>
                      </div>
                  )}
                </div>
                <Button
                    onClick={toggleAutoRefresh}
                    variant="outline"
                    size="sm"
                    className="bg-black text-white hover:bg-gray-900 border-gray-700 h-7 px-2 text-xs"
                >
                  {isTimezoneLoading ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Clock className="h-3 w-3 mr-1" />
                  )}
                  Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>
          </div>

          {/* Market Stats */}
          <MarketStats data={processedData} />
          {/* API Integration Notice */}
          <Card className="mb-6 bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Wifi className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-400 mb-1">Live Forex & Commodities Data</h3>
                  <p className="text-sm text-blue-300/80">
                    Live data from market APIs with timezone-aware analysis.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Main Table */}
          <ForexTable
              data={processedData}
              onRefresh={handleRefresh}
              isLoading={isLoading}
              isTimezoneLoading={isTimezoneLoading}
          />

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© 2025 Miantsa Fanirina. Professional Forex Analysis Tool.</p>
          </div>
        </div>
      </div>
  );
}
