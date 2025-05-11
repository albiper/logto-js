import cookie from '@fastify/cookie';
import session, { type FastifySessionOptions } from '@fastify/session';
import { PersistKey } from '@logto/node';
import fastifyInst, { type RouteHandlerMethod } from 'fastify';

import fastifyLogTo, { type LogtoFastifyConfig } from './index';
import FastifyStorage from './storage';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const actual = await vi.importActual<typeof import('@logto/node')>('@logto/node');

const DEFAULT_SECRET = 'cNaoPYAwF60HZJzkcNaoPYAwF60HZJzk';
const DEFAULT_OPTIONS = { secret: DEFAULT_SECRET };

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

async function buildFastify(
  handler: RouteHandlerMethod,
  sessionOptions: FastifySessionOptions,
  otherRoutes: Array<{
    method: string;
    url: string;
    handler: RouteHandlerMethod;
  }> = []
) {
  const fastify = fastifyInst({ trustProxy: true });
  await fastify.register(cookie);
  await fastify.register(fastifyLogTo, config);

  await fastify.register(session, sessionOptions);

  fastify.get('/', handler);

  for (const route of otherRoutes) {
    fastify.route({
      method: route.method,
      url: route.url,
      handler: route.handler,
    });
  }

  await fastify.listen({ port: 3000 });
  return fastify;
}

describe('FastifyStorage', async () => {
  describe('Basic functions', () => {
    // It('should not set session cookie on post without params'), async () => {
    // const response = await fastifyInstance.inject({
    //   method: 'POST',
    //   url: '/test',
    //   headers: { 'content-type': 'application/json' },
    // });

    // t.assert.strictEqual(response.statusCode, 400);
    // t.assert.ok(response.body.includes('FST_ERR_CTP_EMPTY_JSON_BODY'));
    // t.assert.strictEqual(response.headers['set-cookie'], undefined);

    it('should set and get item', async () => {
      const fastifyInstance = await buildFastify(async (request, reply) => {
        const fastStorage = new FastifyStorage(request);
        await fastStorage.setItem(PersistKey.IdToken, 'value');

        const sessionValue = await fastStorage.getItem(PersistKey.IdToken);

        if (!sessionValue) {
          return reply.status(500).send();
        }

        return reply.send(sessionValue);
      }, DEFAULT_OPTIONS);

      const response = await fastifyInstance.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('value');

      await fastifyInstance.close();
    });

    it('should remove item', async () => {
      const fastifyInstance = await buildFastify(async (request, reply) => {
        const fastStorage = new FastifyStorage(request);
        await fastStorage.setItem(PersistKey.IdToken, 'value');

        await fastStorage.removeItem(PersistKey.IdToken);
        const sessionValue = await fastStorage.getItem(PersistKey.IdToken);

        if (sessionValue) {
          return reply.status(500).send(sessionValue);
        }

        return reply.send();
      }, DEFAULT_OPTIONS);

      const response = await fastifyInstance.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('');

      await fastifyInstance.close();
    });

    it('should set and get item (signInSession)', async () => {
      const fastifyInstance = await buildFastify(async (request, reply) => {
        const fastStorage = new FastifyStorage(request);
        await fastStorage.setItem(PersistKey.SignInSession, 'value');

        const sessionValue = await fastStorage.getItem(PersistKey.SignInSession);

        if (!sessionValue) {
          return reply.status(500).send();
        }

        return reply.send(sessionValue);
      }, DEFAULT_OPTIONS);

      const response = await fastifyInstance.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('value');

      await fastifyInstance.close();
    });

    it('should remove item (signInSession)', async () => {
      const fastifyInstance = await buildFastify(async (request, reply) => {
        const fastStorage = new FastifyStorage(request);
        await fastStorage.setItem(PersistKey.SignInSession, 'value');

        await fastStorage.removeItem(PersistKey.SignInSession);
        const sessionValue = await fastStorage.getItem(PersistKey.IdToken);

        if (sessionValue) {
          return reply.status(500).send(sessionValue);
        }

        return reply.send();
      }, DEFAULT_OPTIONS);

      const response = await fastifyInstance.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('');

      await fastifyInstance.close();
    });
  });
});
