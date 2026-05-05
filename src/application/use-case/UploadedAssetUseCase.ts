import { UploadedImageUseCase } from '#application/use-case/UploadedImageUseCase.js';
import { UploadedVideoUseCase } from '#application/use-case/UploadedVideoUseCase.js';
import { VideoProcessor } from '#infrastructure/events/processVideo.js';
import { logger } from '#infrastructure/logging/winstonLogger.js';
import { AssetMessage, detectAssetType } from '#infrastructure/messaging/types/asset.js';
import { MinioStorage } from '#infrastructure/storage/minioStorage.js';

export class UploadedAssetUseCase {
  constructor(
    private readonly storage: MinioStorage,
    private videoProcessor: VideoProcessor
  ) {}
  async execute(asset: AssetMessage): Promise<void> {
    const assetType = detectAssetType(asset.mimeType);

    switch (assetType) {
      case 'image':
        await new UploadedImageUseCase().execute(asset);
        break;
      case 'video':
        await new UploadedVideoUseCase(this.storage, this.videoProcessor).execute(asset);
        break;
      default:
        logger.warn(`[assetController] unsupported asset type for mime "${asset.mimeType}" (id: ${asset.objectKey})`);
    }
  }
}
