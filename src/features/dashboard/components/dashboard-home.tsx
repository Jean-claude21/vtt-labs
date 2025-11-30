"use client";

import React from 'react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
    Settings, 
    Zap,
    Shield,
    ChevronRight,
    Sparkles,
    Clock,
    LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';

// Module definitions with colors from constitution
const AVAILABLE_MODULES = [
    { slug: 'tasks', name: 'Tasks', icon: '✓', color: 'bg-blue-500', description: 'Manage your to-do list' },
    { slug: 'okr', name: 'OKR', icon: '🎯', color: 'bg-orange-500', description: 'Objectives & Key Results' },
    { slug: 'finance', name: 'Finance', icon: '💰', color: 'bg-emerald-500', description: 'Track expenses & budgets' },
    { slug: 'ai-agents', name: 'AI Agents', icon: '🤖', color: 'bg-violet-500', description: 'Your AI assistants' },
    { slug: 'notes', name: 'Notes', icon: '📝', color: 'bg-indigo-500', description: 'Capture your thoughts' },
    { slug: 'health', name: 'Health', icon: '❤️', color: 'bg-pink-500', description: 'Wellness tracking' },
] as const;

export default function DashboardHome() {
    const { loading, user, profile, moduleAccess, isAdmin } = useGlobal();

    // Debug log
    console.log('Dashboard - moduleAccess:', moduleAccess);
    console.log('Dashboard - isAdmin:', isAdmin);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-200 border-t-red-500" />
                    <p className="text-sm text-zinc-500">Loading...</p>
                </div>
            </div>
        );
    }

    const enabledModules = moduleAccess?.filter(m => m.enabled).map(m => m.module_slug) ?? [];
    const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'User';
    const greeting = getGreeting();

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-6">
            {/* Welcome Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{greeting}</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back, {displayName}
                </h1>
                <p className="text-zinc-500">
                    Here&apos;s your workspace overview
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-zinc-500">Active Modules</p>
                                <p className="text-3xl font-bold text-red-600">{enabledModules.length}</p>
                            </div>
                            <div className="p-3 rounded-full bg-red-100">
                                <LayoutGrid className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-zinc-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-zinc-500">Account Type</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={isAdmin ? "default" : "secondary"} className={isAdmin ? "bg-red-500" : ""}>
                                        {isAdmin ? 'Admin' : 'User'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-zinc-100">
                                <Shield className="h-6 w-6 text-zinc-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-zinc-500">Status</p>
                                <p className="text-lg font-semibold text-emerald-600">All systems go</p>
                            </div>
                            <div className="p-3 rounded-full bg-emerald-100">
                                <Zap className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modules Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-zinc-700" />
                        <h2 className="text-lg font-semibold">Your Modules</h2>
                    </div>
                    {isAdmin && (
                        <Link 
                            href="/app/admin"
                            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                            Manage access
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {AVAILABLE_MODULES.map((module) => {
                        const hasAccess = isAdmin || enabledModules.includes(module.slug);
                        
                        return (
                            <Link
                                key={module.slug}
                                href={hasAccess ? `/app/${module.slug}` : '#'}
                                className={`group relative ${!hasAccess ? 'cursor-not-allowed' : ''}`}
                            >
                                <Card className={`transition-all ${
                                    hasAccess 
                                        ? 'hover:shadow-md hover:border-zinc-300' 
                                        : 'opacity-50'
                                }`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`${module.color} w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg`}>
                                                {module.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-zinc-900">{module.name}</h3>
                                                    {!hasAccess && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Locked
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-zinc-500 truncate">
                                                    {module.description}
                                                </p>
                                            </div>
                                            {hasAccess && (
                                                <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5 text-zinc-700" />
                    Quick Actions
                </h2>

                <div className="grid gap-3 sm:grid-cols-2">
                    <Link href="/app/user-settings">
                        <Card className="hover:shadow-md hover:border-zinc-300 transition-all cursor-pointer">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-lg bg-zinc-100">
                                        <Settings className="h-5 w-5 text-zinc-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Account Settings</h3>
                                        <p className="text-sm text-zinc-500">Manage your profile and security</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-zinc-300 ml-auto" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {isAdmin && (
                        <Link href="/app/admin">
                            <Card className="hover:shadow-md hover:border-red-200 transition-all cursor-pointer border-red-100 bg-red-50/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-lg bg-red-100">
                                            <Shield className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-red-900">Admin Panel</h3>
                                            <p className="text-sm text-red-600/70">Manage users and permissions</p>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-red-300 ml-auto" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}
