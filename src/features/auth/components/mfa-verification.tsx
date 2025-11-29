'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSPASassClient } from '@/lib/supabase/client';
import { CheckCircle, Smartphone, Shield, Loader2 } from 'lucide-react';
import type { Factor } from '@supabase/supabase-js';

interface MFAVerificationProps {
    readonly onVerified: () => void;
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
            <div className="space-y-8">
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (factors.length === 0) {
        return (
            <div className="space-y-8">
                <Alert variant="destructive">
                    <AlertDescription>
                        No authentication devices found. Please contact support.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Shield className="h-8 w-8 text-foreground" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-xl font-semibold tracking-tight">Two-factor authentication</h1>
                    <p className="text-sm text-muted-foreground">
                        Enter the verification code from your authenticator app
                    </p>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Form */}
            <div className="space-y-5">
                {factors.length > 1 && (
                    <div className="space-y-2">
                        <Label>Select authentication device</Label>
                        <div className="grid gap-3">
                            {factors.map((factor) => (
                                <button
                                    key={factor.id}
                                    onClick={() => setSelectedFactorId(factor.id)}
                                    className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                                        selectedFactorId === factor.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
                                    }`}
                                >
                                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-sm">
                                            {factor.friendly_name || 'Authenticator device'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
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
                    <Label htmlFor="verify-code">Verification code</Label>
                    <Input
                        id="verify-code"
                        type="text"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.trim())}
                        placeholder="000000"
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                    />
                    <p className="text-xs text-muted-foreground">
                        Enter the 6-digit code from your authenticator app
                    </p>
                </div>

                <Button
                    className="w-full"
                    onClick={handleVerification}
                    disabled={loading || verifyCode.length !== 6 || !selectedFactorId}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        'Verify'
                    )}
                </Button>
            </div>
        </div>
    );
}