// src/lib/context/GlobalContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createSPASassClientAuthenticated as createSPASassClient } from '@/lib/supabase/client';


type User = {
    email: string;
    id: string;
    registered_at: Date;
};

type Profile = {
    full_name: string | null;
    avatar_url: string | null;
    role: string;
};

interface GlobalContextType {
    loading: boolean;
    user: User | null;
    profile: Profile | null;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const supabase = await createSPASassClient();
                const client = supabase.getSupabaseClient();

                // Get user data
                const { data: { user } } = await client.auth.getUser();
                if (user) {
                    setUser({
                        email: user.email!,
                        id: user.id,
                        registered_at: new Date(user.created_at)
                    });

                    // Fetch profile using raw query to bypass type checking
                    // TODO: Regenerate Supabase types to include profiles table
                    const { data: profileData } = await (client as unknown as { 
                        from: (table: string) => { 
                            select: (cols: string) => { 
                                eq: (col: string, val: string) => { 
                                    single: () => Promise<{ data: Profile | null }> 
                                } 
                            } 
                        } 
                    }).from('profiles')
                        .select('full_name, avatar_url, role')
                        .eq('id', user.id)
                        .single();

                    if (profileData) {
                        setProfile(profileData);
                    }
                } else {
                    throw new Error('User not found');
                }

            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    const contextValue = useMemo(() => ({ loading, user, profile }), [loading, user, profile]);

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