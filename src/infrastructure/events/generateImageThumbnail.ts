import sharp from 'sharp';

import { logger } from '#infrastructure/logging/winstonLogger.js';
import { AssetMessage } from '#infrastructure/messaging/types/asset.js';
import { MinioStorage } from '#infrastructure/storage/minioStorage.js';

export class GenerateImageThumbnail {
  static readonly THUMBNAIL_HEIGHT = 200;
  static readonly THUMBNAIL_QUALITY = 80;
  static readonly THUMBNAIL_WIDTH = 200;

  constructor(
    private asset: AssetMessage,
    private storage: MinioStorage,
    private imageBuffer: Buffer
  ) {}

  async generate(): Promise<void> {
    const thumbBuffer = await sharp(this.imageBuffer)
      .resize({
        fit: 'inside',
        height: GenerateImageThumbnail.THUMBNAIL_HEIGHT,
        width: GenerateImageThumbnail.THUMBNAIL_WIDTH,
        withoutEnlargement: true,
      })
      .jpeg({ quality: GenerateImageThumbnail.THUMBNAIL_QUALITY })
      .toBuffer();

    const key = this.thumbnailKey(this.asset.objectKey);
    await this.storage.uploadThumbnail(key, thumbBuffer, 'image/jpeg');

    logger.info(`[imageService] thumbnail uploaded → ${key}`);
  }

  thumbnailKey(objectKey: string): string {
    const withoutExt = objectKey.replace(/\.[^.]+$/, '');
    return `${withoutExt}.jpg`;
  }
}
