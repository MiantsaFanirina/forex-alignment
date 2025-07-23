import { TrendDirection } from '@/types/forex';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendIndicatorProps {
  trend: TrendDirection;
  className?: string;
}

export function TrendIndicator({ trend, className }: TrendIndicatorProps) {
  const getIndicatorStyle = (trend: TrendDirection) => {
    switch (trend) {
      case 'bullish':
        return {
          bgClass: 'bg-green-500/20 border-green-500/30',
          textClass: 'text-green-400',
          icon: TrendingUp,
        };
      case 'bearish':
        return {
          bgClass: 'bg-red-500/20 border-red-500/30',
          textClass: 'text-red-400',
          icon: TrendingDown,
        };
      case 'neutral':
        return {
          bgClass: 'bg-gray-500/20 border-gray-500/30',
          textClass: 'text-gray-400',
          icon: Minus,
        };
    }
  };

  const { bgClass, textClass, icon: Icon } = getIndicatorStyle(trend);

  return (
    <div className={cn(
      'flex items-center justify-center px-2 py-1 rounded-md border transition-all duration-200 hover:scale-105',
      bgClass,
      className
    )}>
      <Icon className={cn('h-3 w-3', textClass)} />
    </div>
  );
}