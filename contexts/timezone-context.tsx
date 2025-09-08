"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DEFAULT_TIMEZONE } from '@/lib/timezone-utils';

interface TimezoneContextType {
  selectedTimezone: string;
  setSelectedTimezone: (timezone: string) => void;
  isClient: boolean;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

interface TimezoneProviderProps {
  children: ReactNode;
}

export function TimezoneProvider({ children }: TimezoneProviderProps) {
  const [selectedTimezone, setSelectedTimezone] = useState<string>(DEFAULT_TIMEZONE);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Load saved timezone from localStorage
    const savedTimezone = localStorage.getItem('forex-selected-timezone');
    if (savedTimezone) {
      // Migrate old invalid timezone identifier
      const migratedTimezone = savedTimezone === 'Europe/Frankfurt' ? 'Europe/Berlin' : savedTimezone;
      if (migratedTimezone !== savedTimezone) {
        localStorage.setItem('forex-selected-timezone', migratedTimezone);
      }
      setSelectedTimezone(migratedTimezone);
    } else {
      // Try to detect user's timezone as fallback
      try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Check if the detected timezone is in our supported list
        const supportedTimezones = [
          'UTC',
          'America/New_York',
          'Europe/London',
          'Asia/Tokyo',
          'Australia/Sydney',
          'Europe/Berlin',
          'Asia/Hong_Kong',
          'Asia/Singapore'
        ];
        
        if (supportedTimezones.includes(userTimezone)) {
          setSelectedTimezone(userTimezone);
        }
      } catch (error) {
        // Fallback to UTC if detection fails
        setSelectedTimezone(DEFAULT_TIMEZONE);
      }
    }
  }, []);

  const handleTimezoneChange = (timezone: string) => {
    setSelectedTimezone(timezone);
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('forex-selected-timezone', timezone);
    }
  };

  const value: TimezoneContextType = {
    selectedTimezone,
    setSelectedTimezone: handleTimezoneChange,
    isClient,
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone(): TimezoneContextType {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
}
