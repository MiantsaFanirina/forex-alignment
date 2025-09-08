"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Globe, Clock, Loader2, ChevronDown } from 'lucide-react';
import { TRADING_TIMEZONES, getTimezoneAbbreviation, getCurrentMarketSession } from '@/lib/timezone-utils';
import { cn } from '@/lib/utils';

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
  const [isOpen, setIsOpen] = useState(false);
  const currentSession = getCurrentMarketSession(selectedTimezone);
  const abbreviation = getTimezoneAbbreviation(selectedTimezone);
  const isActiveSession = currentSession !== 'Off Hours';

  const handleTimezoneSelect = (timezone: string) => {
    onTimezoneChange(timezone);
    setIsOpen(false);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Desktop: Show globe icon and label */}
      <div className="hidden sm:flex items-center gap-1 text-gray-400">
        <Globe className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Timezone:</span>
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline"
            className={cn(
              'justify-between border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 transition-colors',
              isMobile 
                ? 'h-8 px-3 text-xs min-w-[90px]' 
                : 'w-[160px] h-8 text-xs'
            )}
          >
            <div className={cn(
              'flex items-center',
              isMobile ? 'gap-1' : 'gap-1.5'
            )}>
              {isLoading ? (
                <Loader2 className={cn(
                  'animate-spin text-blue-400',
                  isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'
                )} />
              ) : (
                <span className="font-medium">{abbreviation}</span>
              )}
              {!isLoading && isActiveSession && (
                <div className="flex items-center gap-0.5">
                  <div className={cn(
                    'bg-green-400 rounded-full animate-pulse',
                    isMobile ? 'w-1 h-1' : 'w-1.5 h-1.5'
                  )} />
                  <span className="text-green-400 text-xs hidden sm:inline">Live</span>
                </div>
              )}
              {isLoading && (
                <span className="text-blue-400 text-xs hidden sm:inline">Loading...</span>
              )}
            </div>
            <ChevronDown className={cn(
              'opacity-50',
              isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'
            )} />
          </Button>
        </DialogTrigger>
        
        <DialogContent className={cn(
          'bg-gray-800 border-gray-700 shadow-xl',
          isMobile 
            ? 'w-full h-full max-w-full max-h-full m-0 rounded-none'
            : 'sm:max-w-md'
        )}>
          <DialogHeader className="px-6 py-4 border-b border-gray-700">
            <DialogTitle className="flex items-center gap-2 text-gray-300">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Select Trading Timezone</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-6 py-4 space-y-3 max-h-[400px] overflow-y-auto">
            {TRADING_TIMEZONES.map((timezone) => {
              const session = getCurrentMarketSession(timezone.value);
              const isActive = session !== 'Off Hours';
              const isSelected = selectedTimezone === timezone.value;
              
              return (
                <label 
                  key={timezone.value}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:bg-gray-700/30 cursor-pointer transition-all duration-200"
                >
                  <input
                    type="radio"
                    name="timezone"
                    value={timezone.value}
                    checked={isSelected}
                    onChange={() => handleTimezoneSelect(timezone.value)}
                    className="sr-only"
                  />
                  
                  {/* Custom radio button */}
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                    isSelected 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-500'
                  )}>
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
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
                    <div className="text-xs text-gray-400">
                      {timezone.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {session}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
