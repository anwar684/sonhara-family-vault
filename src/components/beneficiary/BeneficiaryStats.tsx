import { StatCard } from '@/components/dashboard/StatCard';
import { useBeneficiaryStats } from '@/hooks/useBeneficiaries';
import { formatCurrency } from '@/lib/mockData';
import { Heart, Clock, CheckCircle, Wallet } from 'lucide-react';

export function BeneficiaryStats() {
  const { data: stats, isLoading } = useBeneficiaryStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Cases"
        value={stats?.totalCases.toString() || '0'}
        subtitle="All time requests"
        icon={Heart}
        variant="navy"
      />
      <StatCard
        title="Pending Approval"
        value={stats?.pendingCases.toString() || '0'}
        subtitle="Awaiting review"
        icon={Clock}
        variant="warning"
      />
      <StatCard
        title="Total Approved"
        value={formatCurrency(stats?.totalApproved || 0)}
        subtitle={`${stats?.approvedCases || 0} cases`}
        icon={CheckCircle}
        variant="navy"
      />
      <StatCard
        title="Total Disbursed"
        value={formatCurrency(stats?.totalDisbursed || 0)}
        subtitle={`${formatCurrency(stats?.pendingDisbursement || 0)} pending`}
        icon={Wallet}
        variant="gold"
      />
    </div>
  );
}
