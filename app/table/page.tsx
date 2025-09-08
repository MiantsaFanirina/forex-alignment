"use client";

import { useState, useEffect } from 'react';
import { ForexTable } from '@/components/forex-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wifi, WifiOff, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { TradingLoader } from '@/components/trading-loader';
import { useTimezone } from '@/contexts/timezone-context';
import { ForexPair } from '@/types/forex';

export default function TablePage() {
  const { selectedTimezone, isClient } = useTimezone();
  const [rawData, setRawData] = useState<ForexPair[]>([]);
  const [processedData, setProcessedData] = useState<ForexPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTimezoneLoading, setIsTimezoneLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Fetch data from API route with timezone-specific candlestick calculations
  const fetchData = async (isTimezoneChange: boolean = false) => {
    // Cancel any existing request when timezone changes
    if (isTimezoneChange && abortController) {
      abortController.abort();
    }

    // Create new abort controller for timezone changes
    let currentAbortController = abortController;
    if (isTimezoneChange) {
      currentAbortController = new AbortController();
      setAbortController(currentAbortController);
    }

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
      
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      };

      // Add signal for timezone changes
      if (isTimezoneChange && currentAbortController) {
        fetchOptions.signal = currentAbortController.signal;
      }
      
      const res = await fetch(`https://forex-alignment.vercel.app/api/forex?timezone=${encodeURIComponent(timezone)}`, fetchOptions);
      
      if (res.ok) {
        const json = await res.json();
        setRawData(json);
        setIsConnected(true);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was cancelled due to timezone change');
        return; // Don't update loading states if request was cancelled
      }
      setIsConnected(false);
    }
    
    if (initialLoading || isTimezoneChange) {
      setIsLoading(false);
    }
    
    // Clean up loading states only if request wasn't cancelled
    if (isTimezoneChange) {
      setIsTimezoneLoading(false);
    }
    
    setInitialLoading(false);
    
    // Clear abort controller if this was a timezone change
    if (isTimezoneChange) {
      setAbortController(null);
    }
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
    <div className="h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <div className="h-full container mx-auto p-4 max-w-7xl">

        {/* Main Table */}
        <ForexTable
          data={processedData}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          isTimezoneLoading={isTimezoneLoading}
          isConnected={isConnected}
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={toggleAutoRefresh}
        />
      </div>
    </div>
  );
}
