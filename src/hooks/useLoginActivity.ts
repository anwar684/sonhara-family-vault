import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LoginActivityRecord {
  id: string;
  user_id: string;
  email: string | null;
  login_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface MemberLoginSummary {
  user_id: string;
  email: string;
  member_name: string;
  last_login: string | null;
  login_count: number;
}

export function useLoginActivity(limit: number = 50) {
  return useQuery({
    queryKey: ['login-activity', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('login_activity')
        .select('*')
        .order('login_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as LoginActivityRecord[];
    },
  });
}

export function useMemberLoginSummary() {
  return useQuery({
    queryKey: ['member-login-summary'],
    queryFn: async () => {
      // Get all family members with user accounts
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('id, name, email, user_id')
        .not('user_id', 'is', null);

      if (membersError) throw membersError;

      // Get login activity for these users
      const { data: loginData, error: loginError } = await supabase
        .from('login_activity')
        .select('user_id, login_at')
        .order('login_at', { ascending: false });

      if (loginError) throw loginError;

      // Build summary for each member
      const summaries: MemberLoginSummary[] = (members || []).map((member) => {
        const memberLogins = (loginData || []).filter(
          (l) => l.user_id === member.user_id
        );
        return {
          user_id: member.user_id!,
          email: member.email || '',
          member_name: member.name,
          last_login: memberLogins[0]?.login_at || null,
          login_count: memberLogins.length,
        };
      });

      return summaries.sort((a, b) => {
        if (!a.last_login) return 1;
        if (!b.last_login) return -1;
        return new Date(b.last_login).getTime() - new Date(a.last_login).getTime();
      });
    },
  });
}

export async function recordLoginActivity(userId: string, email: string) {
  try {
    const { error } = await supabase.from('login_activity').insert({
      user_id: userId,
      email: email,
      user_agent: navigator.userAgent,
    });
    if (error) {
      console.error('Failed to record login activity:', error);
    }
  } catch (err) {
    console.error('Error recording login activity:', err);
  }
}
