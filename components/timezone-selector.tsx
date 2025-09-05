"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { TRADING_TIMEZONES, getTimezoneAbbreviation, getCurrentMarketSession } from '@/lib/timezone-utils';

interface TimezoneSelectorProps {
  selectedTimezone: string;
  onTimezoneChange: (timezone: string) => void;
  className?: string;
}

export function TimezoneSelector({ 
  selectedTimezone, 
  onTimezoneChange, 
  className = "" 
}: TimezoneSelectorProps) {
  const currentSession = getCurrentMarketSession(selectedTimezone);
  const abbreviation = getTimezoneAbbreviation(selectedTimezone);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="h-4 w-4 text-gray-400" />
      <Select value={selectedTimezone} onValueChange={onTimezoneChange}>
        <SelectTrigger className="w-[180px] h-8 text-xs border-gray-700 bg-gray-800/50 text-gray-300">
          <SelectValue>
            <div className="flex items-center justify-between w-full">
              <span>{abbreviation}</span>
              {currentSession !== 'Off Hours' && (
                <span className="text-green-400 text-xs ml-2">●</span>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          {TRADING_TIMEZONES.map((timezone) => {
            const session = getCurrentMarketSession(timezone.value);
            const isActive = session !== 'Off Hours';
            
            return (
              <SelectItem 
                key={timezone.value} 
                value={timezone.value}
                className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span className="text-sm">{timezone.label}</span>
                    <span className="text-xs text-gray-400">
                      {timezone.abbreviation} • {session}
                    </span>
                  </div>
                  {isActive && (
                    <span className="text-green-400 ml-2">●</span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
