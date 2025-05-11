import type { LogtoFastifyConfig } from '@albirex/fastify-logto';
import fastLogTo from '@albirex/fastify-logto';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import { UserScope } from '@logto/client';
import fastifyInst, { type FastifyReply, type FastifyRequest } from 'fastify';

const config: LogtoFastifyConfig = {
  appId: 'sqnvbeirwimb7nhgszvt2', // Replace with your own appId
  appSecret: 'u56xCb72xpIxvp0vIPLnYmM86AooCep4', // Replace with your own appSecret
  endpoint: 'http://localhost:3001',
  baseUrl: 'http://localhost:3000',
  resources: ['http://test.test'],
  scopes: [UserScope.Email, UserScope.Organizations, UserScope.Roles, 'test:test', 'read:test'],
};

// Const requireAuth = async (request: Request, response: Response, next: NextFunction) => {
//   if (!request.user.isAuthenticated) {
//     response.redirect('/logto/sign-in');
//   }

//   next();
// };

const app = fastifyInst();
// App.use(cookieParser());

// eslint-disable-next-line @typescript-eslint/no-floating-promises
app.register(cookie);
// eslint-disable-next-line @typescript-eslint/no-floating-promises
app.register(session, {
  secret: '8sAfP]M~c-6,$Ml{Ya11Vz?;Ez[Ig$}N',
  cookie: { secure: false },
});
// eslint-disable-next-line @typescript-eslint/no-floating-promises
app.register(fastLogTo, config);

// App.use(handleAuthRoutes(config));

app.get('/', async (request: FastifyRequest, response: FastifyReply) => {
  await response.header('content-type', 'text/html');
  return response.send(
    `<h1>Hello Logto</h1>
      <div><a href="/logto/sign-in">Sign In</a></div>
      <div><a href="/logto/sign-out">Sign Out</a></div>
      <div><a href="/local-user-claims">Profile</a></div>
      <div><a href="/protected">Protected Resource</a></div>
      <div><a href="/remote-full-user">Fetch user info</a></div>
      <div><a href="/fetch-access-token">Fetch access token</a></div>
      <div><a href="/fetch-organization-token">Fetch organization token</a></div>`
  );
});

app.get('/local-user-claims', (request: FastifyRequest, response: FastifyReply) => {
  return response.send(request.user);
});

app.get('/remote-full-user', (request: FastifyRequest, response: FastifyReply) => {
  return response.send(request.user);
});

app.get('/fetch-access-token', (request: FastifyRequest, response: FastifyReply) => {
  return response.send(request.user);
});

app.get('/fetch-organization-token', (request, response) => {
  return response.send(request.user);
});

// App.get('/protected', withLogto(config), requireAuth, (request, response) => {
//   response.end('protected resource');
// });

// eslint-disable-next-line @typescript-eslint/no-floating-promises
app.listen({
  port: 3000,
  host: '0.0.0.0',
});

app.addHook('onReady', () => {
  console.log('Server is running at http://localhost:3000');
});
