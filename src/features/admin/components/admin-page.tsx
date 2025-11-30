"use client";

import React, { useEffect, useState, useTransition } from 'react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    getAllProfiles,
    grantModuleAccess,
    revokeModuleAccess,
    updateUserRole,
    deleteUser,
    grantAllModules,
    revokeAllModules,
} from '@/features/shared/actions/profile.actions';
import { toast } from '@/lib/utils/toast';
import { MODULE_SLUGS, type ModuleSlug, type Profile } from '@/features/shared/schema/profile.schema';
import {
    Users,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Loader2,
    RefreshCw,
    MoreHorizontal,
    UserPlus,
    Trash2,
    Crown,
    UserMinus,
    Package,
    PackagePlus,
    PackageMinus,
    Search,
    Mail,
    Calendar,
} from 'lucide-react';
import { createSPASassClientAuthenticated as createSPASassClient } from '@/lib/supabase/client';

type UserWithModules = Profile & {
    modules: { module_slug: string; enabled: boolean }[];
};

// Module display config
const MODULE_CONFIG: Record<string, { label: string; color: string }> = {
    tasks: { label: 'Tasks', color: 'bg-blue-500' },
    okr: { label: 'OKR', color: 'bg-emerald-500' },
    finance: { label: 'Finance', color: 'bg-yellow-500' },
    'ai-agents': { label: 'AI Agents', color: 'bg-purple-500' },
    chat: { label: 'Chat', color: 'bg-pink-500' },
    health: { label: 'Health', color: 'bg-red-500' },
    notes: { label: 'Notes', color: 'bg-orange-500' },
    learning: { label: 'Learning', color: 'bg-cyan-500' },
};

export default function AdminPage() {
    const { isAdmin, loading: globalLoading, user } = useGlobal();
    const [users, setUsers] = useState<UserWithModules[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserWithModules | null>(null);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'user' | 'admin'>('user');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data: profiles, error } = await getAllProfiles();
            if (error || !profiles) {
                toast.error('Failed to load users', error ?? undefined);
                return;
            }

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

            toast.success(`${MODULE_CONFIG[moduleSlug]?.label ?? moduleSlug} ${currentlyEnabled ? 'disabled' : 'enabled'}`);
            updateUserModulesLocally(userId, moduleSlug, !currentlyEnabled);
        });
    };

    const updateUserModulesLocally = (userId: string, moduleSlug: string, enabled: boolean) => {
        setUsers(prev => prev.map(u => {
            if (u.id !== userId) return u;
            const existingModule = u.modules.find(m => m.module_slug === moduleSlug);
            if (existingModule) {
                return {
                    ...u,
                    modules: u.modules.map(m =>
                        m.module_slug === moduleSlug ? { ...m, enabled } : m
                    ),
                };
            }
            return {
                ...u,
                modules: [...u.modules, { module_slug: moduleSlug, enabled }],
            };
        }));
    };

    const handleRoleChange = (userId: string, newRole: 'admin' | 'user') => {
        startTransition(async () => {
            const result = await updateUserRole(userId, newRole);
            if (result.error) {
                toast.error('Failed to update role', result.error);
                return;
            }
            toast.success(`User is now ${newRole === 'admin' ? 'an admin' : 'a regular user'}`);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        });
    };

    const handleDeleteUser = () => {
        if (!userToDelete) return;
        startTransition(async () => {
            const result = await deleteUser(userToDelete.id);
            if (result.error) {
                toast.error('Failed to delete user', result.error);
                return;
            }
            toast.success('User deleted');
            setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        });
    };

    const handleGrantAllModules = (userId: string) => {
        startTransition(async () => {
            const result = await grantAllModules(userId);
            if (result.error) {
                toast.error('Failed to grant modules', result.error);
                return;
            }
            toast.success('All modules granted');
            fetchUsers();
        });
    };

    const handleRevokeAllModules = (userId: string) => {
        startTransition(async () => {
            const result = await revokeAllModules(userId);
            if (result.error) {
                toast.error('Failed to revoke modules', result.error);
                return;
            }
            toast.success('All modules revoked');
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, modules: [] } : u));
        });
    };

    const handleInvite = () => {
        toast.info('Invite feature', `Ask ${inviteEmail} to register. They will get role: ${inviteRole}`);
        setInviteDialogOpen(false);
        setInviteEmail('');
        setInviteRole('user');
    };

    const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return email?.slice(0, 2).toUpperCase() ?? 'U';
    };

    const formatDate = (date: string | null | undefined) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const filteredUsers = users.filter(u => {
        const q = searchQuery.toLowerCase();
        return (
            u.email?.toLowerCase().includes(q) ||
            u.full_name?.toLowerCase().includes(q)
        );
    });

    const admins = filteredUsers.filter(u => u.role === 'admin');
    const regularUsers = filteredUsers.filter(u => u.role === 'user');

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

    const UserCard = ({ u }: { u: UserWithModules }) => {
        const isCurrentUser = u.id === user?.id;
        const enabledModules = u.modules.filter(m => m.enabled);

        return (
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="h-11 w-11 shrink-0">
                                    <AvatarImage src={u.avatar_url ?? undefined} />
                                    <AvatarFallback className="bg-zinc-100 text-zinc-600 font-medium">
                                        {getInitials(u.full_name, u.email)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium truncate">
                                            {u.full_name ?? u.email?.split('@')[0]}
                                        </p>
                                        {isCurrentUser && (
                                            <Badge variant="outline" className="text-xs">You</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-zinc-500 truncate flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {u.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={u.role === 'admin' ? 'default' : 'secondary'}
                                    className={u.role === 'admin' ? 'bg-red-500 hover:bg-red-600' : ''}
                                >
                                    {u.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                                    {u.role}
                                </Badge>
                                {!isCurrentUser && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {u.role === 'user' ? (
                                                <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'admin')}>
                                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                                    Make Admin
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'user')}>
                                                    <UserMinus className="h-4 w-4 mr-2" />
                                                    Remove Admin
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleGrantAllModules(u.id)}>
                                                <PackagePlus className="h-4 w-4 mr-2" />
                                                Grant All Modules
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRevokeAllModules(u.id)}>
                                                <PackageMinus className="h-4 w-4 mr-2" />
                                                Revoke All Modules
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() => {
                                                    setUserToDelete(u);
                                                    setDeleteDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete User
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex items-center gap-4 text-xs text-zinc-400">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Joined {formatDate(u.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {u.role === 'admin' ? 'All modules' : `${enabledModules.length} modules`}
                            </span>
                        </div>

                        {/* Module Access (non-admins only) */}
                        {u.role !== 'admin' && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Module Access</p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {MODULE_SLUGS.filter(s => s !== 'core').map((slug) => {
                                            const moduleAccess = u.modules.find(m => m.module_slug === slug);
                                            const isEnabled = moduleAccess?.enabled ?? false;
                                            const config = MODULE_CONFIG[slug];

                                            return (
                                                <div
                                                    key={slug}
                                                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                                                        isEnabled ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-50/50 border-zinc-100'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${isEnabled ? config?.color : 'bg-zinc-300'}`} />
                                                        <span className={`text-sm ${isEnabled ? 'text-zinc-700' : 'text-zinc-400'}`}>
                                                            {config?.label ?? slug}
                                                        </span>
                                                    </div>
                                                    <Switch
                                                        checked={isEnabled}
                                                        disabled={isPending}
                                                        onCheckedChange={() => handleModuleToggle(u.id, slug, isEnabled)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}

                        {u.role === 'admin' && (
                            <>
                                <Separator />
                                <p className="text-sm text-zinc-400 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4" />
                                    Administrators have access to all modules
                                </p>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                        <Shield className="h-6 w-6 text-red-500" />
                        Admin Panel
                    </h1>
                    <p className="text-zinc-500">
                        Manage users, roles, and module access
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Invite User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Invite User</DialogTitle>
                                <DialogDescription>
                                    Send an invitation to a new user
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="invite-email">Email</Label>
                                    <Input
                                        id="invite-email"
                                        type="email"
                                        placeholder="user@example.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={inviteRole === 'user' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setInviteRole('user')}
                                        >
                                            User
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={inviteRole === 'admin' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setInviteRole('admin')}
                                            className={inviteRole === 'admin' ? 'bg-red-500 hover:bg-red-600' : ''}
                                        >
                                            Admin
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleInvite} disabled={!inviteEmail}>
                                    Send Invite
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
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
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-blue-100">
                                <Package className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{MODULE_SLUGS.filter(s => s !== 'core').length}</p>
                                <p className="text-sm text-zinc-500">Modules</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                    placeholder="Search users by name or email..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Users */}
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="all">All ({filteredUsers.length})</TabsTrigger>
                    <TabsTrigger value="admins">Admins ({admins.length})</TabsTrigger>
                    <TabsTrigger value="users">Users ({regularUsers.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-zinc-500">
                                No users found
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {filteredUsers.map((u) => (
                                <UserCard key={u.id} u={u} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="admins" className="mt-0">
                    {admins.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-zinc-500">
                                No admins found
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {admins.map((u) => (
                                <UserCard key={u.id} u={u} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="users" className="mt-0">
                    {regularUsers.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-zinc-500">
                                No regular users found
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {regularUsers.map((u) => (
                                <UserCard key={u.id} u={u} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{userToDelete?.full_name ?? userToDelete?.email}</strong>?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            className="bg-red-500 hover:bg-red-600"
                            disabled={isPending}
                        >
                            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
