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
