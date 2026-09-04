import fp from 'fastify-plugin';
import { prismaService } from '../database/prisma.service';

export default fp(async (fastify) => {
  fastify.decorate('prisma', prismaService);

  fastify.addHook('onClose', async () => {
    fastify.log.info('Closing Prisma connection...');
    await prismaService.disconnect();
  });
});
