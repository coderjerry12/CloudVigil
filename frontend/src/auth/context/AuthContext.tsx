import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AuthState,
  AuthContextValue,
  SignInInput,
  SignUpInput,
  ConfirmSignUpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../types';
import { authService } from '../services/authService';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider manages the global authentication state.
 * Wraps the app to provide auth context to all child components.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // On mount, check if user already has a valid session
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const user = await authService.getCurrentUser();
      setState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
      });
    } catch {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  };

  const handleSignIn = useCallback(async (input: SignInInput) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await authService.signIn(input.email, input.password);
      const user = await authService.getCurrentUser();
      setState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed. Please try again.';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  const handleSignUp = useCallback(async (input: SignUpInput) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await authService.signUp(
        input.email,
        input.password,
        input.name,
        input.role
      );
      setState(prev => ({ ...prev, isLoading: false }));
      return { requiresConfirmation: !result.isSignUpComplete };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed. Please try again.';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  const handleConfirmSignUp = useCallback(async (input: ConfirmSignUpInput) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await authService.confirmSignUp(input.email, input.code);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed. Please try again.';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authService.signOut();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign out failed.';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  const handleForgotPassword = useCallback(async (input: ForgotPasswordInput) => {
    setState(prev => ({ ...prev, error: null }));
    try {
      await authService.forgotPassword(input.email);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Request failed. Please try again.';
      setState(prev => ({ ...prev, error: message }));
      throw err;
    }
  }, []);

  const handleResetPassword = useCallback(async (input: ResetPasswordInput) => {
    setState(prev => ({ ...prev, error: null }));
    try {
      await authService.confirmResetPassword(input.email, input.code, input.newPassword);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Password reset failed. Please try again.';
      setState(prev => ({ ...prev, error: message }));
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn: handleSignIn,
      signUp: handleSignUp,
      confirmSignUp: handleConfirmSignUp,
      signOut: handleSignOut,
      forgotPassword: handleForgotPassword,
      resetPassword: handleResetPassword,
      clearError,
    }),
    [
      state,
      handleSignIn,
      handleSignUp,
      handleConfirmSignUp,
      handleSignOut,
      handleForgotPassword,
      handleResetPassword,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
