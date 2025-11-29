'use client';

import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from "react";
import { createSPASassClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
        } catch (err: Error | unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="w-full shadow sm:rounded-lg">
            <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-4">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                    Check your email
                </h2>

                <p className="text-muted-foreground mb-8">
                    We&#39;ve sent you an email with a verification link.
                    Please check your inbox and click the link to verify your account.
                </p>

                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Didn&#39;t receive the email? Check your spam folder or enter your email to resend:
                    </p>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="bg-green-50 text-green-600 border-green-200">
                            <AlertDescription>Verification email has been resent successfully.</AlertDescription>
                        </Alert>
                    )}

                    <div className="mt-4">
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                        />
                    </div>

                    <Button
                        variant="link"
                        className="text-primary hover:text-primary/80"
                        onClick={resendVerificationEmail}
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Click here to resend'}
                    </Button>
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                    <Link
                        href="/auth/login"
                        className="text-sm font-medium text-primary hover:text-primary/80"
                    >
                        Return to login
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
