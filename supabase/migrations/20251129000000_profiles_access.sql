-- ============================================================================
-- VTT Labs — Multi-User + Selective Sharing Data Model
-- Migration: profiles, user_module_access, shared_access
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE
-- Extends auth.users with additional user information
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_role TEXT := 'user';
  v_full_name TEXT;
  v_is_first_user BOOLEAN;
  v_admin_emails TEXT[] := ARRAY['messanjeanclaude@gmail.com'];
BEGIN
  -- Check if this is the first user (auto-admin)
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO v_is_first_user;
  
  -- Determine role: admin if first user OR email in admin list
  IF v_is_first_user OR NEW.email = ANY(v_admin_emails) THEN
    v_role := 'admin';
  END IF;

  -- Extract full_name: from metadata, or derive from email (part before @, capitalize first letter)
  v_full_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    INITCAP(SPLIT_PART(NEW.email, '@', 1))
  );

  -- 1. Create profile with determined role
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    NEW.raw_user_meta_data ->> 'avatar_url',
    v_role
  );
  
  -- 2. Grant default module access
  INSERT INTO public.user_module_access (user_id, module_slug, enabled)
  VALUES 
    (NEW.id, 'core', true),
    (NEW.id, 'tasks', true);
  
  RETURN NEW;
END;
$$;

-- Trigger for auto-creating profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 2. USER MODULE ACCESS TABLE
-- Controls which modules each user can access
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_module_access (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_slug TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES public.profiles(id),
  PRIMARY KEY (user_id, module_slug)
);

-- Enable RLS
ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own module access
CREATE POLICY "Users can view own module access"
  ON public.user_module_access
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can manage all module access
CREATE POLICY "Admins can manage module access"
  ON public.user_module_access
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_module_access_user_id 
  ON public.user_module_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_access_module_slug 
  ON public.user_module_access(module_slug);

-- ============================================================================
-- 3. SHARED ACCESS TABLE
-- Enables selective sharing of resources between users
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.shared_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  shared_with_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, resource_type, resource_id, shared_with_id)
);

-- Enable RLS
ALTER TABLE public.shared_access ENABLE ROW LEVEL SECURITY;

-- Owners can manage their shared access entries
CREATE POLICY "Owners can manage shared access"
  ON public.shared_access
  FOR ALL
  USING (owner_id = auth.uid());

-- Recipients can view shares they've received
CREATE POLICY "Recipients can view received shares"
  ON public.shared_access
  FOR SELECT
  USING (shared_with_id = auth.uid());

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_shared_access_owner_id 
  ON public.shared_access(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_access_shared_with_id 
  ON public.shared_access(shared_with_id);
CREATE INDEX IF NOT EXISTS idx_shared_access_resource 
  ON public.shared_access(resource_type, resource_id);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Check if user has access to a module
CREATE OR REPLACE FUNCTION public.user_has_module_access(
  p_user_id UUID,
  p_module_slug TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Admins have access to all modules
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_user_id AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific module access
  RETURN EXISTS (
    SELECT 1 FROM public.user_module_access
    WHERE user_id = p_user_id 
      AND module_slug = p_module_slug 
      AND enabled = true
  );
END;
$$;

-- Check if user has shared access to a resource
CREATE OR REPLACE FUNCTION public.user_has_shared_access(
  p_user_id UUID,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_min_permission TEXT DEFAULT 'view'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  permission_rank INTEGER;
  required_rank INTEGER;
BEGIN
  -- Map permissions to ranks
  CASE p_min_permission
    WHEN 'view' THEN required_rank := 1;
    WHEN 'edit' THEN required_rank := 2;
    WHEN 'admin' THEN required_rank := 3;
    ELSE required_rank := 1;
  END CASE;
  
  -- Check for valid, non-expired share with sufficient permission
  SELECT 
    CASE permission
      WHEN 'view' THEN 1
      WHEN 'edit' THEN 2
      WHEN 'admin' THEN 3
      ELSE 0
    END INTO permission_rank
  FROM public.shared_access
  WHERE shared_with_id = p_user_id
    AND resource_type = p_resource_type
    AND (resource_id IS NULL OR resource_id = p_resource_id)
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY permission_rank DESC
  LIMIT 1;
  
  RETURN COALESCE(permission_rank >= required_rank, FALSE);
END;
$$;

-- ============================================================================
-- 5. NOTE: Default module access is granted in handle_new_user() trigger
-- ============================================================================
-- New users automatically receive access to:
-- - 'core' module
-- - 'tasks' module
-- Add more modules to the trigger as needed.
