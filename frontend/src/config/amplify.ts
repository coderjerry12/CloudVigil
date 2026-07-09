import { Amplify } from 'aws-amplify';

/**
 * Configure AWS Amplify with Cognito settings.
 * Values are read from environment variables (set in .env files).
 */
export function configureAmplify(): void {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
        signUpVerificationMethod: 'code',
      },
    },
  });
}
