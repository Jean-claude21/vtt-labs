// src/lib/context/GlobalContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { createSPASassClientAuthenticated as createSPASassClient } from '@/lib/supabase/client';

type User = {
    email: string;
    id: string;
    registered_at: Date;
};

type Profile = {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    role: 'admin' | 'user';
    created_at: string | null;
    updated_at: string | null;
};

type ModuleAccess = {
    module_slug: string;
    enabled: boolean;
};

interface GlobalContextType {
    loading: boolean;
    user: User | null;
    profile: Profile | null;
    moduleAccess: ModuleAccess[] | null;
    isAdmin: boolean;
    refreshProfile: () => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [moduleAccess, setModuleAccess] = useState<ModuleAccess[] | null>(null);

    const loadData = useCallback(async () => {
        try {
            const supabase = await createSPASassClient();
            const client = supabase.getSupabaseClient();

            // Get user data
            const { data: { user: authUser } } = await client.auth.getUser();
            if (authUser) {
                setUser({
                    email: authUser.email!,
                    id: authUser.id,
                    registered_at: new Date(authUser.created_at)
                });

                // Fetch profile
                const { data: profileData } = await client
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (profileData) {
                    setProfile(profileData as unknown as Profile);
                }

                // Fetch module access
                const { data: modulesData } = await client
                    .from('user_module_access')
                    .select('module_slug, enabled')
                    .eq('user_id', authUser.id);

                if (modulesData) {
                    setModuleAccess(modulesData as ModuleAccess[]);
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const refreshProfile = useCallback(async () => {
        setLoading(true);
        await loadData();
    }, [loadData]);

    const isAdmin = profile?.role === 'admin';

    const contextValue = useMemo(() => ({ 
        loading, 
        user, 
        profile, 
        moduleAccess,
        isAdmin,
        refreshProfile,
    }), [loading, user, profile, moduleAccess, isAdmin, refreshProfile]);

    return (
        <GlobalContext.Provider value={contextValue}>
            {children}
        </GlobalContext.Provider>
    );
}

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (context === undefined) {
        throw new Error('useGlobal must be used within a GlobalProvider');
    }
    return context;
};