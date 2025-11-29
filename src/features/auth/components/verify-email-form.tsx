'use client';

import { useState } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import { CheckCircle, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function VerifyEmailForm() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const resendVerificationEmail = async () => {
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const supabase = await createSPASassClient();
            const { error } = await supabase.resendVerificationEmail(email);
            if (error) {
                setError(error.message);
                return;
            }
            setSuccess(true);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Icon */}
            <div className="text-center space-y-4">
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Mail className="h-8 w-8 text-emerald-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-xl font-semibold tracking-tight">Check your email</h1>
                    <p className="text-sm text-muted-foreground">
                        We&apos;ve sent you an email with a verification link.
                        Please check your inbox and click the link to verify your account.
                    </p>
                </div>
            </div>

            {/* Resend Section */}
            <div className="space-y-4">
                <p className="text-sm text-center text-muted-foreground">
                    Didn&apos;t receive the email? Check your spam folder or enter your email to resend:
                </p>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Success Alert */}
                {success && (
                    <Alert className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>Verification email has been resent successfully.</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                    />
                </div>

                <Button
                    variant="outline"
                    className="w-full"
                    onClick={resendVerificationEmail}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        'Resend verification email'
                    )}
                </Button>
            </div>

            {/* Back to login */}
            <div className="text-center">
                <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                </Link>
            </div>
        </div>
    );
}
