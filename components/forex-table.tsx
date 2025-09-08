"use client";

import { useState, useEffect } from 'react';
import { ForexPair } from '@/types/forex';
import { TrendIndicator } from './trend-indicator';
import { AlignmentIndicator } from './alignment-indicator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Filter, X, Search, Settings, ChevronDown, Loader2, Globe, TrendingUp, Wifi, WifiOff, Clock } from 'lucide-react';
import { TimezoneSelector } from './timezone-selector';
import { useTimezone } from '@/contexts/timezone-context';
import { formatInTimezone, getTimezoneAbbreviation } from '@/lib/timezone-utils';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const TIMEFRAME_COLUMNS = [
  { key: 'monthly1', label: 'Monthly-1' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'daily1', label: 'Daily-1' },
  { key: 'daily', label: 'Daily' },
];

function ColumnSelector({ selected, onChange }: { selected: string[]; onChange: (cols: string[]) => void }) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-400 font-medium mb-3">
        Select visible timeframes ({selected.length}/{TIMEFRAME_COLUMNS.length} selected)
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {TIMEFRAME_COLUMNS.map(col => {
          const isSelected = selected.includes(col.key);
          
          return (
            <button
              key={col.key}
              onClick={() => {
                if (isSelected) {
                  onChange(selected.filter(k => k !== col.key));
                } else {
                  onChange([...selected, col.key]);
                }
              }}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-all duration-200 text-sm',
                isSelected
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                  : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                  isSelected
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-500'
                )}>
                  {isSelected && (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="font-medium">{col.label}</span>
              </div>
              
              <div className="text-xs text-gray-500">
                {col.key === 'monthly1' && 'M-1'}
                {col.key === 'monthly' && 'M'}
                {col.key === 'weekly' && 'W'}
                {col.key === 'daily1' && 'D-1'}
                {col.key === 'daily' && 'D'}
              </div>
            </button>
          );
        })}
      </div>
      
      {selected.length < TIMEFRAME_COLUMNS.length && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(TIMEFRAME_COLUMNS.map(c => c.key))}
          className="w-full text-xs border-gray-600 text-gray-400 hover:text-gray-200"
        >
          Select All Timeframes
        </Button>
      )}
    </div>
  );
}

function ForexTableRow({ pair, columns, getCategoryColor, getCategoryDotColor, index, isAligned }: {
  pair: ForexPair;
  columns: string[];
  getCategoryColor: (category: string) => string;
  getCategoryDotColor: (category: string) => string;
  index: number;
  isAligned: (pair: ForexPair, columns: string[]) => boolean;
}) {
  return (
    <tr
      key={pair.id}
      className={cn(
        'border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors duration-150',
        index % 2 === 0 ? 'bg-gray-900/30' : 'bg-gray-900/10'
      )}
    >
      <td className="p-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white text-sm">{pair.pair}</span>
          {/* Desktop: Show badge with text */}
          <Badge
            variant="outline"
            className={cn('text-xs px-1.5 py-0.5 hidden sm:inline-flex', getCategoryColor(pair.category))}
          >
            {pair.category}
          </Badge>
          {/* Mobile: Show colored dot */}
          <div className={cn('w-2 h-2 rounded-full sm:hidden', getCategoryDotColor(pair.category))}></div>
        </div>
      </td>
      {columns.includes('monthly1') && (
        <td className="p-3 text-center">
          <TrendIndicator trend={pair.monthly1} />
        </td>
      )}
      {columns.includes('monthly') && (
        <td className="p-3 text-center">
          <TrendIndicator trend={pair.monthly} />
        </td>
      )}
      {columns.includes('weekly') && (
        <td className="p-3 text-center">
          <TrendIndicator trend={pair.weekly} />
        </td>
      )}
      {columns.includes('daily1') && (
        <td className="p-3 text-center">
          <TrendIndicator trend={pair.daily1} />
        </td>
      )}
      {columns.includes('daily') && (
        <td className="p-3 text-center">
          <TrendIndicator trend={pair.daily} />
        </td>
      )}
      <td className="p-3 text-center">
        <AlignmentIndicator isAligned={isAligned(pair, columns)} />
      </td>
    </tr>
  );
}

interface ForexTableProps {
  data: ForexPair[];
  onRefresh: () => void;
  isLoading?: boolean;
  isTimezoneLoading?: boolean;
  isConnected?: boolean;
  autoRefresh?: boolean;
  onToggleAutoRefresh?: () => void;
}

export function ForexTable({ 
  data, 
  onRefresh, 
  isLoading = false, 
  isTimezoneLoading = false,
  isConnected = true,
  autoRefresh = false,
  onToggleAutoRefresh
}: ForexTableProps) {
  const { selectedTimezone, setSelectedTimezone, isClient } = useTimezone();
  const [filter, setFilter] = useState<'all' | 'aligned' | 'major' | 'minor' | 'exotic' | 'commodity'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [columns, setColumns] = useState<string[]>(TIMEFRAME_COLUMNS.map(c => c.key));
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isClient) {
      setLastUpdated(new Date());
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      setLastUpdated(new Date());
    }
  }, [data, isClient]);

  // Note: timezone changes are now handled in parent component via client-side processing

  // Alignment logic based on selected columns
  const isAligned = (pair: ForexPair, columns: string[]) => {
    const selectedTrends = columns.map(col => pair[col as keyof ForexPair]);
    if (selectedTrends.includes('neutral')) return false;
    return selectedTrends.every(trend => trend === selectedTrends[0]);
  };

  const filteredData = data.filter(pair => {
    // If searching, always show all categories
    if (search) {
      if (!pair.pair.toLowerCase().includes(search.toLowerCase())) return false;
      // Set filter to 'all' when searching
      if (filter !== 'all') setFilter('all');
    } else {
      // Category filter
      if (filter !== 'all' && filter !== 'aligned' && pair.category !== filter) return false;
    }
    // Alignment filter (uses selected columns)
    if (filter === 'aligned' && !isAligned(pair, columns)) return false;
    return true;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'major': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'minor': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'exotic': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'commodity': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoryDotColor = (category: string) => {
    switch (category) {
      case 'major': return 'bg-blue-400';
      case 'minor': return 'bg-purple-400';
      case 'exotic': return 'bg-orange-400';
      case 'commodity': return 'bg-yellow-400';
      default: return 'bg-gray-400';
    }
  };

  const alignedCount = data.filter(pair => pair.alignment).length;

  return (
    <>
      <Card className="w-full h-full bg-gray-900/50 border-gray-800 p-6 flex flex-col">
        <CardHeader className="pb-4 flex-shrink-0">
          {/* Desktop Layout */}
          <div className="hidden sm:block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <CardTitle className="text-xl font-bold text-white">FX Map</CardTitle>
                
                {/* Status indicators */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-300">Updated:</span>
                    <span className="text-xs font-mono text-green-400">
                      {isClient && lastUpdated ? formatInTimezone(lastUpdated, selectedTimezone, 'HH:mm:ss zzz') : '--:--:--'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <TrendingUp className="w-3 h-3 text-blue-400" />
                    <span className="text-xs font-medium text-blue-400">
                      {alignedCount}/{data.length} aligned
                    </span>
                  </div>
                  
                  {/* Live status */}
                  <div className="flex items-center gap-1">
                    {isConnected ? (
                      <div className="flex items-center gap-1 text-green-400">
                        <Wifi className="h-4 w-4" />
                        <span className="text-sm font-medium">Live</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-400">
                        <WifiOff className="h-4 w-4" />
                        <span className="text-sm font-medium">Offline</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Controls */}
              <div className="flex items-center gap-3">
                {/* Auto-refresh */}
                {onToggleAutoRefresh && (
                  <Button
                    onClick={onToggleAutoRefresh}
                    variant="outline"
                    size="sm"
                    className="bg-black text-white hover:bg-gray-900 border-gray-700 h-8 px-3 text-xs"
                  >
                    {isTimezoneLoading ? (
                      <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                    ) : (
                      <Clock className="h-3 w-3 mr-2" />
                    )}
                    Auto {autoRefresh ? 'ON' : 'OFF'}
                  </Button>
                )}
                
                {/* Timezone */}
                {isClient && (
                  <TimezoneSelector 
                    selectedTimezone={selectedTimezone}
                    onTimezoneChange={setSelectedTimezone}
                    isLoading={isTimezoneLoading}
                  />
                )}
                
                {/* Filters */}
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs border-gray-700 text-gray-300 hover:bg-gray-700/50"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md w-full h-[100vh] sm:h-auto max-h-[100vh] mx-0 sm:mx-4 p-0 sm:rounded-lg rounded-none" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="bg-gray-800 border-0 sm:border border-gray-700 h-full sm:h-auto sm:rounded-lg shadow-xl flex flex-col">
              <DialogHeader className="px-6 py-4 pt-6 sm:pt-4 border-b border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-400" />
                  <DialogTitle className="text-lg font-semibold text-white">Filter & Search</DialogTitle>
                </div>
              </DialogHeader>
                  
                  <div className="flex-1 overflow-y-auto min-h-0 max-h-[calc(100vh-200px)] sm:max-h-none" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div className="px-6 py-4 pb-8 space-y-6">
                    {/* Search Section */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                        <Search className="h-4 w-4" />
                        <span>Search Pairs</span>
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="Type pair name (e.g., EURUSD)..."
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          className="pr-10 bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 h-10"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          {search ? (
                            <button
                              type="button"
                              onClick={() => setSearch('')}
                              className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                              aria-label="Clear search"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          ) : (
                            <Search className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                      {search && (
                        <div className="text-xs text-gray-400">
                          Searching for: <span className="text-white font-medium">{search}</span>
                        </div>
                      )}
                    </div>

                    {/* Category Filters */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                        <Filter className="h-4 w-4" />
                        <span>Categories</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(['all', 'aligned', 'major', 'minor', 'exotic', 'commodity'] as const).map((filterOption) => {
                          const getCategoryLabel = (option: string) => {
                            switch (option) {
                              case 'all': return 'All Pairs';
                              case 'aligned': return 'Aligned';
                              case 'major': return 'Major';
                              case 'minor': return 'Minor';
                              case 'exotic': return 'Exotic';
                              case 'commodity': return 'Commodity';
                              default: return option;
                            }
                          };
                          
                          const label = getCategoryLabel(filterOption);
                          
                          return (
                            <Button
                              key={filterOption}
                              variant={filter === filterOption ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setFilter(filterOption)}
                              className={cn(
                                'h-10 text-sm transition-all duration-200 flex items-center justify-center',
                                filter === filterOption
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-lg transform scale-105'
                                  : 'border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500'
                              )}
                            >
                              <span className="text-xs font-medium">{label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timeframe Selection */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                        <span>⏰</span>
                        <span>Timeframes</span>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-600">
                        <ColumnSelector selected={columns} onChange={setColumns} />
                      </div>
                    </div>

                    {/* Filter Summary */}
                    {(filter !== 'all' || search || columns.length !== TIMEFRAME_COLUMNS.length) && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <div className="text-sm text-blue-400 font-medium mb-2">Active Filters:</div>
                        <div className="space-y-1 text-xs text-gray-300">
                          {filter !== 'all' && (
                            <div>Category: <span className="text-white font-medium">{filter}</span></div>
                          )}
                          {search && (
                            <div>Search: <span className="text-white font-medium">{search}</span></div>
                          )}
                          {columns.length !== TIMEFRAME_COLUMNS.length && (
                            <div>Timeframes: <span className="text-white font-medium">{columns.length} selected</span></div>
                          )}
                        </div>
                      </div>
                    )}
                    </div>
                  </div>

                    <DialogFooter className="px-6 py-4 pb-[env(safe-area-inset-bottom,1rem)] sm:pb-4 border-t border-gray-700 flex flex-col sm:flex-row gap-2 flex-shrink-0 bg-gray-800">
                      <Button
                        variant="outline"
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700/50"
                        onClick={() => {
                          setSearch('');
                          setFilter('all');
                          setColumns(TIMEFRAME_COLUMNS.map(c => c.key));
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset All
                      </Button>
                      <DialogClose asChild>
                        <Button 
                          variant="default" 
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" 
                          onClick={() => setModalOpen(false)}
                        >
                          Apply Filters
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          </div>
        
          {/* Mobile Layout */}
          <div className="sm:hidden space-y-4">
            {/* Title and Key Stats */}
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-white">FX Map</CardTitle>
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-400" />
                )}
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 px-2 py-1 bg-gray-800/50 rounded border border-gray-700/50">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-gray-300">
                  {isClient && lastUpdated ? formatInTimezone(lastUpdated, selectedTimezone, 'HH:mm:ss') : '--:--:--'}
                </span>
              </div>
              
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded border border-blue-500/20">
                <TrendingUp className="w-3 h-3 text-blue-400" />
                <span className="text-blue-400 font-medium">
                  {alignedCount}/{data.length}
                </span>
              </div>
            </div>
            
            {/* Controls Row */}
            <div className="flex items-center justify-between">
              {/* Auto-refresh */}
              {onToggleAutoRefresh && (
                <Button
                  onClick={onToggleAutoRefresh}
                  variant="outline"
                  size="sm"
                  className="bg-black text-white hover:bg-gray-900 border-gray-700 h-8 w-8 p-0"
                  title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                >
                  {isTimezoneLoading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : autoRefresh ? (
                    <Clock className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}

              {/* Grouped Filter and Timezone Controls */}
              <div className="flex items-center gap-2">
                {/* Filters */}
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-gray-700 text-gray-300 hover:bg-gray-700/50"
                    >
                      <Filter className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md w-full h-[100vh] sm:h-auto max-h-[100vh] mx-0 sm:mx-4 p-0 sm:rounded-lg rounded-none" onOpenAutoFocus={(e) => e.preventDefault()}>
                  <div className="bg-gray-800 border-0 sm:border border-gray-700 h-full sm:h-auto sm:rounded-lg shadow-xl flex flex-col">
                    <DialogHeader className="px-6 py-4 pt-6 sm:pt-4 border-b border-gray-700 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-blue-400" />
                        <DialogTitle className="text-lg font-semibold text-white">Filter & Search</DialogTitle>
                      </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto min-h-0 max-h-[calc(100vh-200px)] sm:max-h-none" style={{ WebkitOverflowScrolling: 'touch' }}>
                      <div className="px-6 py-4 pb-8 space-y-6">
                        {/* Mobile dialog content here - same as desktop */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                            <Search className="h-4 w-4" />
                            <span>Search Pairs</span>
                          </div>
                          <div className="relative">
                            <Input
                              placeholder="Type pair name (e.g., EURUSD)..."
                              value={search}
                              onChange={e => setSearch(e.target.value)}
                              className="pr-10 bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 h-10"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              {search ? (
                                <button
                                  type="button"
                                  onClick={() => setSearch('')}
                                  className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                                  aria-label="Clear search"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              ) : (
                                <Search className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                          </div>
                          {search && (
                            <div className="text-xs text-gray-400">
                              Searching for: <span className="text-white font-medium">{search}</span>
                            </div>
                          )}
                        </div>

                        {/* Category Filters */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                            <Filter className="h-4 w-4" />
                            <span>Categories</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {(['all', 'aligned', 'major', 'minor', 'exotic', 'commodity'] as const).map((filterOption) => {
                              const getCategoryLabel = (option: string) => {
                                switch (option) {
                                  case 'all': return 'All Pairs';
                                  case 'aligned': return 'Aligned';
                                  case 'major': return 'Major';
                                  case 'minor': return 'Minor';
                                  case 'exotic': return 'Exotic';
                                  case 'commodity': return 'Commodity';
                                  default: return option;
                                }
                              };

                              const label = getCategoryLabel(filterOption);

                              return (
                                <Button
                                  key={filterOption}
                                  variant={filter === filterOption ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setFilter(filterOption)}
                                  className={cn(
                                    'h-10 text-sm transition-all duration-200 flex items-center justify-center',
                                    filter === filterOption
                                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-lg transform scale-105'
                                      : 'border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500'
                                  )}
                                >
                                  <span className="text-xs font-medium">{label}</span>
                                </Button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Timeframe Selection */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                            <span>⏰</span>
                            <span>Timeframes</span>
                          </div>
                          <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-600">
                            <ColumnSelector selected={columns} onChange={setColumns} />
                          </div>
                        </div>

                        {/* Filter Summary */}
                        {(filter !== 'all' || search || columns.length !== TIMEFRAME_COLUMNS.length) && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                            <div className="text-sm text-blue-400 font-medium mb-2">Active Filters:</div>
                            <div className="space-y-1 text-xs text-gray-300">
                              {filter !== 'all' && (
                                <div>Category: <span className="text-white font-medium">{filter}</span></div>
                              )}
                              {search && (
                                <div>Search: <span className="text-white font-medium">{search}</span></div>
                              )}
                              {columns.length !== TIMEFRAME_COLUMNS.length && (
                                <div>Timeframes: <span className="text-white font-medium">{columns.length} selected</span></div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter className="px-6 py-4 pb-[env(safe-area-inset-bottom,1rem)] sm:pb-4 border-t border-gray-700 flex flex-col sm:flex-row gap-2 flex-shrink-0 bg-gray-800">
                      <Button
                        variant="outline"
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700/50"
                        onClick={() => {
                          setSearch('');
                          setFilter('all');
                          setColumns(TIMEFRAME_COLUMNS.map(c => c.key));
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset All
                      </Button>
                      <DialogClose asChild>
                        <Button
                          variant="default"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => setModalOpen(false)}
                        >
                          Apply Filters
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </div>
                </DialogContent>
                </Dialog>
                
                {/* Timezone */}
                {isClient && (
                  <TimezoneSelector
                    selectedTimezone={selectedTimezone}
                    onTimezoneChange={setSelectedTimezone}
                    isLoading={isTimezoneLoading}
                    isMobile={true}
                  />
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        {/* Loading State - Completely replaces table content */}
        {isLoading ? (
          <div className="flex items-center justify-center flex-1 px-4 py-12">
            <div className="flex flex-col items-center gap-6 max-w-sm mx-auto text-center">
              {/* Animated loading spinner */}
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 border-4 border-transparent border-r-blue-400 rounded-full animate-spin animation-delay-150"></div>
              </div>

              {/* Loading text */}
              <div className="space-y-3">
                <div className="text-lg sm:text-xl font-semibold text-white">
                  {isTimezoneLoading ? 'Switching Timezone' : 'Loading Forex Data'}
                </div>
                <div className="text-sm sm:text-base text-gray-400 leading-relaxed">
                  {isTimezoneLoading
                    ? 'Recalculating candlestick boundaries for your selected timezone...'
                    : 'Fetching live market data and trend analysis...'
                  }
                </div>
              </div>

              {/* Progress dots animation */}
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse animation-delay-200"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse animation-delay-400"></div>
              </div>

              {/* Selected timezone display during timezone loading */}
              {isTimezoneLoading && (
                <div className="mt-4 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-400 text-sm">
                    <Globe className="h-4 w-4" />
                    <span>Switching to {getTimezoneAbbreviation(selectedTimezone)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Table content - only shown when NOT loading */
          <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0">
            <table className="w-full relative">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
                <th className="text-left p-3 text-sm font-medium text-gray-300 min-w-[120px] bg-gray-900/95 backdrop-blur-sm">Pair</th>
                {columns.includes('monthly1') && (
                  <th className="text-center p-3 text-sm font-medium text-gray-300 min-w-[80px] bg-gray-900/95 backdrop-blur-sm">
                    <span className="block sm:hidden mobile-landscape-block">M-1</span>
                    <span className="hidden sm:block mobile-landscape-hidden">Monthly-1</span>
                  </th>
                )}
                {columns.includes('monthly') && (
                  <th className="text-center p-3 text-sm font-medium text-gray-300 min-w-[80px] bg-gray-900/95 backdrop-blur-sm">
                    <span className="block sm:hidden mobile-landscape-block">M</span>
                    <span className="hidden sm:block mobile-landscape-hidden">Monthly</span>
                  </th>
                )}
                {columns.includes('weekly') && (
                  <th className="text-center p-3 text-sm font-medium text-gray-300 min-w-[80px] bg-gray-900/95 backdrop-blur-sm">
                    <span className="block sm:hidden mobile-landscape-block">W</span>
                    <span className="hidden sm:block mobile-landscape-hidden">Weekly</span>
                  </th>
                )}
                {columns.includes('daily1') && (
                  <th className="text-center p-3 text-sm font-medium text-gray-300 min-w-[80px] bg-gray-900/95 backdrop-blur-sm">
                    <span className="block sm:hidden mobile-landscape-block">D-1</span>
                    <span className="hidden sm:block mobile-landscape-hidden">Daily-1</span>
                  </th>
                )}
                {columns.includes('daily') && (
                  <th className="text-center p-3 text-sm font-medium text-gray-300 min-w-[80px] bg-gray-900/95 backdrop-blur-sm">
                    <span className="block sm:hidden mobile-landscape-block">D</span>
                    <span className="hidden sm:block mobile-landscape-hidden">Daily</span>
                  </th>
                )}
                <th className="text-center p-3 text-sm font-medium text-gray-300 min-w-[90px] bg-gray-900/95 backdrop-blur-sm">Alignment</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((pair, idx) => (
                <ForexTableRow
                  key={pair.id}
                  pair={pair}
                  columns={columns}
                  getCategoryColor={getCategoryColor}
                  getCategoryDotColor={getCategoryDotColor}
                  index={idx}
                  isAligned={isAligned}
                />
              ))}
            </tbody>
            </table>
          </div>
        )}
        
        {/* No data message - only shown when NOT loading and no data */}
        {!isLoading && filteredData.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            No pairs match the current filter
          </div>
        )}
        </CardContent>
      </Card>
    </>
  );
}