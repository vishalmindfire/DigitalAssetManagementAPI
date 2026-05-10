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

  async execute(fileName: string, mimeType: string, size: number, userid: string): Promise<File> {
    const rawExt = fileName.split('.').pop() ?? '';
    const ext = FileExtension.from(rawExt as Parameters<typeof FileExtension.from>[0]);
    const fileId = new FileId(uuidv4());

    const file = new File(
      fileId,
      fileId,
      ext,
      mimeType,
      this.storage.getFilesBucket(),
      fileName,
      size,
      userid,
      0,
      FileStatus.PENDING,
      new Date(),
      null,
      null
    );
    await this.fileRepo.save(file);
    const tags = file.generateFileTags();
    const presignedURL = await this.storage.getSignedURL(fileName);
    await Promise.all(
      tags.map(async (tag: string) => {
        await this.fileTagRepo.saveTag(tag, file.getId());
      })
    );
    file.setUrl(presignedURL);
    return file;
  }
}
