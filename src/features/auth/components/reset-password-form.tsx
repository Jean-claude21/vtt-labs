'use client';

import { useState, useEffect } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { CheckCircle, Key } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetPasswordForm() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    // Check if we have a valid recovery session
    useEffect(() => {
        const checkSession = async () => {
            try {
                const supabase = await createSPASassClient();
                const { data: { user }, error } = await supabase.getSupabaseClient().auth.getUser();

                if (error || !user) {
                    setError('Invalid or expired reset link. Please request a new password reset.');
                }
            } catch {
                setError('Failed to verify reset session');
            }
        };

        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            const supabase = await createSPASassClient();
            const { error } = await supabase.getSupabaseClient().auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                router.push('/app');
            }, 3000);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to reset password');
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Card className="w-full shadow sm:rounded-lg">
                <CardContent className="pt-6 text-center">
                    <div className="flex justify-center mb-4">
                        <CheckCircle className="h-16 w-16 text-green-500" />
                    </div>

                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        Password reset successful
                    </h2>

                    <p className="text-muted-foreground mb-8">
                        Your password has been successfully reset.
                        You will be redirected to the app in a moment.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full shadow sm:rounded-lg">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <Key className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Resetting password...' : 'Reset password'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
