import fp from 'fastify-plugin';
import fastifyHelmet, { FastifyHelmetOptions } from '@fastify/helmet';

export default fp<FastifyHelmetOptions>(async (fastify) => {
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: false, // Set false for dev swagger UI compatibility if needed
  });
});
