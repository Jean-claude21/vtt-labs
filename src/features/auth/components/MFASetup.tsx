import React, { useState, useEffect } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import {Factor} from "@supabase/auth-js";
import { MFAEnrollTOTPParams } from '@supabase/auth-js';


interface MFASetupProps {
    onStatusChange?: () => void;
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
            <Card>
                <CardContent className="flex justify-center items-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Two-Factor Authentication (2FA)
                </CardTitle>
                <CardDescription>
                    Add an additional layer of security to your account
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {factors.length > 0 && step === 'list' && (
                    <div className="space-y-4">
                        {factors.map((factor) => (
                            <div key={factor.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    {factor.status === 'verified' ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    <div>
                                        <p className="font-medium">
                                            {factor.friendly_name || 'Authenticator App'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Added on {new Date(factor.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => unenrollFactor(factor.id)}
                                    disabled={actionInProgress}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {step === 'name' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="friendly-name">Device Name</Label>
                            <Input
                                id="friendly-name"
                                type="text"
                                value={friendlyName}
                                onChange={(e) => setFriendlyName(e.target.value)}
                                placeholder="e.g., Work Phone, Personal iPhone"
                                autoFocus
                            />
                            <p className="text-sm text-muted-foreground">
                                Give this authentication method a name to help you identify it later
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3">
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
                                {actionInProgress ? 'Processing...' : 'Continue'}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'enroll' && (
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            {qr && (
                                <img
                                    src={qr}
                                    alt="QR Code"
                                    className="w-48 h-48 border rounded-lg p-2"
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="verify-code">Verification Code</Label>
                            <Input
                                id="verify-code"
                                type="text"
                                value={verifyCode}
                                onChange={(e) => setVerifyCode(e.target.value.trim())}
                                placeholder="Enter code from your authenticator app"
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
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
                                {actionInProgress ? 'Verifying...' : 'Verify'}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'list' && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {factors.length === 0
                                ? 'Protect your account with two-factor authentication. When enabled, you\'ll need to enter a code from your authenticator app in addition to your password when signing in.'
                                : 'You can add additional authentication methods or remove existing ones.'}
                        </p>
                        <Button
                            className="w-full"
                            onClick={() => setStep('name')}
                            disabled={actionInProgress}
                        >
                            {actionInProgress ? 'Processing...' : 'Add New Authentication Method'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}