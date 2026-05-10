import { File, FilesResponse } from '#domain/entities/File.js';
import { FileTag } from '#domain/entities/FileTag.js';
import { FileRepository } from '#domain/repositories/fileRepository.js';
import { FileTagRepository } from '#domain/repositories/fileTagRepository.js';
import { FileStatus } from '#domain/value-objects/FileStatus.js';

export class FilterFileUseCase {
  constructor(
    private fileRepo: FileRepository,
    private fileTagRepo: FileTagRepository
  ) {}

  async filterById(id: string): Promise<File | null> {
    return this.fileRepo.findById(id);
  }

  async filterByTag(tag: string): Promise<File[]> {
    const files = await this.fileTagRepo.findByTag(tag);
    return files ?? [];
  }

  async getTag(tag: string): Promise<FileTag | null> {
    return this.fileTagRepo.getTag(tag);
  }

  async getFiles(userid: string, cursorInfo: { fileId: string; createDate: Date } | null, limit: number, role: string): Promise<FilesResponse> {
    const files = await this.fileRepo.getFiles(userid, cursorInfo, limit, role);
    return files;
  }

  async updateFileStatus(id: string, status: string): Promise<void> {
    const file = await this.fileRepo.findById(id);
    if (!file) throw new Error(`File not found: ${id}`);

    const next = FileStatus.from(status as Parameters<typeof FileStatus.from>[0]);

    const transitions: Partial<Record<string, () => void>> = {
      COMPLETED: () => {
        file.markCompleted();
      },
      FAILED: () => {
        file.markFailed();
      },
      PROCESSING: () => {
        file.markProcessing();
      },
    };

    const apply = transitions[next.getValue()];
    if (!apply) throw new Error(`Cannot transition to status: ${status}`);
    apply();

    await this.fileRepo.updateFileStatus(id, next.getValue());
  }
}
