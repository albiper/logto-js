import type { GetContextParameters, LogtoConfig, SignInOptions } from '@logto/node';

export type LogtoFastifyConfig = LogtoConfig & {
  baseUrl: string;
  authRoutesPrefix?: string;
  signInOptions?: Omit<SignInOptions, 'redirectUri' | 'postRedirectUri'>;
} & GetContextParameters;
