'use client';

import React, { useState, useEffect } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, CheckCircle, XCircle, Loader2, Smartphone, Plus } from 'lucide-react';
import type { Factor, MFAEnrollTOTPParams } from '@supabase/supabase-js';

interface MFASetupProps {
    readonly onStatusChange?: () => void;
}

export function MFASetup({ onStatusChange }: MFASetupProps) {
    const [factors, setFactors] = useState<Factor[]>([]);
    const [step, setStep] = useState<'list' | 'name' | 'enroll'>('list');
    const [factorId, setFactorId] = useState('');
    const [qr, setQR] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [friendlyName, setFriendlyName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionInProgress, setActionInProgress] = useState(false);

    const fetchFactors = async () => {
        try {
            const supabase = await createSPASassClient();
            const { data, error } = await supabase.getSupabaseClient().auth.mfa.listFactors();

            if (error) throw error;

            setFactors(data.all || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching MFA factors:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch MFA status');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFactors();
    }, []);

    const startEnrollment = async () => {
        if (!friendlyName.trim()) {
            setError('Please provide a name for this authentication method');
            return;
        }

        setError('');
        setActionInProgress(true);

        try {
            const supabase = await createSPASassClient();
            const enrollParams: MFAEnrollTOTPParams = {
                factorType: 'totp',
                friendlyName: friendlyName.trim()
            };

            const { data, error } = await supabase.getSupabaseClient().auth.mfa.enroll(enrollParams);

            if (error) throw error;

            setFactorId(data.id);
            setQR(data.totp.qr_code);
            setStep('enroll');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start MFA enrollment');
            setStep('name');
        } finally {
            setActionInProgress(false);
        }
    };

    const verifyFactor = async () => {
        setError('');
        setActionInProgress(true);

        try {
            const supabase = await createSPASassClient();
            const client = supabase.getSupabaseClient();

            const challenge = await client.auth.mfa.challenge({ factorId });
            if (challenge.error) throw challenge.error;

            const verify = await client.auth.mfa.verify({
                factorId,
                challengeId: challenge.data.id,
                code: verifyCode
            });
            if (verify.error) throw verify.error;

            await fetchFactors();
            resetEnrollment();
            onStatusChange?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify MFA code');
        } finally {
            setActionInProgress(false);
        }
    };

    const unenrollFactor = async (factorId: string) => {
        setError('');
        setActionInProgress(true);

        try {
            const supabase = await createSPASassClient();
            const { error } = await supabase.getSupabaseClient().auth.mfa.unenroll({ factorId });

            if (error) throw error;

            await fetchFactors();
            onStatusChange?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to unenroll MFA factor');
        } finally {
            setActionInProgress(false);
        }
    };

    const resetEnrollment = () => {
        setStep('list');
        setFactorId('');
        setQR('');
        setVerifyCode('');
        setFriendlyName('');
        setError('');
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Shield className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">Two-factor authentication</h2>
                        <p className="text-sm text-muted-foreground">
                            Add an additional layer of security to your account
                        </p>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Existing Factors List */}
            {factors.length > 0 && step === 'list' && (
                <div className="space-y-3">
                    {factors.map((factor) => (
                        <div
                            key={factor.id}
                            className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center border">
                                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm">
                                            {factor.friendly_name || 'Authenticator app'}
                                        </p>
                                        {factor.status === 'verified' ? (
                                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-destructive" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Added on {new Date(factor.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => unenrollFactor(factor.id)}
                                disabled={actionInProgress}
                            >
                                {actionInProgress ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Remove'
                                )}
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Name Step */}
            {step === 'name' && (
                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="friendly-name">Device name</Label>
                        <Input
                            id="friendly-name"
                            type="text"
                            value={friendlyName}
                            onChange={(e) => setFriendlyName(e.target.value)}
                            placeholder="e.g., Work Phone, Personal iPhone"
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground">
                            Give this authentication method a name to help you identify it later
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={resetEnrollment}
                            disabled={actionInProgress}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={startEnrollment}
                            disabled={actionInProgress || !friendlyName.trim()}
                        >
                            {actionInProgress ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Continue'
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Enroll Step */}
            {step === 'enroll' && (
                <div className="space-y-6">
                    <div className="text-center space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Scan this QR code with your authenticator app
                        </p>
                        {qr && (
                            <div className="flex justify-center">
                                <img
                                    src={qr}
                                    alt="QR Code"
                                    className="w-48 h-48 border rounded-lg p-2 bg-white"
                                />
                            </div>
                        )}
                    </div>

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
                            Enter the code from your authenticator app to verify setup
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={resetEnrollment}
                            disabled={actionInProgress}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={verifyFactor}
                            disabled={actionInProgress || verifyCode.length === 0}
                        >
                            {actionInProgress ? (
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
            )}

            {/* List Step - Add Button */}
            {step === 'list' && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {factors.length === 0
                            ? "Protect your account with two-factor authentication. When enabled, you'll need to enter a code from your authenticator app in addition to your password when signing in."
                            : 'You can add additional authentication methods or remove existing ones.'}
                    </p>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setStep('name')}
                        disabled={actionInProgress}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add authentication method
                    </Button>
                </div>
            )}
        </div>
    );
}