import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlignmentIndicatorProps {
  isAligned: boolean;
  className?: string;
}

export function AlignmentIndicator({ isAligned, className }: AlignmentIndicatorProps) {
  return (
    <div className={cn(
      'flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 hover:scale-110',
      isAligned 
        ? 'bg-green-500/20 border border-green-500/30' 
        : 'bg-red-500/20 border border-red-500/30',
      className
    )}>
      {isAligned ? (
        <Check className="h-3 w-3 text-green-400" />
      ) : (
        <X className="h-3 w-3 text-red-400" />
      )}
    </div>
  );
}