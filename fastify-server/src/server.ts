import { buildApp } from './app';
import { env } from './config/env';
import { logger } from './observability/logger';

async function startServer(): Promise<void> {
  const app = buildApp();

  try {
    const address = await app.listen({ port: env.PORT, host: env.HOST });
    logger.info(`Server running and listening at ${address}`);
    logger.info(`OpenAPI Documentation available at ${address}/docs`);

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Initiating graceful shutdown...`);
      try {
        await app.close();
        logger.info('Server closed successfully.');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during graceful shutdown');
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    process.on('unhandledRejection', (reason) => {
      logger.fatal({ err: reason }, 'Unhandled Promise Rejection');
    });

    process.on('uncaughtException', (error) => {
      logger.fatal({ err: error }, 'Uncaught Exception');
      process.exit(1);
    });
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server bootstrap');
    process.exit(1);
  }
}

startServer();
