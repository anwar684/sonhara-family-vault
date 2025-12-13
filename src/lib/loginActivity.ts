import { supabase } from '@/integrations/supabase/client';

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
