import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSPASassClient } from '@/lib/supabase/client';
import { CheckCircle, Smartphone } from 'lucide-react';
import { Factor } from '@supabase/auth-js';

interface MFAVerificationProps {
    onVerified: () => void;
}

export function MFAVerification({ onVerified }: MFAVerificationProps) {
    const [verifyCode, setVerifyCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [factors, setFactors] = useState<Factor[]>([]);
    const [selectedFactorId, setSelectedFactorId] = useState<string>('');
    const [loadingFactors, setLoadingFactors] = useState(true);

    useEffect(() => {
        loadFactors();
    }, []);

    const loadFactors = async () => {
        try {
            const supabase = await createSPASassClient();
            const { data, error } = await supabase.getSupabaseClient().auth.mfa.listFactors();

            if (error) throw error;

            const totpFactors = data.totp || [];
            setFactors(totpFactors);
            console.log('totpFactors:', totpFactors);

            // If there's only one factor, select it automatically
            if (totpFactors.length === 1) {
                setSelectedFactorId(totpFactors[0].id);
            }
        } catch (err) {
            console.error('Error loading MFA factors:', err);
            setError('Failed to load authentication devices');
        } finally {
            setLoadingFactors(false);
        }
    };

    const handleVerification = async () => {
        if (!selectedFactorId) {
            setError('Please select an authentication device');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const supabase = await createSPASassClient();
            const client = supabase.getSupabaseClient();

            // Create challenge
            const { data: challengeData, error: challengeError } = await client.auth.mfa.challenge({
                factorId: selectedFactorId
            });

            if (challengeError) throw challengeError;

            // Verify the challenge
            const { error: verifyError } = await client.auth.mfa.verify({
                factorId: selectedFactorId,
                challengeId: challengeData.id,
                code: verifyCode
            });

            if (verifyError) throw verifyError;

            onVerified();
        } catch (err) {
            console.error('MFA verification error:', err);
            setError(err instanceof Error ? err.message : 'Failed to verify MFA code');
        } finally {
            setLoading(false);
        }
    };

    if (loadingFactors) {
        return (
            <Card className="w-full">
                <CardContent className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </CardContent>
            </Card>
        );
    }

    if (factors.length === 0) {
        return (
            <Card className="w-full">
                <CardContent className="py-8">
                    <Alert variant="destructive">
                        <AlertDescription>
                            No authentication devices found. Please contact support.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Two-Factor Authentication Required</CardTitle>
                <CardDescription>
                    Please enter the verification code from your authenticator app
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    {factors.length > 1 && (
                        <div className="space-y-2">
                            <Label>Select Authentication Device</Label>
                            <div className="grid gap-3">
                                {factors.map((factor) => (
                                    <button
                                        key={factor.id}
                                        onClick={() => setSelectedFactorId(factor.id)}
                                        className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                                            selectedFactorId === factor.id
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border hover:border-primary/50 hover:bg-muted'
                                        }`}
                                    >
                                        <Smartphone className="h-5 w-5" />
                                        <div className="flex-1 text-left">
                                            <p className="font-medium">
                                                {factor.friendly_name || 'Authenticator Device'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Added on {new Date(factor.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {selectedFactorId === factor.id && (
                                            <CheckCircle className="h-5 w-5 text-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="verify-code">Verification Code</Label>
                        <Input
                            id="verify-code"
                            type="text"
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value.trim())}
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                        />
                        <p className="text-sm text-muted-foreground">
                            Enter the 6-digit code from your authenticator app
                        </p>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleVerification}
                        disabled={loading || verifyCode.length !== 6 || !selectedFactorId}
                    >
                        {loading ? 'Verifying...' : 'Verify'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}