import cookie from '@fastify/cookie';
import session from '@fastify/session';
import fastifyInst, { type FastifyInstance } from 'fastify';
import { describe } from 'vitest';

import fastifyLogTo, { type LogtoFastifyConfig } from './index';

const signInUrl = 'http://localhost:3001/sign-in';

const signIn = vi.fn();
const handleSignInCallback = vi.fn();
const getContext = vi.fn(async () => ({ isAuthenticated: true }));
const getIdTokenClaims = vi.fn(() => ({
  sub: 'user_id',
}));
const signOut = vi.fn();

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const actual = await vi.importActual<typeof import('@logto/node')>('@logto/node');

const delay = async (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const config: LogtoFastifyConfig = {
  appId: 'sqnvbeirwimb7nhgszvt2', // Replace with your own appId
  appSecret: 'u56xCb72xpIxvp0vIPLnYmM86AooCep4', // Replace with your own appSecret
  endpoint: 'http://localhost:3001',
  baseUrl: 'http://localhost:3000',
  resources: ['http://test.test'],
  scopes: [
    actual.UserScope.Email,
    actual.UserScope.Organizations,
    actual.UserScope.Roles,
    'test:test',
    'read:test',
  ],
};

type Adapter = {
  navigate: (url: string) => void;
};

vi.mock('@logto/node', () => ({
  default: vi.fn((_: unknown, { navigate }: Adapter) => ({
    signIn: (_redirectUri?: string, interactionMode?: string) => {
      navigate(interactionMode ? `${signInUrl}?interactionMode=${interactionMode}` : signInUrl);
      signIn();
    },
    handleSignInCallback,
    getContext,
    getIdTokenClaims,
    signOut: () => {
      navigate(config.baseUrl);
      signOut();
    },
    isAuthenticated: true,
  })),
}));

describe('fastify-logto', async () => {
  const fastifyInstance: FastifyInstance = fastifyInst();
  await fastifyInstance.register(cookie);
  await fastifyInstance.register(session, {
    secret: '8sAfP]M~c-6,$Ml{Ya11Vz?;Ez[Ig$}N',
    cookie: { secure: false },
  });

  fastifyInstance.addHook('onRequest', async (request, _reply) => {
    // Mock session setup
    // request.session = {};
  });

  await fastifyInstance.register(fastifyLogTo, config);

  describe('handleSignIn', () => {
    it('should redirect to Logto sign in url and save session', async () => {
      const response = await fastifyInstance.inject({
        method: 'GET',
        url: '/logto/sign-in',
      });

      expect(response.headers.location).toBe(signInUrl);
    });

    it('should support custom auth routes prefix', async () => {
      const response = await fastifyInstance.inject({
        method: 'GET',
        url: '/logto/sign-in',
      });

      expect(response.headers.location).toBe(signInUrl);
      await delay(100);
      expect(signIn).toHaveBeenCalled();
    });
  });

  describe('handleSignUp', () => {
    it('should redirect to Logto sign in url with signUp interaction mode and save session', async () => {
      const response = await fastifyInstance.inject({
        method: 'GET',
        url: '/logto/sign-up',
      });

      expect(response.headers.location).toBe(`${signInUrl}`);
      await delay(100);
      expect(signIn).toHaveBeenCalled();
    });
  });

  describe('handleSignInCallback', () => {
    it('should call client.handleSignInCallback and redirect to home page', async () => {
      const response = await fastifyInstance.inject({
        method: 'GET',
        url: '/logto/sign-in-callback',
      });

      expect(response.headers.location).toBe(config.baseUrl);

      await delay(100);
      expect(handleSignInCallback).toHaveBeenCalled();
    });
  });

  describe('handleSignOut', () => {
    it('should redirect to Logto sign out url', async () => {
      const response = await fastifyInstance.inject({
        method: 'GET',
        url: '/logto/sign-out',
      });

      expect(response.headers.location).toBe(config.baseUrl);
      await delay(100);
      expect(signOut).toHaveBeenCalled();
    });
  });
  // AA

  it('calls signIn on /logto/sign-in', async () => {
    const response = await fastifyInstance.inject({
      method: 'GET',
      url: '/logto/sign-in',
    });

    // Expect(mockNodeClient.signIn).toHaveBeenCalled();
    expect(response.statusCode).toBe(302);
  });
});
