/**
 * Auth Module - Services
 * 
 * Pure business logic for authentication operations.
 * No Next.js dependencies - testable in isolation.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types';
import type { 
  LoginInput, 
  RegisterInput, 
  ForgotPasswordInput, 
  ResetPasswordInput,
  MFAVerifyInput 
} from '../schema';

// ============================================================================
// Types
// ============================================================================

export type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

export type AuthClient = SupabaseClient<Database, 'public', 'public'>;

export type MFAStatus = {
  requiresMFA: boolean;
  currentLevel: string;
  nextLevel: string;
};

export type LoginResult = {
  success: boolean;
  mfaStatus?: MFAStatus;
};

// ============================================================================
// Auth Service
// ============================================================================

export const authService = {
  /**
   * Login with email and password
   */
  async login(
    client: AuthClient,
    input: LoginInput
  ): Promise<ActionResult<LoginResult>> {
    try {
      const { error: signInError } = await client.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (signInError) {
        return { data: null, error: signInError.message };
      }

      // Check MFA status
      const { data: mfaData, error: mfaError } = 
        await client.auth.mfa.getAuthenticatorAssuranceLevel();

      if (mfaError) {
        return { data: null, error: mfaError.message };
      }

      const requiresMFA = 
        mfaData.nextLevel === 'aal2' && 
        mfaData.nextLevel !== mfaData.currentLevel;

      return {
        data: {
          success: true,
          mfaStatus: {
            requiresMFA,
            currentLevel: mfaData.currentLevel,
            nextLevel: mfaData.nextLevel,
          },
        },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'An unknown error occurred',
      };
    }
  },

  /**
   * Register new user
   */
  async register(
    client: AuthClient,
    input: RegisterInput
  ): Promise<ActionResult<{ success: boolean }>> {
    try {
      const { error } = await client.auth.signUp({
        email: input.email,
        password: input.password,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: { success: true }, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'An unknown error occurred',
      };
    }
  },

  /**
   * Request password reset email
   */
  async forgotPassword(
    client: AuthClient,
    input: ForgotPasswordInput,
    redirectTo: string
  ): Promise<ActionResult<{ success: boolean }>> {
    try {
      const { error } = await client.auth.resetPasswordForEmail(input.email, {
        redirectTo,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: { success: true }, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'An unknown error occurred',
      };
    }
  },

  /**
   * Reset password with new password
   */
  async resetPassword(
    client: AuthClient,
    input: ResetPasswordInput
  ): Promise<ActionResult<{ success: boolean }>> {
    try {
      const { error } = await client.auth.updateUser({
        password: input.password,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: { success: true }, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'An unknown error occurred',
      };
    }
  },

  /**
   * Verify MFA code
   */
  async verifyMFA(
    client: AuthClient,
    input: MFAVerifyInput
  ): Promise<ActionResult<{ success: boolean }>> {
    try {
      const { error } = await client.auth.mfa.challengeAndVerify({
        factorId: input.factorId,
        code: input.code,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: { success: true }, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'An unknown error occurred',
      };
    }
  },

  /**
   * Resend verification email
   */
  async resendVerificationEmail(
    client: AuthClient,
    email: string
  ): Promise<ActionResult<{ success: boolean }>> {
    try {
      const { error } = await client.auth.resend({
        email,
        type: 'signup',
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: { success: true }, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'An unknown error occurred',
      };
    }
  },

  /**
   * Logout user
   */
  async logout(client: AuthClient): Promise<ActionResult<{ success: boolean }>> {
    try {
      const { error } = await client.auth.signOut({ scope: 'local' });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: { success: true }, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'An unknown error occurred',
      };
    }
  },

  /**
   * Get current session
   */
  async getSession(client: AuthClient) {
    return client.auth.getSession();
  },

  /**
   * Get current user
   */
  async getUser(client: AuthClient) {
    return client.auth.getUser();
  },

  /**
   * Get MFA factors
   */
  async getMFAFactors(client: AuthClient) {
    return client.auth.mfa.listFactors();
  },

  /**
   * Enroll MFA (TOTP)
   */
  async enrollMFA(
    client: AuthClient,
    friendlyName: string = 'Authenticator App'
  ) {
    return client.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName,
    });
  },

  /**
   * Unenroll MFA factor
   */
  async unenrollMFA(client: AuthClient, factorId: string) {
    return client.auth.mfa.unenroll({ factorId });
  },
};
