'use client';

import { useState } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { forgotPasswordSchema } from '@/features/auth/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        // Zod validation
        const validation = forgotPasswordSchema.safeParse({ email });
        if (!validation.success) {
            const errors: { email?: string } = {};
            for (const issue of validation.error.issues) {
                if (issue.path[0] === 'email') errors.email = issue.message;
            }
            setFieldErrors(errors);
            return;
        }

        setLoading(true);

        try {
            const supabase = await createSPASassClient();
            const { error } = await supabase.getSupabaseClient().auth.resetPasswordForEmail(email, {
                redirectTo: `${globalThis.location.origin}/auth/reset-password`,
            });

            if (error) throw error;

            setSuccess(true);
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
                        <h1 className="text-xl font-semibold tracking-tight">Check your email</h1>
                        <p className="text-sm text-muted-foreground">
                            We have sent a password reset link to your email address.
                            Please check your inbox and follow the instructions.
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <Link 
                        href="/auth/login" 
                        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        Back to login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2 text-center">
                <h1 className="text-xl font-semibold tracking-tight">Reset password</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email and we&apos;ll send you a reset link
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

                <Button type="submit" className="w-full mt-2" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        'Send reset link'
                    )}
                </Button>
            </form>

            {/* Back Link */}
            <div className="text-center pt-2">
                <Link 
                    href="/auth/login" 
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                </Link>
            </div>
        </div>
    );
}
