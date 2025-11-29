"use client";

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGlobal } from '@/lib/context/GlobalContext';
import { createSPASassClientAuthenticated as createSPASassClient } from '@/lib/supabase/client';
import { updateProfile } from '@/features/shared/actions/profile.actions';
import { toast } from '@/lib/utils/toast';
import { 
    User, 
    Key, 
    Shield, 
    Mail, 
    Calendar,
    Loader2,
    Check,
    Pencil,
} from 'lucide-react';
import { MFASetup } from '@/features/auth/components/mfa-setup';

export default function UserSettingsPage() {
    const { user, profile, isAdmin, refreshProfile } = useGlobal();
    const [isPending, startTransition] = useTransition();
    
    // Profile edit state
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [fullName, setFullName] = useState(profile?.full_name ?? '');
    
    // Password state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    const handleProfileSave = () => {
        startTransition(async () => {
            const result = await updateProfile({ full_name: fullName });
            if (result.error) {
                toast.error('Failed to update profile', result.error);
            } else {
                toast.success('Profile updated');
                setIsEditingProfile(false);
                await refreshProfile();
            }
        });
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setPasswordLoading(true);

        try {
            const supabase = await createSPASassClient();
            const client = supabase.getSupabaseClient();

            const { error } = await client.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            toast.success('Password updated successfully');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            toast.error('Failed to update password', err instanceof Error ? err.message : undefined);
        } finally {
            setPasswordLoading(false);
        }
    };

    const getInitials = (name: string | null | undefined, email: string | undefined) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return email?.slice(0, 2).toUpperCase() ?? 'U';
    };

    const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return 'Unknown';
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
                <p className="text-zinc-500">
                    Manage your account settings and security preferences
                </p>
            </div>

            {/* Profile Card */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={profile?.avatar_url ?? undefined} />
                                <AvatarFallback className="bg-red-100 text-red-700 text-lg font-medium">
                                    {getInitials(profile?.full_name, user?.email)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                {isEditingProfile ? (
                                    <Input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="h-8 w-48 font-semibold"
                                        placeholder="Your name"
                                        autoFocus
                                    />
                                ) : (
                                    <h2 className="text-xl font-semibold">
                                        {profile?.full_name ?? user?.email?.split('@')[0]}
                                    </h2>
                                )}
                                <div className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-zinc-400" />
                                    <span className="text-sm text-zinc-500">{user?.email}</span>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                    <Badge 
                                        variant={isAdmin ? "default" : "secondary"}
                                        className={isAdmin ? "bg-red-500 hover:bg-red-600" : ""}
                                    >
                                        {isAdmin ? 'Admin' : 'User'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div>
                            {isEditingProfile ? (
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => {
                                            setIsEditingProfile(false);
                                            setFullName(profile?.full_name ?? '');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        size="sm"
                                        onClick={handleProfileSave}
                                        disabled={isPending}
                                    >
                                        {isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="h-4 w-4" />
                                        )}
                                        Save
                                    </Button>
                                </div>
                            ) : (
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setIsEditingProfile(true)}
                                >
                                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                    Edit
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                            <p className="text-zinc-500">User ID</p>
                            <p className="font-mono text-xs text-zinc-700 truncate">{user?.id}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-zinc-500">Member since</p>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                                <p className="text-zinc-700">{formatDate(user?.registered_at)}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Security Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-zinc-700" />
                    <h2 className="text-lg font-semibold">Security</h2>
                </div>

                {/* Password Change */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Key className="h-4 w-4" />
                            Password
                        </CardTitle>
                        <CardDescription>
                            Change your password to keep your account secure
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={8}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm Password</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={8}
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={passwordLoading || !newPassword || !confirmPassword}
                                className="mt-2"
                            >
                                {passwordLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Update Password
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* MFA Setup */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-4 w-4" />
                            Two-Factor Authentication
                        </CardTitle>
                        <CardDescription>
                            Add an extra layer of security to your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MFASetup />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
