import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FamilyMemberDB {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  takaful_amount: number;
  plus_amount: number;
  initial_contribution: number;
  joined_date: string;
  takaful_joined_date: string | null;
  plus_joined_date: string | null;
  takaful_paid_before_entry: number | null;
  takaful_pending_before_entry: number | null;
  plus_paid_before_entry: number | null;
  plus_pending_before_entry: number | null;
  avatar_url: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useFamilyMembers() {
  return useQuery({
    queryKey: ['family-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FamilyMemberDB[];
    },
  });
}

export function useCreateFamilyMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (member: {
      name: string;
      phone: string;
      email?: string;
      takaful_amount?: number;
      plus_amount?: number;
      initial_contribution?: number;
      joined_date?: string;
      takaful_joined_date?: string;
      plus_joined_date?: string;
      takaful_paid_before_entry?: number;
      takaful_pending_before_entry?: number;
      plus_paid_before_entry?: number;
      plus_pending_before_entry?: number;
    }) => {
      const { data, error } = await supabase
        .from('family_members')
        .insert({
          name: member.name,
          phone: member.phone,
          email: member.email || null,
          takaful_amount: member.takaful_amount || 0,
          plus_amount: member.plus_amount || 0,
          initial_contribution: member.initial_contribution || 0,
          joined_date: member.joined_date || new Date().toISOString().split('T')[0],
          takaful_joined_date: member.takaful_joined_date || member.joined_date || new Date().toISOString().split('T')[0],
          plus_joined_date: member.plus_joined_date || member.joined_date || new Date().toISOString().split('T')[0],
          takaful_paid_before_entry: member.takaful_paid_before_entry || 0,
          takaful_pending_before_entry: member.takaful_pending_before_entry || 0,
          plus_paid_before_entry: member.plus_paid_before_entry || 0,
          plus_pending_before_entry: member.plus_pending_before_entry || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      toast({
        title: 'Member Added',
        description: `${data.name} has been added to the family.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add member.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateFamilyMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (member: {
      id: string;
      name?: string;
      phone?: string;
      email?: string;
      status?: string;
      takaful_amount?: number;
      plus_amount?: number;
      takaful_joined_date?: string;
      plus_joined_date?: string;
      takaful_paid_before_entry?: number;
      takaful_pending_before_entry?: number;
      plus_paid_before_entry?: number;
      plus_pending_before_entry?: number;
    }) => {
      const { id, ...updates } = member;
      const { data, error } = await supabase
        .from('family_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      queryClient.invalidateQueries({ queryKey: ['family-member', data.id] });
      toast({
        title: 'Member Updated',
        description: `${data.name}'s details have been updated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update member.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteFamilyMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      toast({
        title: 'Member Removed',
        description: 'Member has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove member.',
        variant: 'destructive',
      });
    },
  });
}
