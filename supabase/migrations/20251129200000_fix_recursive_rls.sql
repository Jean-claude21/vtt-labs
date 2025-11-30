-- ============================================================================
-- Fix: Remove recursive RLS policy on profiles table
-- The "Admins can view all profiles" policy causes infinite recursion
-- ============================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a security definer function to check admin status without triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Recreate the admin policy using the security definer function
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());

-- Also fix user_module_access policies that might have the same issue
DROP POLICY IF EXISTS "Admins can manage module access" ON public.user_module_access;

CREATE POLICY "Admins can manage module access"
  ON public.user_module_access
  FOR ALL
  USING (public.is_admin());
