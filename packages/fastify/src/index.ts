import NodeClient, { type LogtoContext } from '@logto/node';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import { LogtoFastifyError } from './errors.js';
import FastifyStorage from './storage.js';
import type { LogtoFastifyConfig } from './types.js';

export type { LogtoFastifyConfig } from './types.js';

export type FastifyLogtoContext = LogtoContext & {
  accessTokenClaims?: string[];
};

const createNodeClient = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: FastifyRequest & { session?: any },
  reply: FastifyReply,
  config: LogtoFastifyConfig
) => {
  if (!request.session) {
    throw new LogtoFastifyError('session_not_configured');
  }
  const storage = new FastifyStorage(request);

  return new NodeClient(config, {
    storage,
    navigate: async (url) => {
      await reply.redirect(url);
    },
  });
};

const fastifyLogto: FastifyPluginAsync<LogtoFastifyConfig> = async (fastify, config) => {
  const prefix = config.authRoutesPrefix ?? 'logto';

  // Register Logto auth routes
  fastify.get(
    `/${prefix}/:action`,
    async (request: FastifyRequest<{ Params: { action: string } }>, reply: FastifyReply) => {
      const { action } = request.params;
      const nodeClient = createNodeClient(request, reply, config);
      switch (action) {
        case 'sign-in': {
          await nodeClient.signIn({
            ...config.signInOptions,
            redirectUri: `${config.baseUrl}/${prefix}/sign-in-callback`,
          });
          break;
        }

        case 'sign-up': {
          await nodeClient.signIn({
            ...config.signInOptions,
            redirectUri: `${config.baseUrl}/${prefix}/sign-in-callback`,
            firstScreen: 'register',
          });
          break;
        }

        case 'sign-in-callback': {
          if (request.raw.url) {
            await nodeClient.handleSignInCallback(`${config.baseUrl}${request.raw.url}`);
            return reply.redirect(config.baseUrl);
          }
          break;
        }

        case 'sign-out': {
          await nodeClient.signOut(config.baseUrl);
          break;
        }

        default: {
          return reply.status(404).send();
        }
      }
    }
  );

  fastify.decorateRequest('user');

  // Add user context hook
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const client = createNodeClient(request, reply, config);
      const user = await client.getContext({
        getAccessToken: config.getAccessToken,
        resource: config.resource,
        fetchUserInfo: config.fetchUserInfo,
        getOrganizationToken: config.getOrganizationToken,
      });

      if (await client.isAuthenticated()) {
        const at = await client.getAccessTokenClaims('http://test.test');
        // eslint-disable-next-line @silverhand/fp/no-mutation
        request.user = { ...user, accessTokenClaims: at.scope?.split(' ') };
      } else {
        // eslint-disable-next-line @silverhand/fp/no-mutation
        request.user = { ...user };
      }
    } catch {
      // If auth fails or is missing, we skip attaching user
      // Log or handle as needed
    }
  });
};

export default fp(fastifyLogto, {
  name: 'fastify-logto',
});

declare module 'fastify' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FastifyRequest {
    user?: FastifyLogtoContext;
  }
}
