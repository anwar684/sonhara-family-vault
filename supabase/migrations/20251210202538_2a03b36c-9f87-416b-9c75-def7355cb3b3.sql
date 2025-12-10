-- Function to auto-link family member when user signs up with matching email
CREATE OR REPLACE FUNCTION public.link_family_member_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update family_member with matching email to link to the new user
  UPDATE public.family_members
  SET user_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email)
    AND user_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after user creation
DROP TRIGGER IF EXISTS on_auth_user_created_link_family_member ON auth.users;
CREATE TRIGGER on_auth_user_created_link_family_member
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_family_member_on_signup();