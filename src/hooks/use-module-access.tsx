/**
 * useModuleAccess Hook
 * 
 * Check if current user has access to a specific module.
 * Admins automatically have access to all modules.
 */

'use client';

import { useState, useEffect } from 'react';
import { useGlobal } from '@/lib/context/GlobalContext';
import type { ModuleSlug } from '@/features/shared/schema/profile.schema';

type ModuleAccessState = {
  hasAccess: boolean;
  loading: boolean;
  error: string | null;
};

export function useModuleAccess(moduleSlug: ModuleSlug): ModuleAccessState {
  const { profile, moduleAccess, loading: globalLoading } = useGlobal();
  const [state, setState] = useState<ModuleAccessState>({
    hasAccess: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (globalLoading) {
      return;
    }

    // Admins have access to everything
    if (profile?.role === 'admin') {
      setState({ hasAccess: true, loading: false, error: null });
      return;
    }

    // Check module access from context
    const access = moduleAccess?.find(m => m.module_slug === moduleSlug);
    setState({
      hasAccess: access?.enabled ?? false,
      loading: false,
      error: null,
    });
  }, [profile, moduleAccess, moduleSlug, globalLoading]);

  return state;
}

/**
 * Higher-order component to protect routes by module access
 */
export function withModuleAccess<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  moduleSlug: ModuleSlug,
  FallbackComponent?: React.ComponentType
) {
  return function ModuleProtectedComponent(props: P) {
    const { hasAccess, loading } = useModuleAccess(moduleSlug);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }

    if (!hasAccess) {
      if (FallbackComponent) {
        return <FallbackComponent />;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V7a4 4 0 00-8 0v4m12 0a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2h12z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900">Access Restricted</h3>
          <p className="text-zinc-500 mt-1 max-w-sm">
            You don&apos;t have access to this module. Contact an administrator to request access.
          </p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
