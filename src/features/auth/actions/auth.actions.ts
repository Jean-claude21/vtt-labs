'use server';

/**
 * Auth Module - Server Actions
 * 
 * Server-side entry points for authentication operations.
 * Validates input with Zod, delegates to service, returns standardized result.
 */

import { createServerSassClient } from '@/lib/supabase/server';
import { authService, type ActionResult } from '../services';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  mfaVerifySchema,
  verifyEmailSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type MFAVerifyInput,
  type VerifyEmailInput,
} from '../schema';

// ============================================================================
// Login Action
// ============================================================================

export async function loginAction(
  input: LoginInput
): Promise<ActionResult<{ success: boolean; requiresMFA: boolean }>> {
  // 1. Validate input
  const validated = loginSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.errors[0]?.message || 'Invalid input' };
  }

  // 2. Get client and call service
  const sassClient = await createServerSassClient();
  const client = sassClient.getSupabaseClient();
  const result = await authService.login(client, validated.data);

  // 3. Return standardized result
  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: {
      success: true,
      requiresMFA: result.data?.mfaStatus?.requiresMFA || false,
    },
    error: null,
  };
}

// ============================================================================
// Register Action
// ============================================================================

export async function registerAction(
  input: RegisterInput
): Promise<ActionResult<{ success: boolean }>> {
  // 1. Validate input
  const validated = registerSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.errors[0]?.message || 'Invalid input' };
  }

  // 2. Get client and call service
  const sassClient = await createServerSassClient();
  const client = sassClient.getSupabaseClient();
  const result = await authService.register(client, validated.data);

  // 3. Return standardized result
  return result;
}

// ============================================================================
// Forgot Password Action
// ============================================================================

export async function forgotPasswordAction(
  input: ForgotPasswordInput
): Promise<ActionResult<{ success: boolean }>> {
  // 1. Validate input
  const validated = forgotPasswordSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.errors[0]?.message || 'Invalid input' };
  }

  // 2. Get client and call service
  const sassClient = await createServerSassClient();
  const client = sassClient.getSupabaseClient();
  
  // Build redirect URL for password reset
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`;
  
  const result = await authService.forgotPassword(client, validated.data, redirectTo);

  // 3. Return standardized result
  return result;
}

// ============================================================================
// Reset Password Action
// ============================================================================

export async function resetPasswordAction(
  input: ResetPasswordInput
): Promise<ActionResult<{ success: boolean }>> {
  // 1. Validate input
  const validated = resetPasswordSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.errors[0]?.message || 'Invalid input' };
  }

  // 2. Get client and call service
  const sassClient = await createServerSassClient();
  const client = sassClient.getSupabaseClient();
  const result = await authService.resetPassword(client, validated.data);

  // 3. Return standardized result
  return result;
}

// ============================================================================
// MFA Verify Action
// ============================================================================

export async function verifyMFAAction(
  input: MFAVerifyInput
): Promise<ActionResult<{ success: boolean }>> {
  // 1. Validate input
  const validated = mfaVerifySchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.errors[0]?.message || 'Invalid input' };
  }

  // 2. Get client and call service
  const sassClient = await createServerSassClient();
  const client = sassClient.getSupabaseClient();
  const result = await authService.verifyMFA(client, validated.data);

  // 3. Return standardized result
  return result;
}

// ============================================================================
// Resend Verification Email Action
// ============================================================================

export async function resendVerificationEmailAction(
  input: VerifyEmailInput
): Promise<ActionResult<{ success: boolean }>> {
  // 1. Validate input
  const validated = verifyEmailSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.errors[0]?.message || 'Invalid input' };
  }

  // 2. Get client and call service
  const sassClient = await createServerSassClient();
  const client = sassClient.getSupabaseClient();
  const result = await authService.resendVerificationEmail(client, validated.data.email);

  // 3. Return standardized result
  return result;
}

// ============================================================================
// Logout Action
// ============================================================================

export async function logoutAction(): Promise<ActionResult<{ success: boolean }>> {
  const sassClient = await createServerSassClient();
  const client = sassClient.getSupabaseClient();
  return authService.logout(client);
}
