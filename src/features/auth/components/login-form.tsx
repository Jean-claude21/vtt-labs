'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';
import { loginSchema } from '@/features/auth/schema';
import SSOButtons from '@/features/auth/components/sso-buttons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
    const [loading, setLoading] = useState(false);
    const [showMFAPrompt, setShowMFAPrompt] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        // Validation Zod
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
            const errors: { email?: string; password?: string } = {};
            for (const issue of validation.error.issues) {
                if (issue.path[0] === 'email') errors.email = issue.message;
                if (issue.path[0] === 'password') errors.password = issue.message;
            }
            setFieldErrors(errors);
            return;
        }

        setLoading(true);

        try {
            const client = await createSPASassClient();
            const { error: signInError } = await client.loginEmail(email, password);

            if (signInError) throw signInError;

            // Check if MFA is required
            const supabase = client.getSupabaseClient();
            const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

            if (mfaError) throw mfaError;

            if (mfaData.nextLevel === 'aal2' && mfaData.nextLevel !== mfaData.currentLevel) {
                setShowMFAPrompt(true);
            } else {
                router.push('/app');
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (showMFAPrompt) {
            router.push('/auth/2fa');
        }
    }, [showMFAPrompt, router]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2 text-center">
                <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your credentials to access your account
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
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                    />
                    {fieldErrors.email && (
                        <p className="text-xs text-destructive">{fieldErrors.email}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                            href="/auth/forgot-password"
                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                    {fieldErrors.password && (
                        <p className="text-xs text-destructive">{fieldErrors.password}</p>
                    )}
                </div>

                <Button type="submit" className="w-full mt-2" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        'Sign in'
                    )}
                </Button>
            </form>

            {/* SSO */}
            <SSOButtons onError={setError} />

            {/* Register Link */}
            <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/auth/register" className="font-medium text-primary hover:text-primary/80 transition-colors">
                    Create account
                </Link>
            </p>
        </div>
    );
}
