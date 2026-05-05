import { BUCKET, minioClient, THUMBNAIL_BUCKET, VIDEO_BUCKET } from '#configs/minioConfig.js';
import { GenerateImageThumbnail } from '#infrastructure/events/generateImageThumbnail.js';
import { AssetMessage } from '#infrastructure/messaging/types/asset.js';
import { MinioStorage } from '#infrastructure/storage/minioStorage.js';

export class UploadedImageUseCase {
  async execute(asset: AssetMessage): Promise<void> {
    const storage = new MinioStorage(minioClient, BUCKET, THUMBNAIL_BUCKET, VIDEO_BUCKET);
    const buffer = await storage.download(asset.objectKey);
    await new GenerateImageThumbnail(asset, storage, buffer).generate();
  }
}
