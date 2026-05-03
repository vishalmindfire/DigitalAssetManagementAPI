import { logger } from '#infrastructure/logging/winstonLogger.js';
import { startAssetConsumer } from '#infrastructure/messaging/rabbitmqAssetConsumer.js';

startAssetConsumer().catch((err: unknown) => {
  logger.error('[assetConsumer] failed to start:', { error: err });
  process.exit(1);
});
