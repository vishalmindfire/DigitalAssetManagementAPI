import type { AssetMessage } from '#infrastructure/messaging/types/asset.js';

import { UploadedAssetUseCase } from '#application/use-case/UploadedAssetUseCase.js';
import { BUCKET, minioClient, THUMBNAIL_BUCKET, VIDEO_BUCKET } from '#configs/minioConfig.js';
import { createRabbitMQChannel, QUEUE } from '#configs/rabbitmqConfig.js';
import { ImageProcessor } from '#infrastructure/events/processImage.js';
import { VideoProcessor } from '#infrastructure/events/processVideo.js';
import { pgPool } from '#configs/postgresConfig.js';
import { logger } from '#infrastructure/logging/winstonLogger.js';
import { PostgresFileRepository } from '#infrastructure/persistence/PostgresFileRepository.js';
import { MinioStorage } from '#infrastructure/storage/minioStorage.js';
import { PostgresFileTagsRepository } from '#infrastructure/persistence/PostgresFileTags.js';

export async function startAssetConsumer(): Promise<void> {
  const { channel, connection } = await createRabbitMQChannel();

  const minioStorage = new MinioStorage(minioClient, BUCKET, THUMBNAIL_BUCKET, VIDEO_BUCKET);
  const fileRepo = new PostgresFileRepository(pgPool);
  const fileTagRepo = new PostgresFileTagsRepository(pgPool);
  const videoProcessor = new VideoProcessor();
  const imageProcessor = new ImageProcessor();
  await channel.prefetch(1);

  await channel.consume(QUEUE, (msg) => {
    if (!msg) return;
    const handle = async () => {
      const asset = await parseAssetMessage(msg.content);
      await new UploadedAssetUseCase(minioStorage, fileRepo, fileTagRepo, videoProcessor, imageProcessor).execute(asset);
      channel.ack(msg);
    };

    void handle().catch((err: unknown) => {
      logger.error('[assetConsumer] failed to process message:', { Error: err });
      channel.nack(msg, false, false);
    });
  });

  logger.info(`[assetConsumer] consuming from queue "${QUEUE}"`);

  const shutdown = async () => {
    logger.info('[assetConsumer] shutting down...');
    try {
      await channel.close();
      await connection.close();
    } finally {
      process.exit(0);
    }
  };

  process.once('SIGINT', () => {
    void shutdown();
  });
  process.once('SIGTERM', () => {
    void shutdown();
  });
}

async function getFileMetadata(objectName: string): Promise<AssetMessage> {
  try {
    objectName = objectName.replace(`${BUCKET}/`, '');

    const stat = await minioClient.statObject(BUCKET, objectName);

    const fileData: AssetMessage = {
      bucket: BUCKET,
      filename: objectName.substring(objectName.lastIndexOf('/') + 1),
      mimeType: stat.metaData['content-type'] as string,
      objectKey: objectName,
      size: stat.size,
      uploadedAt: stat.lastModified,
    };

    return fileData;
  } catch (err) {
    logger.error('Error retrieving metadata:', { Error: err });
    throw err;
  }
}

async function parseAssetMessage(content: Buffer): Promise<AssetMessage> {
  const raw: unknown = JSON.parse(content.toString('utf8'));
  if (typeof raw !== 'object' || raw === null || !('Key' in raw) || !('EventName' in raw)) {
    throw new Error('Invalid asset message payload');
  }

  const data = await getFileMetadata(raw.Key as string);
  return data;
}
