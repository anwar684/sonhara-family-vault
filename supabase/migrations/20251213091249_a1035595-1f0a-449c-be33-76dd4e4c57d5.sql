-- Create login_activity table to track member logins
CREATE TABLE public.login_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  login_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Enable RLS
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

-- Only admins can view login activity
CREATE POLICY "Admins can view all login activity"
ON public.login_activity
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own login activity (triggered on login)
CREATE POLICY "Users can insert own login activity"
ON public.login_activity
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_login_activity_user_id ON public.login_activity(user_id);
CREATE INDEX idx_login_activity_login_at ON public.login_activity(login_at DESC);