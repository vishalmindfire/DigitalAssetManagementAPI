import { File } from '#domain/entities/File.js';
import { FileTag } from '#domain/entities/FileTag.js';
import { FileRepository } from '#domain/repositories/fileRepository.js';
import { FileTagRepository } from '#domain/repositories/fileTagRepository.js';

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

  async getFiles(limit: number, offset: number): Promise<File[]> {
    const files = await this.fileRepo.getFiles(limit, offset);
    return files ?? [];
  }
}
