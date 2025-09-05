"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Clock, Loader2 } from 'lucide-react';
import { TRADING_TIMEZONES, getTimezoneAbbreviation, getCurrentMarketSession } from '@/lib/timezone-utils';

interface TimezoneSelectorProps {
  selectedTimezone: string;
  onTimezoneChange: (timezone: string) => void;
  className?: string;
  isMobile?: boolean;
  isLoading?: boolean;
}

export function TimezoneSelector({ 
  selectedTimezone, 
  onTimezoneChange, 
  className = "",
  isMobile = false,
  isLoading = false
}: TimezoneSelectorProps) {
  const currentSession = getCurrentMarketSession(selectedTimezone);
  const abbreviation = getTimezoneAbbreviation(selectedTimezone);
  const isActiveSession = currentSession !== 'Off Hours';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 text-gray-400">
        <Globe className="h-3.5 w-3.5" />
        <span className="hidden sm:inline-block text-xs font-medium">Timezone:</span>
      </div>
      
      <Select value={selectedTimezone} onValueChange={onTimezoneChange}>
        <SelectTrigger className={`${
          isMobile 
            ? 'w-full min-w-[140px] h-12 py-3 text-sm' 
            : 'w-[160px] h-8 text-xs'
        } border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 transition-colors`}>
          <SelectValue>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                ) : (
                  <span className="font-medium">{abbreviation}</span>
                )}
                {!isLoading && isActiveSession && (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs hidden sm:inline">Live</span>
                  </div>
                )}
                {isLoading && (
                  <span className="text-blue-400 text-xs hidden sm:inline">Loading...</span>
                )}
              </div>
            </div>
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent className="bg-gray-800 border-gray-700 shadow-xl max-w-[320px]">
          <div className="px-3 py-2 border-b border-gray-700">
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Select Trading Timezone</span>
            </div>
          </div>
          
          {TRADING_TIMEZONES.map((timezone) => {
            const session = getCurrentMarketSession(timezone.value);
            const isActive = session !== 'Off Hours';
            
            return (
              <SelectItem 
                key={timezone.value} 
                value={timezone.value}
                className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700 py-3 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {timezone.abbreviation}
                      </span>
                      {isActive && (
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-green-400 text-xs font-medium">Active</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {timezone.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {session}
                    </span>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
