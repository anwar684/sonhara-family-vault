import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FundType } from '@/types';
import { formatCurrency } from '@/lib/mockData';

interface FundCardProps {
  fundType: FundType;
  totalCollected: number;
  totalPending: number;
  activeMembers: number;
  currentMonthCollection: number;
  className?: string;
}

export function FundCard({
  fundType,
  totalCollected,
  totalPending,
  activeMembers,
  currentMonthCollection,
  className,
}: FundCardProps) {
  const isTakaful = fundType === 'takaful';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 md:p-8 transition-all duration-300 hover:shadow-xl',
        isTakaful ? 'bg-gradient-navy text-primary-foreground' : 'bg-gradient-gold text-navy-dark',
        className
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-current blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-current blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span
              className={cn(
                'inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2',
                isTakaful ? 'bg-primary-foreground/20' : 'bg-navy/20'
              )}
            >
              {isTakaful ? 'Donation Fund' : 'Investment Fund'}
            </span>
            <h3 className="font-serif text-2xl md:text-3xl font-bold">
              Sonhara {isTakaful ? 'Takaful' : 'Plus'}
            </h3>
          </div>
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-xl',
              isTakaful ? 'bg-gold/20' : 'bg-navy/20'
            )}
          >
            <span className={cn('text-2xl font-bold', isTakaful ? 'text-gold' : 'text-navy')}>
              {isTakaful ? 'T' : 'P'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className={cn('text-sm opacity-80', isTakaful ? 'text-primary-foreground' : 'text-navy')}>
              Total Collected
            </p>
            <p className="text-2xl md:text-3xl font-bold font-serif">
              {formatCurrency(totalCollected)}
            </p>
          </div>
          <div>
            <p className={cn('text-sm opacity-80', isTakaful ? 'text-primary-foreground' : 'text-navy')}>
              Pending Amount
            </p>
            <p className="text-2xl md:text-3xl font-bold font-serif">
              {formatCurrency(totalPending)}
            </p>
          </div>
        </div>

        <div className={cn(
          'flex items-center gap-4 p-4 rounded-xl mb-6',
          isTakaful ? 'bg-primary-foreground/10' : 'bg-navy/10'
        )}>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="text-sm">{activeMembers} Active</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">This Month: {formatCurrency(currentMonthCollection)}</span>
          </div>
          {totalPending > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Dues Pending</span>
            </div>
          )}
        </div>

        <Button
          variant={isTakaful ? 'gold' : 'navy'}
          className="w-full"
          asChild
        >
          <Link to={`/${fundType}`}>
            View Details
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
