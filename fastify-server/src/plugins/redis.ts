import fp from 'fastify-plugin';
import { redisService } from '../cache/redis.service';

export default fp(async (fastify) => {
  fastify.decorate('redis', redisService.client);

  fastify.addHook('onClose', async () => {
    fastify.log.info('Closing Redis connection...');
    await redisService.disconnect();
  });
});
