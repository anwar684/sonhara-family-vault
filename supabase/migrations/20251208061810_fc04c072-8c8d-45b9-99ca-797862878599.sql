-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- Create enum for beneficiary case types
CREATE TYPE public.case_type AS ENUM ('funeral', 'education', 'medical', 'marriage', 'emergency', 'welfare');

-- Create enum for case status
CREATE TYPE public.case_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  UNIQUE (user_id, role)
);

-- Create family_members table
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  takaful_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  plus_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE NOT NULL,
  fund_type TEXT NOT NULL CHECK (fund_type IN ('takaful', 'plus')),
  amount DECIMAL(10,2) NOT NULL,
  due_amount DECIMAL(10,2) NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'partial', 'pending')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create beneficiaries table (can be family member or external person)
CREATE TABLE public.beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  relationship TEXT, -- e.g., 'family member', 'neighbor', 'friend'
  address TEXT,
  notes TEXT,
  is_family_member BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create beneficiary_cases table (assistance requests)
CREATE TABLE public.beneficiary_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id UUID REFERENCES public.beneficiaries(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  case_type case_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  requested_amount DECIMAL(10,2) NOT NULL,
  approved_amount DECIMAL(10,2),
  disbursed_amount DECIMAL(10,2) DEFAULT 0,
  status case_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case_disbursements table (tracks actual payments to beneficiaries)
CREATE TABLE public.case_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.beneficiary_cases(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  disbursed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  disbursement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT, -- e.g., 'cash', 'bank transfer', 'mobile money'
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiary_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_disbursements ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get current user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles policies (only admins can manage)
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Family members policies
CREATE POLICY "Authenticated users can view family members" ON public.family_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert family members" ON public.family_members
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update family members" ON public.family_members
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete family members" ON public.family_members
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Payments policies
CREATE POLICY "Members can view own payments" ON public.payments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.id = member_id AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert payments" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payments" ON public.payments
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete payments" ON public.payments
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Beneficiaries policies
CREATE POLICY "Authenticated users can view beneficiaries" ON public.beneficiaries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert beneficiaries" ON public.beneficiaries
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update beneficiaries" ON public.beneficiaries
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete beneficiaries" ON public.beneficiaries
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Beneficiary cases policies
CREATE POLICY "Users can view own requested cases" ON public.beneficiary_cases
  FOR SELECT TO authenticated USING (requested_by = auth.uid());

CREATE POLICY "Admins can view all cases" ON public.beneficiary_cases
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can request assistance" ON public.beneficiary_cases
  FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Admins can update cases" ON public.beneficiary_cases
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete cases" ON public.beneficiary_cases
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Case disbursements policies
CREATE POLICY "Admins can view all disbursements" ON public.case_disbursements
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view disbursements for own cases" ON public.case_disbursements
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.beneficiary_cases bc 
      WHERE bc.id = case_id AND bc.requested_by = auth.uid()
    )
  );

CREATE POLICY "Admins can insert disbursements" ON public.case_disbursements
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update disbursements" ON public.case_disbursements
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beneficiaries_updated_at
  BEFORE UPDATE ON public.beneficiaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beneficiary_cases_updated_at
  BEFORE UPDATE ON public.beneficiary_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  -- Default role is 'member'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update disbursed_amount in case when disbursement is added
CREATE OR REPLACE FUNCTION public.update_case_disbursed_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.beneficiary_cases
  SET disbursed_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.case_disbursements
    WHERE case_id = NEW.case_id
  )
  WHERE id = NEW.case_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_disbursed_amount_on_insert
  AFTER INSERT ON public.case_disbursements
  FOR EACH ROW EXECUTE FUNCTION public.update_case_disbursed_amount();