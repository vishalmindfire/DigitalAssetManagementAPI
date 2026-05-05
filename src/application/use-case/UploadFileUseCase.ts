import { v4 as uuidv4 } from 'uuid';

import { File } from '#domain/entities/File.js';
import { FileRepository } from '#domain/repositories/fileRepository.js';
import { FileStorage } from '#domain/repositories/fileStorage.js';
import { FileExtension } from '#domain/value-objects/FileExtension.js';
import { FileId } from '#domain/value-objects/FileId.js';
import { FileStatus } from '#domain/value-objects/FileStatus.js';

export class UploadFileUseCase {
  constructor(
    private fileRepo: FileRepository,
    private storage: FileStorage
  ) {}

  async execute(fileName: string, mimeType: string, buffer: Buffer): Promise<File> {
    const rawExt = fileName.split('.').pop() ?? '';
    const ext = FileExtension.from(rawExt as Parameters<typeof FileExtension.from>[0]);
    const fileId = new FileId(uuidv4());
    const storagePath = await this.storage.uploadFile(fileName, buffer, mimeType);

    const file = new File(fileId, fileName, ext, storagePath, FileStatus.PENDING, null);

    await this.fileRepo.save(file);
    return file;
  }
}
