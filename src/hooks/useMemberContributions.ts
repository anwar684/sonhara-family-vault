import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MemberContributionSummary {
  id: string;
  name: string;
  phone: string;
  // Takaful
  takafulMonthlyAmount: number;
  takafulTotalPaid: number;
  takafulTotalPending: number;
  // Plus
  plusMonthlyAmount: number;
  plusTotalPaid: number;
  plusTotalPending: number;
  // Combined
  totalDeclared: number;
  totalPaid: number;
  totalPending: number;
}

export function useMemberContributions() {
  return useQuery({
    queryKey: ['member-contributions'],
    queryFn: async (): Promise<MemberContributionSummary[]> => {
      // Fetch all active members
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (membersError) throw membersError;

      // Fetch all payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*');

      if (paymentsError) throw paymentsError;

      return members?.map(member => {
        const memberPayments = payments?.filter(p => p.member_id === member.id) || [];
        
        // Takaful calculations
        const takafulPayments = memberPayments.filter(p => p.fund_type === 'takaful');
        const takafulPaid = takafulPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + Number(p.amount), 0) +
          takafulPayments
            .filter(p => p.status === 'partial')
            .reduce((sum, p) => sum + Number(p.amount), 0) +
          Number(member.takaful_paid_before_entry || 0);
        const takafulPending = takafulPayments
          .filter(p => p.status === 'pending' || p.status === 'partial')
          .reduce((sum, p) => sum + Number(p.due_amount - p.amount), 0) +
          Number(member.takaful_pending_before_entry || 0);

        // Plus calculations
        const plusPayments = memberPayments.filter(p => p.fund_type === 'plus');
        const plusPaid = plusPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + Number(p.amount), 0) +
          plusPayments
            .filter(p => p.status === 'partial')
            .reduce((sum, p) => sum + Number(p.amount), 0) +
          Number(member.plus_paid_before_entry || 0);
        const plusPending = plusPayments
          .filter(p => p.status === 'pending' || p.status === 'partial')
          .reduce((sum, p) => sum + Number(p.due_amount - p.amount), 0) +
          Number(member.plus_pending_before_entry || 0);

        const totalPaid = takafulPaid + plusPaid;
        const totalPending = takafulPending + plusPending;

        return {
          id: member.id,
          name: member.name,
          phone: member.phone,
          takafulMonthlyAmount: Number(member.takaful_amount),
          takafulTotalPaid: takafulPaid,
          takafulTotalPending: takafulPending,
          plusMonthlyAmount: Number(member.plus_amount),
          plusTotalPaid: plusPaid,
          plusTotalPending: plusPending,
          totalDeclared: Number(member.takaful_amount) + Number(member.plus_amount),
          totalPaid,
          totalPending,
        };
      }) || [];
    },
  });
}

export interface TakafulPendingMember {
  id: string;
  name: string;
  phone: string;
  monthlyAmount: number;
  totalPending: number;
  pendingMonths: string[];
}

export interface PlusPendingMember {
  id: string;
  name: string;
  phone: string;
  monthlyAmount: number;
  totalPending: number;
  pendingMonths: string[];
}

export function useTakafulPendingReport() {
  return useQuery({
    queryKey: ['takaful-pending-report'],
    queryFn: async (): Promise<TakafulPendingMember[]> => {
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('status', 'active')
        .gt('takaful_amount', 0)
        .order('name');

      if (membersError) throw membersError;

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('fund_type', 'takaful')
        .in('status', ['pending', 'partial']);

      if (paymentsError) throw paymentsError;

      const result: TakafulPendingMember[] = [];

      members?.forEach(member => {
        const memberPayments = payments?.filter(p => p.member_id === member.id) || [];
        const pendingAmount = memberPayments.reduce((sum, p) => sum + Number(p.due_amount - p.amount), 0) +
          Number(member.takaful_pending_before_entry || 0);
        const pendingMonths = memberPayments.map(p => p.month).sort();

        if (pendingAmount > 0) {
          result.push({
            id: member.id,
            name: member.name,
            phone: member.phone,
            monthlyAmount: Number(member.takaful_amount),
            totalPending: pendingAmount,
            pendingMonths,
          });
        }
      });

      return result.sort((a, b) => b.totalPending - a.totalPending);
    },
  });
}

export function usePlusPendingReport() {
  return useQuery({
    queryKey: ['plus-pending-report'],
    queryFn: async (): Promise<PlusPendingMember[]> => {
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('status', 'active')
        .gt('plus_amount', 0)
        .order('name');

      if (membersError) throw membersError;

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('fund_type', 'plus')
        .in('status', ['pending', 'partial']);

      if (paymentsError) throw paymentsError;

      const result: PlusPendingMember[] = [];

      members?.forEach(member => {
        const memberPayments = payments?.filter(p => p.member_id === member.id) || [];
        const pendingAmount = memberPayments.reduce((sum, p) => sum + Number(p.due_amount - p.amount), 0) +
          Number(member.plus_pending_before_entry || 0);
        const pendingMonths = memberPayments.map(p => p.month).sort();

        if (pendingAmount > 0) {
          result.push({
            id: member.id,
            name: member.name,
            phone: member.phone,
            monthlyAmount: Number(member.plus_amount),
            totalPending: pendingAmount,
            pendingMonths,
          });
        }
      });

      return result.sort((a, b) => b.totalPending - a.totalPending);
    },
  });
}
