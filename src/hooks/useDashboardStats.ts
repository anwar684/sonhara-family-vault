import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FundStats {
  totalCollected: number;
  totalPending: number;
  activeMembers: number;
  currentMonthCollection: number;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  takaful: FundStats;
  plus: FundStats;
}

export interface MonthlyContribution {
  month: string;
  totalDue: number;
  totalPaid: number;
  totalPending: number;
  memberCount: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch all family members
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('*');

      if (membersError) throw membersError;

      // Fetch all payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*');

      if (paymentsError) throw paymentsError;

      // Fetch total disbursed to beneficiaries (funded from Takaful only)
      const { data: disbursements, error: disbursementsError } = await supabase
        .from('case_disbursements')
        .select('amount');

      if (disbursementsError) throw disbursementsError;

      const totalDisbursed = disbursements?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      const totalMembers = members?.length || 0;
      const activeMembers = members?.filter(m => m.status === 'active').length || 0;

      // Calculate Takaful stats
      const takafulPayments = payments?.filter(p => p.fund_type === 'takaful') || [];
      const takafulCollected = takafulPayments
        .filter(p => p.status === 'paid' || p.status === 'partial')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const takafulPending = takafulPayments
        .filter(p => p.status === 'pending' || p.status === 'partial')
        .reduce((sum, p) => sum + Number(p.due_amount - p.amount), 0);
      const takafulCurrentMonth = takafulPayments
        .filter(p => p.month === currentMonth && p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const takafulActiveMembers = members?.filter(m => m.status === 'active' && m.takaful_amount > 0).length || 0;

      // Add historical contributions to totals
      const takafulHistoricalPaid = members?.reduce((sum, m) => sum + Number(m.takaful_paid_before_entry || 0), 0) || 0;
      const takafulHistoricalPending = members?.reduce((sum, m) => sum + Number(m.takaful_pending_before_entry || 0), 0) || 0;

      // Calculate Plus stats
      const plusPayments = payments?.filter(p => p.fund_type === 'plus') || [];
      const plusCollected = plusPayments
        .filter(p => p.status === 'paid' || p.status === 'partial')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const plusPending = plusPayments
        .filter(p => p.status === 'pending' || p.status === 'partial')
        .reduce((sum, p) => sum + Number(p.due_amount - p.amount), 0);
      const plusCurrentMonth = plusPayments
        .filter(p => p.month === currentMonth && p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const plusActiveMembers = members?.filter(m => m.status === 'active' && m.plus_amount > 0).length || 0;

      // Add historical contributions to totals
      const plusHistoricalPaid = members?.reduce((sum, m) => sum + Number(m.plus_paid_before_entry || 0), 0) || 0;
      const plusHistoricalPending = members?.reduce((sum, m) => sum + Number(m.plus_pending_before_entry || 0), 0) || 0;

      return {
        totalMembers,
        activeMembers,
        takaful: {
          totalCollected: takafulCollected + takafulHistoricalPaid - totalDisbursed,
          totalPending: takafulPending + takafulHistoricalPending,
          activeMembers: takafulActiveMembers,
          currentMonthCollection: takafulCurrentMonth,
        },
        plus: {
          totalCollected: plusCollected + plusHistoricalPaid,
          totalPending: plusPending + plusHistoricalPending,
          activeMembers: plusActiveMembers,
          currentMonthCollection: plusCurrentMonth,
        },
      };
    },
  });
}

export function useMonthlyContributions(fundType: 'takaful' | 'plus') {
  return useQuery({
    queryKey: ['monthly-contributions', fundType],
    queryFn: async (): Promise<MonthlyContribution[]> => {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('fund_type', fundType)
        .order('month', { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyData: Record<string, MonthlyContribution> = {};

      payments?.forEach(payment => {
        if (!monthlyData[payment.month]) {
          monthlyData[payment.month] = {
            month: payment.month,
            totalDue: 0,
            totalPaid: 0,
            totalPending: 0,
            memberCount: 0,
          };
        }

        monthlyData[payment.month].totalDue += Number(payment.due_amount);
        monthlyData[payment.month].totalPaid += Number(payment.amount);
        monthlyData[payment.month].totalPending += Number(payment.due_amount - payment.amount);
        monthlyData[payment.month].memberCount += 1;
      });

      // Get last 6 months
      return Object.values(monthlyData).slice(-6);
    },
  });
}

export function useRecentPayments(limit: number = 6) {
  return useQuery({
    queryKey: ['recent-payments', limit],
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*, family_members(name)')
        .eq('status', 'paid')
        .order('paid_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return payments || [];
    },
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
