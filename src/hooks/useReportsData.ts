import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MemberPendingBalance {
  id: string;
  name: string;
  phone: string;
  takafulPending: number;
  takafulPendingMonths: string[];
  plusPending: number;
  plusPendingMonths: string[];
  totalPending: number;
}

export interface FundSummary {
  totalCollected: number;
  totalPending: number;
  historicalPaid: number;
  historicalPending: number;
  activeMembers: number;
  pendingMembers: number;
}

export interface ReportStats {
  takaful: FundSummary;
  plus: FundSummary;
  totalMembers: number;
  activeMembers: number;
}

export function usePendingBalances(fundType?: 'takaful' | 'plus') {
  return useQuery({
    queryKey: ['pending-balances', fundType],
    queryFn: async (): Promise<MemberPendingBalance[]> => {
      // Fetch all active members
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('status', 'active');

      if (membersError) throw membersError;

      // Fetch all pending payments
      // Fetch all pending and partial payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('status', ['pending', 'partial']);

      if (paymentsError) throw paymentsError;

      const pendingBalances: MemberPendingBalance[] = [];

      members?.forEach(member => {
        const memberPayments = payments?.filter(p => p.member_id === member.id) || [];
        
        const takafulPayments = memberPayments.filter(p => p.fund_type === 'takaful');
        const plusPayments = memberPayments.filter(p => p.fund_type === 'plus');

        const takafulPending = takafulPayments.reduce((sum, p) => sum + Number(p.due_amount - p.amount), 0) + 
          Number(member.takaful_pending_before_entry || 0);
        const plusPending = plusPayments.reduce((sum, p) => sum + Number(p.due_amount - p.amount), 0) +
          Number(member.plus_pending_before_entry || 0);

        const takafulPendingMonths = takafulPayments.map(p => p.month).sort();
        const plusPendingMonths = plusPayments.map(p => p.month).sort();

        // Filter based on fund type if specified
        if (fundType === 'takaful' && takafulPending <= 0) return;
        if (fundType === 'plus' && plusPending <= 0) return;
        if (!fundType && takafulPending <= 0 && plusPending <= 0) return;

        pendingBalances.push({
          id: member.id,
          name: member.name,
          phone: member.phone,
          takafulPending,
          takafulPendingMonths,
          plusPending,
          plusPendingMonths,
          totalPending: takafulPending + plusPending,
        });
      });

      return pendingBalances.sort((a, b) => b.totalPending - a.totalPending);
    },
  });
}

export function useReportStats() {
  return useQuery({
    queryKey: ['report-stats'],
    queryFn: async (): Promise<ReportStats> => {
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

      const totalMembers = members?.length || 0;
      const activeMembers = members?.filter(m => m.status === 'active').length || 0;

      // Calculate Takaful stats
      const takafulPayments = payments?.filter(p => p.fund_type === 'takaful') || [];
      const takafulCollected = takafulPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const takafulPending = takafulPayments
        .filter(p => p.status === 'pending' || p.status === 'partial')
        .reduce((sum, p) => sum + Number(p.due_amount - p.amount), 0);
      const takafulHistoricalPaid = members?.reduce((sum, m) => sum + Number(m.takaful_paid_before_entry || 0), 0) || 0;
      const takafulHistoricalPending = members?.reduce((sum, m) => sum + Number(m.takaful_pending_before_entry || 0), 0) || 0;
      const takafulActiveMembers = members?.filter(m => m.status === 'active' && m.takaful_amount > 0).length || 0;
      
      // Count members with pending takaful
      const membersWithTakafulPending = new Set(
        takafulPayments.filter(p => p.status === 'pending' || p.status === 'partial').map(p => p.member_id)
      ).size;

      // Calculate Plus stats
      const plusPayments = payments?.filter(p => p.fund_type === 'plus') || [];
      const plusCollected = plusPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const plusPending = plusPayments
        .filter(p => p.status === 'pending' || p.status === 'partial')
        .reduce((sum, p) => sum + Number(p.due_amount - p.amount), 0);
      const plusHistoricalPaid = members?.reduce((sum, m) => sum + Number(m.plus_paid_before_entry || 0), 0) || 0;
      const plusHistoricalPending = members?.reduce((sum, m) => sum + Number(m.plus_pending_before_entry || 0), 0) || 0;
      const plusActiveMembers = members?.filter(m => m.status === 'active' && m.plus_amount > 0).length || 0;
      
      // Count members with pending plus
      const membersWithPlusPending = new Set(
        plusPayments.filter(p => p.status === 'pending' || p.status === 'partial').map(p => p.member_id)
      ).size;

      return {
        totalMembers,
        activeMembers,
        takaful: {
          totalCollected: takafulCollected,
          totalPending: takafulPending,
          historicalPaid: takafulHistoricalPaid,
          historicalPending: takafulHistoricalPending,
          activeMembers: takafulActiveMembers,
          pendingMembers: membersWithTakafulPending,
        },
        plus: {
          totalCollected: plusCollected,
          totalPending: plusPending,
          historicalPaid: plusHistoricalPaid,
          historicalPending: plusHistoricalPending,
          activeMembers: plusActiveMembers,
          pendingMembers: membersWithPlusPending,
        },
      };
    },
  });
}

export function useMonthlyPaymentTrends(year: string) {
  return useQuery({
    queryKey: ['monthly-trends', year],
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .like('month', `${year}%`)
        .order('month', { ascending: true });

      if (error) throw error;

      // Group by month and fund type
      const monthlyData: Record<string, { takafulPaid: number; takafulPending: number; plusPaid: number; plusPending: number }> = {};

      // Initialize all months for the year
      for (let i = 1; i <= 12; i++) {
        const month = `${year}-${i.toString().padStart(2, '0')}`;
        monthlyData[month] = { takafulPaid: 0, takafulPending: 0, plusPaid: 0, plusPending: 0 };
      }

      payments?.forEach(payment => {
        if (!monthlyData[payment.month]) {
          monthlyData[payment.month] = { takafulPaid: 0, takafulPending: 0, plusPaid: 0, plusPending: 0 };
        }

        if (payment.fund_type === 'takaful') {
          if (payment.status === 'paid') {
            monthlyData[payment.month].takafulPaid += Number(payment.amount);
          } else if (payment.status === 'pending' || payment.status === 'partial') {
            monthlyData[payment.month].takafulPending += Number(payment.due_amount - payment.amount);
          }
        } else {
          if (payment.status === 'paid') {
            monthlyData[payment.month].plusPaid += Number(payment.amount);
          } else if (payment.status === 'pending' || payment.status === 'partial') {
            monthlyData[payment.month].plusPending += Number(payment.due_amount - payment.amount);
          }
        }
      });

      return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        ...data,
      }));
    },
  });
}
