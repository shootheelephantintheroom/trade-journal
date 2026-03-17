-- Fix "Function Search Path Mutable" warnings from Supabase Security Advisor
-- by adding SET search_path = '' to each function.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, plan, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    'free',
    'none'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_journal_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
