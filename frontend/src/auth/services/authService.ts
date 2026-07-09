import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchUserAttributes,
  resendSignUpCode,
} from 'aws-amplify/auth';
import type { User, UserRole } from '../types';

/**
 * Authentication service layer.
 * Wraps AWS Amplify/Cognito SDK calls with typed interfaces.
 */
export const authService = {
  /**
   * Sign in with email and password.
   */
  async signIn(email: string, password: string) {
    const result = await signIn({
      username: email,
      password,
    });
    return result;
  },

  /**
   * Register a new user with role stored as Cognito custom attribute.
   */
  async signUp(email: string, password: string, name: string, role: string) {
    const result = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
          'custom:role': role,
        },
      },
    });
    return result;
  },

  /**
   * Confirm sign-up with the 6-digit verification code sent to email.
   */
  async confirmSignUp(email: string, code: string) {
    const result = await confirmSignUp({
      username: email,
      confirmationCode: code,
    });
    return result;
  },

  /**
   * Resend the sign-up confirmation code.
   */
  async resendConfirmationCode(email: string) {
    await resendSignUpCode({ username: email });
  },

  /**
   * Sign out the current user.
   */
  async signOut() {
    await signOut();
  },

  /**
   * Initiate forgot password flow — sends a reset code to email.
   */
  async forgotPassword(email: string) {
    const result = await resetPassword({ username: email });
    return result;
  },

  /**
   * Complete password reset with verification code and new password.
   */
  async confirmResetPassword(email: string, code: string, newPassword: string) {
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
  },

  /**
   * Get the currently authenticated user with attributes.
   * Returns null if no session exists.
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const cognitoUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      return {
        id: cognitoUser.userId,
        email: attributes.email || '',
        name: attributes.name || '',
        role: (attributes['custom:role'] as UserRole) || 'attendee',
        emailVerified: attributes.email_verified === 'true',
        createdAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  },
};
