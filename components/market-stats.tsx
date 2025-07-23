"use client";

import { ForexPair } from '@/types/forex';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';

interface MarketStatsProps {
  data: ForexPair[];
}

export function MarketStats({ data }: MarketStatsProps) {
  const totalPairs = data.length;
  const alignedPairs = data.filter(pair => pair.alignment).length;
  const bullishPairs = data.filter(pair => pair.daily === 'bullish').length;
  const bearishPairs = data.filter(pair => pair.daily === 'bearish').length;
  const alignmentPercentage = Math.round((alignedPairs / totalPairs) * 100);

  const stats = [
    {
      title: 'Total Pairs',
      value: totalPairs,
      icon: Activity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Aligned',
      value: `${alignedPairs} (${alignmentPercentage}%)`,
      icon: Target,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Bullish Daily',
      value: bullishPairs,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Bearish Daily',
      value: bearishPairs,
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{stat.title}</p>
                <p className="text-lg font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}