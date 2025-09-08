import { useState, useEffect, useRef } from 'react';
import { ForexPair } from '@/types/forex';

interface UseForexDataOptions {
  timezone: string;
  isClient: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseForexDataReturn {
  data: ForexPair[];
  isLoading: boolean;
  isTimezoneLoading: boolean;
  isConnected: boolean;
  initialLoading: boolean;
  refetch: () => void;
}

export function useForexData({ 
  timezone, 
  isClient, 
  autoRefresh = false,
  refreshInterval = 1000 
}: UseForexDataOptions): UseForexDataReturn {
  const [data, setData] = useState<ForexPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTimezoneLoading, setIsTimezoneLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Use ref to store abort controller to avoid stale closure issues
  const abortControllerRef = useRef<AbortController | null>(null);
  const previousTimezoneRef = useRef<string>(timezone);

  const fetchData = async (isTimezoneChange: boolean = false) => {
    // Cancel any existing request when timezone changes
    if (isTimezoneChange && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for timezone changes
    if (isTimezoneChange) {
      abortControllerRef.current = new AbortController();
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
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      };

      // Add signal for timezone changes
      if (isTimezoneChange && abortControllerRef.current) {
        fetchOptions.signal = abortControllerRef.current.signal;
      }
      
      const res = await fetch(`/api/forex?timezone=${encodeURIComponent(timezone)}`, fetchOptions);
      
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setIsConnected(true);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was cancelled due to timezone change');
        return; // Don't update loading states if request was cancelled
      }
      setIsConnected(false);
    }
    
    // Clean up loading states only if request wasn't cancelled
    if (initialLoading || isTimezoneChange) {
      setIsLoading(false);
    }
    
    if (isTimezoneChange) {
      setIsTimezoneLoading(false);
      abortControllerRef.current = null; // Clear controller after timezone change
    }
    
    setInitialLoading(false);
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Refetch data when timezone changes
  useEffect(() => {
    const isTimezoneChange = isClient && !initialLoading && timezone !== previousTimezoneRef.current;
    
    if (isTimezoneChange) {
      fetchData(true);
      previousTimezoneRef.current = timezone;
    }
  }, [timezone, isClient, initialLoading]);

  // Auto refresh interval
  useEffect(() => {
    if (!autoRefresh || initialLoading) return;
    
    const interval = setInterval(() => {
      fetchData(false); // Background refresh
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, initialLoading, timezone, refreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    isTimezoneLoading,
    isConnected,
    initialLoading,
    refetch: () => fetchData(false)
  };
}
