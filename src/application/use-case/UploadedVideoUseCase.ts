import { GenerateVideoThumbnail } from '#infrastructure/events/processVideo.js';
import { AssetMessage } from '#infrastructure/messaging/types/asset.js';
import { MinioStorage } from '#infrastructure/storage/minioStorage.js';

export class UploadedVideoUseCase {
  constructor(private storage: MinioStorage) {}
  async execute(asset: AssetMessage): Promise<void> {
    const stream = await this.storage.download(asset.objectKey);
    const videoProcessObj = new GenerateVideoThumbnail(asset, this.storage, stream);
    await videoProcessObj.generate();
  }
}
