import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

import { File } from '#domain/entities/File.js';
import { FileRepository } from '#domain/repositories/fileRepository.js';
import { FileTagRepository } from '#domain/repositories/fileTagRepository.js';
import { FileStorage } from '#domain/repositories/fileStorage.js';
import { FileId } from '#domain/value-objects/FileId.js';
import { FileStatus } from '#domain/value-objects/FileStatus.js';
import { ImageProcessor } from '#infrastructure/events/processImage.js';
import { AssetMessage } from '#infrastructure/messaging/types/asset.js';

export class UploadedImageUseCase {
  constructor(
    private storage: FileStorage,
    private fileRepo: FileRepository,
    private fileTagRepo: FileTagRepository,
    private imageProcessor: ImageProcessor
  ) {}
  async execute(asset: AssetMessage): Promise<void> {
    const fileId = new FileId(uuidv4());
    const key = this.imageProcessor.thumbnailKey(asset.objectKey);

    const fileDetail = await this.fileRepo.findByObjectKey(this.storage.getFilesBucket(), asset.objectKey);
    if (fileDetail !== null) {
      const file: File = new File(
        fileId,
        fileDetail.id,
        null,
        null,
        this.storage.getThumbnailsBucket(),
        key,
        0,
        FileStatus.PENDING,
        new Date(),
        null
      );
      const tags = file.generateFileTags();

      await Promise.all(
        tags.map(async (tag: string) => {
          await this.fileTagRepo.saveTag(tag, file.id);
        })
      );

      const stream = await this.storage.downloadFile(asset.objectKey);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk as Buffer);
      }
      const imageBuffer = Buffer.concat(chunks);

      await this.fileRepo.save(file);
      file.markProcessing();
      await this.fileRepo.save(file);
      const imageThumbnail = await this.imageProcessor.generate(imageBuffer, asset);
      await this.storage.uploadThumbnail(key, Readable.from([imageThumbnail]), 'image/jpeg');
      file.markCompleted();
      await this.fileRepo.save(file);
    }
  }
}
