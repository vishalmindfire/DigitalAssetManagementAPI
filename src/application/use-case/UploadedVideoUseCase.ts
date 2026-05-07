import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

import { File } from '#domain/entities/File.js';
import { FileId } from '#domain/value-objects/FileId.js';
import { FileStatus } from '#domain/value-objects/FileStatus.js';
import { VideoRendition } from '#domain/entities/VideoRendition.js';
import { VideoProcessor } from '#infrastructure/events/processVideo.js';
import { AssetMessage } from '#infrastructure/messaging/types/asset.js';
import { FileStorage } from '#domain/repositories/fileStorage.js';
import { FileRepository } from '#domain/repositories/fileRepository.js';
import { FileTagRepository } from '#domain/repositories/fileTagRepository.js';

export class UploadedVideoUseCase {
  static readonly RENDITIONS: VideoRendition[] = [new VideoRendition('128k', 23, 720, '720p'), new VideoRendition('192k', 21, 1080, '1080p')];

  constructor(
    private storage: FileStorage,
    private fileRepo: FileRepository,
    private fileTagRepo: FileTagRepository,
    private videoProcessor: VideoProcessor
  ) {}

  async execute(asset: AssetMessage): Promise<void> {
    const fileId = new FileId(uuidv4());

    const fileDetail = await this.fileRepo.findByObjectKey(this.storage.getFilesBucket(), asset.objectKey);
    if (fileDetail !== null) {
      const inputStream = await this.storage.downloadFile(asset.objectKey);

      const chunks: Buffer[] = [];
      for await (const chunk of inputStream) {
        chunks.push(chunk as Buffer);
      }
      const videoBuffer = Buffer.concat(chunks);

      const thumbnailKey = this.videoProcessor.thumbnailKey(asset.objectKey);
      const thumbnailFile: File = new File(
        fileId,
        fileDetail.id,
        null,
        null,
        this.storage.getThumbnailsBucket(),
        thumbnailKey,
        0,
        FileStatus.PENDING,
        new Date(),
        null
      );
      await this.fileRepo.save(thumbnailFile);
      const tags = thumbnailFile.generateFileTags();

      await Promise.all(
        tags.map(async (tag: string) => {
          await this.fileTagRepo.saveTag(tag, thumbnailFile.getId());
        })
      );
      const { process: thumbProcess, stream: thumbStream } = this.videoProcessor.generateThumbnail(Readable.from([videoBuffer]));

      const thumbnailOps = Promise.all([
        this.storage.uploadThumbnail(thumbnailKey, thumbStream, 'image/jpeg'),
        new Promise<void>((resolve, reject) => {
          thumbProcess.on('error', reject);
          thumbProcess.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`FFmpeg thumbnail failed with code ${String(code)}`));
          });
        }),
      ]);

      const renditionOps = Promise.all(
        UploadedVideoUseCase.RENDITIONS.map(async (rendition) => {
          const fileId = new FileId(uuidv4());
          const outputKey = this.videoProcessor.transcodedKey(asset.objectKey, rendition.label);
          const videoFile: File = new File(
            fileId,
            fileDetail.id,
            null,
            null,
            this.storage.getVideosBucket(),
            outputKey,
            0,
            FileStatus.PENDING,
            new Date(),
            null
          );
          await this.fileRepo.save(videoFile);
          const tags = videoFile.generateFileTags();

          await Promise.all(
            tags.map(async (tag: string) => {
              await this.fileTagRepo.saveTag(tag, videoFile.getId());
            })
          );
          const { process, stream: outputStream } = this.videoProcessor.generateVideo(rendition, Readable.from([videoBuffer]));

          await Promise.all([
            this.storage.uploadVideo(outputKey, outputStream, 'video/mp4'),
            new Promise<void>((resolve, reject) => {
              process.on('error', reject);
              process.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg failed with code ${String(code)}`));
              });
            }),
          ]);
        })
      );

      await Promise.all([thumbnailOps, renditionOps]);
    }
  }
}
