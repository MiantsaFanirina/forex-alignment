"use client";

import { useState, useEffect } from 'react';
import { ForexTable } from '@/components/forex-table';
import { MarketStats } from '@/components/market-stats';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wifi, WifiOff, Clock, TrendingUp } from 'lucide-react';
import { TradingLoader } from '@/components/trading-loader';

export default function Home() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch data from API route
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/forex');
      const json = await res.json();
      setData(json);
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
    setIsLoading(false);
    setInitialLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!autoRefresh || initialLoading) return;
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, initialLoading]);

  const handleRefresh = fetchData;
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
                <Clock className="h-3 w-3 mr-1" />
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
        </div>

        {/* Market Stats */}
        <MarketStats data={data} />
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
                  Live data from market APIs. 
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Main Table */}
        <ForexTable 
          data={data} 
          onRefresh={handleRefresh} 
          isLoading={isLoading}
        />

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 Miantsa Fanirina. Professional Forex Analysis Tool.</p>
        </div>
      </div>
    </div>
  );
}