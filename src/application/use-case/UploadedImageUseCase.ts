import { minioClient } from '#configs/minioConfig.js';
import { GenerateImageThumbnail } from '#infrastructure/events/generateImageThumbnail.js';
import { AssetMessage } from '#infrastructure/messaging/types/asset.js';

export class UploadedImageUseCase {
  async execute(asset: AssetMessage): Promise<void> {
    const stream = await minioClient.getObject(asset.bucket, asset.objectKey);

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as ArrayBuffer));
    }
    const buffer = Buffer.concat(chunks);

    await new GenerateImageThumbnail(asset, buffer).generate();
  }
}
