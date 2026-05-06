import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

import { File } from '#domain/entities/File.js';
import { FileRepository } from '#domain/repositories/fileRepository.js';
import { FileStorage } from '#domain/repositories/fileStorage.js';
import { FileExtension } from '#domain/value-objects/FileExtension.js';
import { FileId } from '#domain/value-objects/FileId.js';
import { FileStatus } from '#domain/value-objects/FileStatus.js';
import { FileTagRepository } from '#domain/repositories/fileTagRepository.js';

export class UploadFileUseCase {
  constructor(
    private fileRepo: FileRepository,
    private fileTagRepo: FileTagRepository,
    private storage: FileStorage
  ) {}

  async execute(fileName: string, mimeType: string, buffer: Buffer): Promise<File> {
    const rawExt = fileName.split('.').pop() ?? '';
    const ext = FileExtension.from(rawExt as Parameters<typeof FileExtension.from>[0]);
    const fileId = new FileId(uuidv4());
    const storagePath = await this.storage.uploadFile(fileName, Readable.from([buffer]), mimeType);

    const file = new File(fileId, fileId, ext, null, this.storage.getFilesBucket(), storagePath, 0, FileStatus.PENDING, new Date(), null);
    const tags = file.generateFileTags();

    await Promise.all(
      tags.map(async (tag: string) => {
        await this.fileTagRepo.saveTag(tag, file.id);
      })
    );

    await this.fileRepo.save(file);
    return file;
  }
}
