"use client";

import { useState, useEffect } from 'react';
import { ForexPair } from '@/types/forex';
import { TrendIndicator } from './trend-indicator';
import { AlignmentIndicator } from './alignment-indicator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Filter, X } from 'lucide-react';
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
  { key: 'monthly', label: 'Monthly' },
  { key: 'monthly1', label: 'Monthly-1' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'daily1', label: 'Daily-1' },
  { key: 'daily', label: 'Daily' },
];

function ColumnSelector({ selected, onChange }: { selected: string[]; onChange: (cols: string[]) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs h-7 border-gray-700 text-gray-300 hover:bg-gray-800">
          Timeframes
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {TIMEFRAME_COLUMNS.map(col => (
          <DropdownMenuCheckboxItem
            key={col.key}
            checked={selected.includes(col.key)}
            onCheckedChange={(checked) => {
              if (checked) {
                onChange([...selected, col.key]);
              } else {
                onChange(selected.filter(k => k !== col.key));
              }
            }}
          >
            {col.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ForexTableRow({ pair, columns, getCategoryColor, index }: {
  pair: ForexPair;
  columns: string[];
  getCategoryColor: (category: string) => string;
  index: number;
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
          <Badge
            variant="outline"
            className={cn('text-xs px-1.5 py-0.5', getCategoryColor(pair.category))}
          >
            {pair.category}
          </Badge>
        </div>
      </td>
      {columns.includes('monthly') && (
        <td className="p-3 text-center">
          <TrendIndicator trend={pair.monthly} />
        </td>
      )}
      {columns.includes('monthly1') && (
        <td className="p-3 text-center">
          <TrendIndicator trend={pair.monthly1} />
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
        <AlignmentIndicator isAligned={pair.alignment} />
      </td>
    </tr>
  );
}

interface ForexTableProps {
  data: ForexPair[];
  onRefresh: () => void;
  isLoading?: boolean;
}

export function ForexTable({ data, onRefresh, isLoading = false }: ForexTableProps) {
  const [filter, setFilter] = useState<'all' | 'aligned' | 'major' | 'minor' | 'exotic' | 'commodity'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [columns, setColumns] = useState<string[]>(TIMEFRAME_COLUMNS.map(c => c.key));
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    setLastUpdated(new Date());
  }, [data]);

  const filteredData = data.filter(pair => {
    if (filter !== 'all' && filter !== 'aligned' && pair.category !== filter) return false;
    if (filter === 'aligned' && !pair.alignment) return false;
    if (search && !pair.pair.toLowerCase().includes(search.toLowerCase())) return false;
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

  const alignedCount = data.filter(pair => pair.alignment).length;

  return (
    <Card className="w-full bg-gray-900/50 border-gray-800 p-6">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-white">FX Map</CardTitle>
            <p className="text-sm text-gray-400 mt-1">
              Last updated: {lastUpdated?.toLocaleTimeString() || '--:--:--'} • {alignedCount}/{data.length} pairs aligned
            </p>
          </div>
          {/* Filters Button for all devices */}
          <div className="flex w-full justify-end">
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full md:max-w-[180px] text-xs h-7 border-gray-700 text-gray-300 hover:bg-gray-800 "
                >
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xs w-full p-4" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>Filters</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="relative mb-2">
                    <Input
                      placeholder="Search pair..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pr-8"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 focus:outline-none"
                        tabIndex={0}
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold text-gray-400">Category</div>
                    <div className="flex flex-wrap gap-1">
                      {(['all', 'aligned', 'major', 'minor', 'exotic', 'commodity'] as const).map((filterOption) => (
                        <Button
                          key={filterOption}
                          variant={filter === filterOption ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFilter(filterOption)}
                          className={cn(
                            'text-xs h-7',
                            filter === filterOption
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                          )}
                        >
                          <Filter className="h-3 w-3 mr-1" />
                          {filterOption === 'all' ? 'All' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold text-gray-400">Timeframes</div>
                    <ColumnSelector selected={columns} onChange={setColumns} />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      className="w-full mb-2"
                      onClick={() => {
                        setSearch('');
                        setFilter('all');
                        setColumns(TIMEFRAME_COLUMNS.map(c => c.key));
                      }}
                    >
                      Reset Filters
                    </Button>
                    <DialogClose asChild>
                      <Button variant="default" className="w-full mt-2" onClick={() => setModalOpen(false)}>
                        Apply
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-3 text-sm font-medium text-gray-300 min-w-[120px]">Pair</th>
                {columns.includes('monthly') && (
                  <th className="text-center p-3 text-sm font-medium text-gray-300 min-w-[80px]">
                    <span className="block sm:hidden">M</span>
                    <span className="hidden sm:block">Monthly</span>
                  </th>
                )}
                {columns.includes('monthly1') && (
                  <th className="text-center p-3 text-sm font-medium text-gray-300 min-w-[80px]">
                    <span className="block sm:hidden">M-1</span>
                    <span className="hidden sm:block">Monthly-1</span>
                  </th>
                )}
                {columns.includes('weekly') && (
                  <th className="text-center p-3 text-sm font-medium text-gray-300 min-w-[80px]">Weekly</th>
                )}
                {columns.includes('daily1') && (
                  <th className="text-center p-3 text-sm font-medium text-gray-300 min-w-[80px]">Daily-1</th>
                )}
                {columns.includes('daily') && (
                  <th className="text-center p-3 text-sm font-medium text-gray-300 min-w-[80px]">Daily</th>
                )}
                <th className="text-center p-3 text-sm font-medium text-gray-300 min-w-[90px]">Alignment</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((pair, index) => (
                <ForexTableRow
                  key={pair.id}
                  pair={pair}
                  columns={columns}
                  getCategoryColor={getCategoryColor}
                  index={index}
                />
              ))}
            </tbody>
          </table>
        </div>
        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No pairs match the current filter
          </div>
        )}
      </CardContent>
    </Card>
  );
}