import { Readable } from 'stream';

import { ImageProcessor } from '#infrastructure/events/processImage.js';
import { AssetMessage } from '#infrastructure/messaging/types/asset.js';
import { MinioStorage } from '#infrastructure/storage/minioStorage.js';

export class UploadedImageUseCase {
  constructor(
    private storage: MinioStorage,
    private imageProcessor: ImageProcessor
  ) {}
  async execute(asset: AssetMessage): Promise<void> {
    const stream = await this.storage.downloadFile(asset.objectKey);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    const imageBuffer = Buffer.concat(chunks);
    const imageThumbnail = await this.imageProcessor.generate(imageBuffer, asset);
    const key = this.imageProcessor.thumbnailKey(asset.objectKey);
    await this.storage.uploadThumbnail(key, Readable.from([imageThumbnail]), 'image/jpeg');
  }
}
