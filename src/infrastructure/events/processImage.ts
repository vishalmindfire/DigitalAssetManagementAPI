import sharp from 'sharp';

import { logger } from '#infrastructure/logging/winstonLogger.js';
import { AssetMessage } from '#infrastructure/messaging/types/asset.js';

export class ImageProcessor {
  static readonly THUMBNAIL_HEIGHT = 200;
  static readonly THUMBNAIL_QUALITY = 80;
  static readonly THUMBNAIL_WIDTH = 200;

  async generate(image: Buffer, asset: AssetMessage): Promise<Buffer> {
    await sharp(image).metadata();

    const resized = await sharp(image)
      .resize({
        fit: 'inside',
        height: ImageProcessor.THUMBNAIL_HEIGHT,
        width: ImageProcessor.THUMBNAIL_WIDTH,
        withoutEnlargement: true,
      })
      .toBuffer();

    const thumbBuffer = await sharp(resized).jpeg({ quality: ImageProcessor.THUMBNAIL_QUALITY }).toBuffer();

    logger.info(`[imageService] thumbnail generated → ${asset.objectKey}`);
    return thumbBuffer;
  }

  public thumbnailKey(objectKey: string): string {
    const withoutExt = objectKey.replace(/\.[^.]+$/, '');
    return `${withoutExt}.jpg`;
  }
}
