import { VideoRendition } from '#domain/entities/VideoRendition.js';
import { VideoProcessor } from '#infrastructure/events/processVideo.js';
import { AssetMessage } from '#infrastructure/messaging/types/asset.js';
import { MinioStorage } from '#infrastructure/storage/minioStorage.js';

export class UploadedVideoUseCase {
  static readonly RENDITIONS: VideoRendition[] = [new VideoRendition('128k', 23, 720, '720p'), new VideoRendition('192k', 21, 1080, '1080p')];

  constructor(
    private storage: MinioStorage,
    private videoProcessor: VideoProcessor
  ) {}

  async execute(asset: AssetMessage): Promise<void> {
    const inputStream = await this.storage.downloadFile(asset.objectKey);
    const thumbnailKey = this.videoProcessor.thumbnailKey(asset.objectKey);
    const { process, stream: outputStream } = this.videoProcessor.generateThumbnail(inputStream);
    const uploadPromise = this.storage.uploadThumbnail(thumbnailKey, outputStream, 'image/jpg');
    const ffmpegPromise = new Promise<void>((resolve, reject) => {
      process.on('error', reject);
      process.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg failed with code ${String(code)}`));
      });
    });
    await Promise.all([uploadPromise, ffmpegPromise]);

    await Promise.all(
      UploadedVideoUseCase.RENDITIONS.map(async (rendition) => {
        const inputStream = await this.storage.downloadFile(asset.objectKey);
        const outputKey = this.videoProcessor.transcodedKey(asset.objectKey, rendition.label);
        const { process, stream: outputStream } = this.videoProcessor.generateVideo(rendition, inputStream);

        const uploadPromise = this.storage.uploadVideo(outputKey, outputStream, 'video/mp4');

        const ffmpegPromise = new Promise<void>((resolve, reject) => {
          process.on('error', reject);
          process.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`FFmpeg failed with code ${String(code)}`));
          });
        });

        await Promise.all([uploadPromise, ffmpegPromise]);
      })
    );
  }
}
