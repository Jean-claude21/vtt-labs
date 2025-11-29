'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';
import { registerSchema } from '@/features/auth/schema';
import SSOButtons from '@/features/auth/components/sso-buttons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RegisterForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
    const [loading, setLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        // Validate terms acceptance
        if (!acceptedTerms) {
            setError('You must accept the Terms of Service and Privacy Policy');
            return;
        }

        // Zod validation
        const validation = registerSchema.safeParse({ email, password, confirmPassword });
        if (!validation.success) {
            const errors: { email?: string; password?: string; confirmPassword?: string } = {};
            for (const issue of validation.error.issues) {
                if (issue.path[0] === 'email') errors.email = issue.message;
                if (issue.path[0] === 'password') errors.password = issue.message;
                if (issue.path[0] === 'confirmPassword') errors.confirmPassword = issue.message;
            }
            setFieldErrors(errors);
            return;
        }

        setLoading(true);

        try {
            const supabase = await createSPASassClient();
            const { error } = await supabase.registerEmail(email, password);

            if (error) throw error;

            router.push('/auth/verify-email');
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2 text-center">
                <h1 className="text-xl font-semibold tracking-tight">Create account</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your details to create your account
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
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                    {fieldErrors.password && (
                        <p className="text-xs text-destructive">{fieldErrors.password}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
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

                <div className="flex items-start space-x-3 pt-2">
                    <Checkbox
                        id="terms"
                        checked={acceptedTerms}
                        onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                        className="mt-0.5"
                    />
                    <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground leading-relaxed cursor-pointer">
                        I agree to the{' '}
                        <Link
                            href="/legal/terms"
                            className="text-primary hover:underline"
                            target="_blank"
                        >
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link
                            href="/legal/privacy"
                            className="text-primary hover:underline"
                            target="_blank"
                        >
                            Privacy Policy
                        </Link>
                    </Label>
                </div>

                <Button type="submit" className="w-full mt-2" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        'Create account'
                    )}
                </Button>
            </form>

            {/* SSO */}
            <SSOButtons onError={setError} />

            {/* Login Link */}
            <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
