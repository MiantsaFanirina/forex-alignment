"use client";

import { useState, useEffect } from 'react';
import { MarketStats } from '@/components/market-stats';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wifi, TrendingUp, ArrowRight } from 'lucide-react';
import { TradingLoader } from '@/components/trading-loader';
import { useTimezone } from '@/contexts/timezone-context';
import { ForexPair } from '@/types/forex';
import Link from 'next/link';

export default function Home() {
  const { selectedTimezone, isClient } = useTimezone();
  const [rawData, setRawData] = useState<ForexPair[]>([]);
  const [processedData, setProcessedData] = useState<ForexPair[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Fetch data from API route for market stats
  const fetchData = async () => {
    // Cancel any existing request
    if (abortController) {
      abortController.abort();
    }

    // Create new abort controller for this request
    const newAbortController = new AbortController();
    setAbortController(newAbortController);

    try {
      const timezone = isClient ? selectedTimezone : 'UTC';
      
      const res = await fetch(`https://forex-alignment.vercel.app/api/forex?timezone=${encodeURIComponent(timezone)}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        signal: newAbortController.signal
      });

      if (res.ok) {
        const json = await res.json();
        setRawData(json);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was cancelled due to timezone change');
      } else {
        console.error('Failed to fetch data:', error);
      }
    }
    
    setInitialLoading(false);
    setAbortController(null);
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

  // Refetch data when timezone changes
  useEffect(() => {
    if (isClient && !initialLoading) {
      fetchData();
    }
  }, [selectedTimezone, isClient]);

  // Cleanup: Cancel any pending requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

  if (initialLoading) {
    return <TradingLoader />;
  }

  return (
      <div className="h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-black">
        <div className="container flex flex-col justify-center h-full mx-auto p-4 max-w-7xl">

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
          
          {/* Call to Action for Table */}
          <Card className="mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <CardContent className="p-6 py-12">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold text-white mb-2">View Detailed Analysis</h3>
                <p className="text-gray-300 mb-4">
                  Access the complete forex alignment table with live data, filtering options, and timezone controls.
                </p>
                <Link href="/table">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium mt-8"
                  >
                    Click to open Forex Map
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>© 2025 Miantsa Fanirina. Professional Forex Analysis Tool.</p>
          </div>
        </div>
      </div>
  );
}
