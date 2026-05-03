import { UploadedImageUseCase } from '#application/use-case/UploadedImageUseCase.js';
import { logger } from '#infrastructure/logging/winstonLogger.js';
import { AssetMessage, detectAssetType } from '#infrastructure/messaging/types/asset.js';

export class UploadedAssetUseCase {
  async execute(asset: AssetMessage): Promise<void> {
    const assetType = detectAssetType(asset.mimeType);

    switch (assetType) {
      case 'image':
        await new UploadedImageUseCase().execute(asset);
        break;
      case 'video':
        logger.warn(`[assetController] video processing not yet implemented for mime "${asset.mimeType}"`);
        break;
      default:
        logger.warn(`[assetController] unsupported asset type for mime "${asset.mimeType}" (id: ${asset.objectKey})`);
    }
  }
}
