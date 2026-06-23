-- Trigger to automatically confirm emails for all new users
-- This permanently bypasses the "Email not confirmed" error even if the setting is accidentally left on in the Supabase Dashboard

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set the email_confirmed_at timestamp so Supabase thinks it's already verified
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. Drop the trigger if it already exists (to prevent duplicates)
DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;

-- 3. Attach the trigger to auth.users table
CREATE TRIGGER auto_confirm_email_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_email();

-- 4. Just to be safe, auto-confirm any existing users that are currently stuck
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- 5. Revoke execute from public/anon/authenticated to fix security warnings
REVOKE EXECUTE ON FUNCTION public.auto_confirm_email FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_confirm_email FROM anon, authenticated;
