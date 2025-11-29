'use client';

import { useState } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const supabase = await createSPASassClient();
            const { error } = await supabase.getSupabaseClient().auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            if (error) throw error;

            setSuccess(true);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
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
                        Check your email
                    </h2>

                    <p className="text-muted-foreground mb-8">
                        We have sent a password reset link to your email address.
                        Please check your inbox and follow the instructions to reset your password.
                    </p>

                    <div className="text-center text-sm">
                        <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
                            Return to login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full shadow sm:rounded-lg">
            <CardHeader>
                <CardTitle className="text-center text-2xl font-bold">Reset your password</CardTitle>
                <CardDescription className="text-center">
                    Enter your email address and we will send you a link to reset your password.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Sending link...' : 'Send reset link'}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Link href="/auth/login" className="text-sm font-medium text-primary hover:text-primary/80">
                    Back to login
                </Link>
            </CardFooter>
        </Card>
    );
}
