import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Beneficiary, BeneficiaryCase, CaseDisbursement, CaseType, CaseStatus } from '@/types/beneficiary';
import { useToast } from '@/hooks/use-toast';

export function useBeneficiaries() {
  return useQuery({
    queryKey: ['beneficiaries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Beneficiary[];
    },
  });
}

export function useBeneficiaryCases(status?: CaseStatus) {
  return useQuery({
    queryKey: ['beneficiary-cases', status],
    queryFn: async () => {
      let query = supabase
        .from('beneficiary_cases')
        .select(`
          *,
          beneficiary:beneficiaries(*)
        `)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as (BeneficiaryCase & { beneficiary: Beneficiary })[];
    },
  });
}

export function useCaseDisbursements(caseId: string) {
  return useQuery({
    queryKey: ['case-disbursements', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_disbursements')
        .select('*')
        .eq('case_id', caseId)
        .order('disbursement_date', { ascending: false });
      
      if (error) throw error;
      return data as CaseDisbursement[];
    },
    enabled: !!caseId,
  });
}

export function useCreateBeneficiary() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (beneficiary: Omit<Beneficiary, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('beneficiaries')
        .insert(beneficiary)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      toast({
        title: 'Beneficiary Added',
        description: 'The beneficiary has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (caseData: {
      beneficiary_id: string;
      case_type: CaseType;
      title: string;
      description?: string;
      requested_amount: number;
      requested_by: string;
    }) => {
      const { data, error } = await supabase
        .from('beneficiary_cases')
        .insert(caseData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiary-cases'] });
      toast({
        title: 'Request Submitted',
        description: 'Your assistance request has been submitted for approval.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useApproveCase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      caseId,
      approvedAmount,
      approverId,
    }: {
      caseId: string;
      approvedAmount: number;
      approverId: string;
    }) => {
      const { data, error } = await supabase
        .from('beneficiary_cases')
        .update({
          status: 'approved' as CaseStatus,
          approved_amount: approvedAmount,
          approved_by: approverId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', caseId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiary-cases'] });
      toast({
        title: 'Case Approved',
        description: 'The assistance request has been approved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRejectCase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      caseId,
      reason,
    }: {
      caseId: string;
      reason: string;
    }) => {
      const { data, error } = await supabase
        .from('beneficiary_cases')
        .update({
          status: 'rejected' as CaseStatus,
          rejection_reason: reason,
        })
        .eq('id', caseId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiary-cases'] });
      toast({
        title: 'Case Rejected',
        description: 'The assistance request has been rejected.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAddDisbursement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (disbursement: {
      case_id: string;
      amount: number;
      disbursed_by: string;
      payment_method?: string;
      reference_number?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('case_disbursements')
        .insert({
          ...disbursement,
          disbursement_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['beneficiary-cases'] });
      queryClient.invalidateQueries({ queryKey: ['case-disbursements', variables.case_id] });
      toast({
        title: 'Disbursement Recorded',
        description: 'The payment has been recorded successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCompleteCase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (caseId: string) => {
      const { data, error } = await supabase
        .from('beneficiary_cases')
        .update({ status: 'completed' as CaseStatus })
        .eq('id', caseId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiary-cases'] });
      toast({
        title: 'Case Completed',
        description: 'The case has been marked as completed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useBeneficiaryStats() {
  return useQuery({
    queryKey: ['beneficiary-stats'],
    queryFn: async () => {
      const { data: cases, error } = await supabase
        .from('beneficiary_cases')
        .select('*');
      
      if (error) throw error;
      
      const pendingCases = cases?.filter(c => c.status === 'pending') || [];
      const approvedCases = cases?.filter(c => c.status === 'approved' || c.status === 'completed') || [];
      const totalDisbursed = approvedCases.reduce((sum, c) => sum + (Number(c.disbursed_amount) || 0), 0);
      const totalApproved = approvedCases.reduce((sum, c) => sum + (Number(c.approved_amount) || 0), 0);
      
      return {
        totalCases: cases?.length || 0,
        pendingCases: pendingCases.length,
        approvedCases: approvedCases.length,
        totalDisbursed,
        totalApproved,
        pendingDisbursement: totalApproved - totalDisbursed,
      };
    },
  });
}
