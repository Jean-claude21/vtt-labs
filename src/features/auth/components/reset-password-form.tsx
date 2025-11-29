'use client';

import { useState, useEffect } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import { resetPasswordSchema } from '@/features/auth/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ResetPasswordForm() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
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
        setFieldErrors({});

        // Zod validation
        const validation = resetPasswordSchema.safeParse({ newPassword, confirmPassword });
        if (!validation.success) {
            const errors: { newPassword?: string; confirmPassword?: string } = {};
            for (const issue of validation.error.issues) {
                if (issue.path[0] === 'newPassword') errors.newPassword = issue.message;
                if (issue.path[0] === 'confirmPassword') errors.confirmPassword = issue.message;
            }
            setFieldErrors(errors);
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
            <div className="space-y-8">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-xl font-semibold tracking-tight">Password reset successful</h1>
                        <p className="text-sm text-muted-foreground">
                            Your password has been successfully reset.
                            You will be redirected to the app in a moment.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2 text-center">
                <h1 className="text-xl font-semibold tracking-tight">Set new password</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your new password below
                </p>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <Input
                        id="newPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                    {fieldErrors.newPassword && (
                        <p className="text-xs text-destructive">{fieldErrors.newPassword}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                    {fieldErrors.confirmPassword && (
                        <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                    )}
                </div>

                <Button type="submit" className="w-full mt-2" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resetting...
                        </>
                    ) : (
                        'Reset password'
                    )}
                </Button>
            </form>
        </div>
    );
}
