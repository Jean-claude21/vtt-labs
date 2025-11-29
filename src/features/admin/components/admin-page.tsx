"use client";

import React, { useEffect, useState, useTransition } from 'react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
    getAllProfiles,
    grantModuleAccess,
    revokeModuleAccess,
} from '@/features/shared/actions/profile.actions';
import { toast } from '@/lib/utils/toast';
import { MODULE_SLUGS, type ModuleSlug, type Profile } from '@/features/shared/schema/profile.schema';
import { 
    Users, 
    Shield, 
    ShieldAlert,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import { createSPASassClientAuthenticated as createSPASassClient } from '@/lib/supabase/client';

type UserWithModules = Profile & {
    modules: { module_slug: string; enabled: boolean }[];
};

export default function AdminPage() {
    const { isAdmin, loading: globalLoading } = useGlobal();
    const [users, setUsers] = useState<UserWithModules[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data: profiles, error } = await getAllProfiles();
            if (error || !profiles) {
                toast.error('Failed to load users', error ?? undefined);
                return;
            }

            // Fetch module access for each user
            const supabase = await createSPASassClient();
            const client = supabase.getSupabaseClient();

            const usersWithModules: UserWithModules[] = await Promise.all(
                profiles.map(async (profile) => {
                    const { data: modules } = await client
                        .from('user_module_access')
                        .select('module_slug, enabled')
                        .eq('user_id', profile.id);
                    
                    return {
                        ...profile,
                        modules: (modules ?? []) as { module_slug: string; enabled: boolean }[],
                    };
                })
            );

            setUsers(usersWithModules);
        } catch {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    const handleModuleToggle = (userId: string, moduleSlug: ModuleSlug, currentlyEnabled: boolean) => {
        startTransition(async () => {
            const action = currentlyEnabled ? revokeModuleAccess : grantModuleAccess;
            const result = await action(userId, moduleSlug);
            
            if (result.error) {
                toast.error(`Failed to ${currentlyEnabled ? 'revoke' : 'grant'} access`, result.error);
                return;
            }

            toast.success(`Module ${currentlyEnabled ? 'revoked' : 'granted'}`);
            
            // Update local state
            setUsers(prev => prev.map(user => {
                if (user.id !== userId) return user;
                
                const existingModule = user.modules.find(m => m.module_slug === moduleSlug);
                if (existingModule) {
                    return {
                        ...user,
                        modules: user.modules.map(m => 
                            m.module_slug === moduleSlug 
                                ? { ...m, enabled: !currentlyEnabled }
                                : m
                        ),
                    };
                } else {
                    return {
                        ...user,
                        modules: [...user.modules, { module_slug: moduleSlug, enabled: true }],
                    };
                }
            }));
        });
    };

    const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return email?.slice(0, 2).toUpperCase() ?? 'U';
    };

    if (globalLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <ShieldAlert className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900">Access Denied</h2>
                <p className="text-zinc-500 mt-1 max-w-sm">
                    You need administrator privileges to access this page.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                        <Shield className="h-6 w-6 text-red-500" />
                        Admin Panel
                    </h1>
                    <p className="text-zinc-500">
                        Manage users and module access
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchUsers}
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-zinc-100">
                                <Users className="h-5 w-5 text-zinc-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{users.length}</p>
                                <p className="text-sm text-zinc-500">Total Users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-red-100">
                                <Shield className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                                <p className="text-sm text-zinc-500">Admins</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-emerald-100">
                                <Users className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{users.filter(u => u.role === 'user').length}</p>
                                <p className="text-sm text-zinc-500">Regular Users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Users List */}
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>
                        Manage user access to modules
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">
                            No users found
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {users.map((user, idx) => (
                                <div key={user.id}>
                                    {idx > 0 && <Separator className="my-4" />}
                                    <div className="space-y-4">
                                        {/* User Info */}
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.avatar_url ?? undefined} />
                                                <AvatarFallback className="bg-zinc-100 text-zinc-600">
                                                    {getInitials(user.full_name, user.email)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium truncate">
                                                        {user.full_name ?? user.email?.split('@')[0]}
                                                    </p>
                                                    <Badge 
                                                        variant={user.role === 'admin' ? 'default' : 'secondary'}
                                                        className={user.role === 'admin' ? 'bg-red-500' : ''}
                                                    >
                                                        {user.role}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-zinc-500 truncate">{user.email}</p>
                                            </div>
                                        </div>

                                        {/* Module Access */}
                                        {user.role !== 'admin' && (
                                            <div className="pl-13 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                {MODULE_SLUGS.filter(s => s !== 'core').map((slug) => {
                                                    const moduleAccess = user.modules.find(m => m.module_slug === slug);
                                                    const isEnabled = moduleAccess?.enabled ?? false;

                                                    return (
                                                        <div 
                                                            key={slug}
                                                            className="flex items-center justify-between p-2 rounded-lg border bg-zinc-50/50"
                                                        >
                                                            <span className="text-sm capitalize">{slug.replace('-', ' ')}</span>
                                                            <Switch
                                                                checked={isEnabled}
                                                                disabled={isPending}
                                                                onCheckedChange={() => handleModuleToggle(user.id, slug, isEnabled)}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {user.role === 'admin' && (
                                            <p className="text-sm text-zinc-400 pl-13">
                                                Admins have access to all modules
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
