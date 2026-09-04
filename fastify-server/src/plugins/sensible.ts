import fp from 'fastify-plugin';
import fastifySensible, { SensibleOptions } from '@fastify/sensible';

export default fp<SensibleOptions>(async (fastify) => {
  await fastify.register(fastifySensible);
});

